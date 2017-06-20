require('babel-polyfill');

var CryptoPunksMarket = artifacts.require("./CryptoPunksMarket.sol");

var expectThrow = async function(promise) {
  try {
    await promise;
  } catch (error) {
    // TODO: Check jump destination to destinguish between a throw
    //       and an actual invalid jump.
    const invalidOpcode = error.message.search('invalid opcode') >= 0;
    const invalidJump = error.message.search('invalid JUMP') >= 0;
    // TODO: When we contract A calls contract B, and B throws, instead
    //       of an 'invalid jump', we get an 'out of gas' error. How do
    //       we distinguish this from an actual out of gas event? (The
    //       testrpc log actually show an 'invalid jump' event.)
    const outOfGas = error.message.search('out of gas') >= 0;
    assert(
      invalidOpcode || invalidJump || outOfGas,
      "Expected throw, got '" + error + "' instead",
    );
    return;
  }
  assert.fail('Expected throw not received');
};

var compareBalance = function(previousBalance, currentBalance, amount) {
  var strPrevBalance = String(previousBalance);
  var digitsToCompare = 10;
  var subPrevBalance = strPrevBalance.substr(strPrevBalance.length - digitsToCompare, strPrevBalance.length);
  var strBalance = String(currentBalance);
  var subCurrBalance = strBalance.substr(strBalance.length - digitsToCompare, strBalance.length);
  console.log("Comparing only least significant digits: "+subPrevBalance+" vs. "+subCurrBalance);
  assert.equal(Number(subCurrBalance), Number(subPrevBalance) + amount, "Account 1 balance incorrect after withdrawal.");
};

contract('CryptoPunksMarket-edgecases', function (accounts) {
  it("re-assign a punk during assignment phase", async function () {
    var contract = await CryptoPunksMarket.deployed();
    // Assign a two punks, then re-assign one of them
    await contract.setInitialOwner(accounts[3], 500, {from: accounts[0]});
    await contract.setInitialOwner(accounts[4], 501, {from: accounts[0]});
    await contract.setInitialOwner(accounts[4], 500, {from: accounts[0]});
    // Check the balances
    var balance3 = await contract.balanceOf.call(accounts[3]);
    var balance4 = await contract.balanceOf.call(accounts[4]);
    assert.equal(balance3, 0);
    assert.equal(balance4, 2);
    // Check ownership
    var currentOwner = await contract.punkIndexToAddress.call(500);
    assert.equal(accounts[4], currentOwner);
    // Check the number of punks left to assign
    var leftToAssign = await contract.punksRemainingToAssign.call(accounts[0]);
    assert.equal(leftToAssign, 9998);
  }),
  it("place a bid, then transfer the punk, then new owner accepts bid", async function () {
    var contract = await CryptoPunksMarket.deployed();
    // Open up the contract for action, assign some punks
    await contract.allInitialOwnersAssigned();
    await contract.getPunk(0, {from: accounts[0]});
    await contract.getPunk(1, {from: accounts[1]});
    await contract.getPunk(2, {from: accounts[2]});
    // A0 bids on punk 1
    await contract.enterBidForPunk(1, {from: accounts[0], value: 8000});
    // A1 owner transfers it to A2
    await contract.transferPunk(accounts[2], 1, {from: accounts[1]});
    // A2 accepts A0's original bid
    var account0BalancePrev = await web3.eth.getBalance(accounts[0]);
    await contract.acceptBidForPunk(1, 8000, {from: accounts[2]}));
    // Make sure A0 was charged
    var account0Balance = await web3.eth.getBalance(accounts[0]);
    compareBalance(account0BalancePrev, account0Balance, -8000);
    // Make sure A2 was paid
    var amount = await contract.pendingWithdrawals.call(accounts[2]);
    assert.equal(8000, amount);
    await contract.withdraw({from: accounts[2]});
    var newAmount = await contract.pendingWithdrawals.call(accounts[2]);
    assert.equal(0, newAmount);
    // Check ownership
    var currentOwner = await contract.punkIndexToAddress.call(1);
    assert.equal(accounts[0], currentOwner);
    // Check the balances
    var balance0 = await contract.balanceOf.call(accounts[0]);
    var balance1 = await contract.balanceOf.call(accounts[1]);
    var balance2 = await contract.balanceOf.call(accounts[2]);
    assert.equal(balance0, 2);
    assert.equal(balance1, 0);
    assert.equal(balance2, 1);
  }),
  it("place a bid, then owner offers for sale, somebody accepts that offer", async function () {
    var contract = await CryptoPunksMarket.deployed();
    // A1 bids on punk 0
    await contract.enterBidForPunk(0, {from: accounts[1], value: 7000});
    // A0 offers it for sale
    await contract.offerPunkForSale(0, 9000, {from: accounts[0]});
    // A2 buys
    var account2BalancePrev = await web3.eth.getBalance(accounts[2]);
    await contract.buyPunk(0, {from: accounts[2], value: 9000});
    // Make sure A2 was charged
    var account2Balance = await web3.eth.getBalance(accounts[2]);
    compareBalance(account2BalancePrev, account2Balance, -9000);
    // Make sure A0 was paid
    var amount = await contract.pendingWithdrawals.call(accounts[0]);
    assert.equal(9000, amount);
    await contract.withdraw({from: accounts[0]});
    var newAmount = await contract.pendingWithdrawals.call(accounts[0]);
    assert.equal(0, newAmount);
    // Check ownership
    var currentOwner = await contract.punkIndexToAddress.call(0);
    assert.equal(accounts[2], currentOwner);
    // Check the balances
    var balance0 = await contract.balanceOf.call(accounts[0]);
    var balance1 = await contract.balanceOf.call(accounts[1]);
    var balance2 = await contract.balanceOf.call(accounts[2]);
    assert.equal(balance0, 1);
    assert.equal(balance1, 0);
    assert.equal(balance2, 2);
    // Make sure the bid is still in place
    var bid = await contract.punkBids.call(0);
    assert.equal(true, bid[0]);
    assert.equal(0, bid[1]);
    assert.equal(7000, bid[3]);
  }),
  it("place a bid, then owner offers for sale, then bidder accepts that offer", async function () {
    var contract = await CryptoPunksMarket.deployed();
    // A1 bids on punk 1
    await contract.enterBidForPunk(1, {from: accounts[1], value: 4000});
    // A2 offers it for sale
    await contract.offerPunkForSale(0, 5000, {from: accounts[2]});
    // A1 buys
    var account1BalancePrev = await web3.eth.getBalance(accounts[1]);
    await contract.buyPunk(0, {from: accounts[1], value: 5000});
    // Make sure A1 was charged
    var account1Balance = await web3.eth.getBalance(accounts[1]);
    compareBalance(account1BalancePrev, account2Balance, -5000);
    // Make sure A2 was paid
    var amount = await contract.pendingWithdrawals.call(accounts[2]);
    assert.equal(5000, amount);
    await contract.withdraw({from: accounts[2]});
    var newAmount = await contract.pendingWithdrawals.call(accounts[2]);
    assert.equal(0, newAmount);    
    // Check ownership
    var currentOwner = await contract.punkIndexToAddress.call(1);
    assert.equal(accounts[1], currentOwner);
    // Check the balances
    var balance0 = await contract.balanceOf.call(accounts[0]);
    var balance1 = await contract.balanceOf.call(accounts[1]);
    var balance2 = await contract.balanceOf.call(accounts[2]);
    assert.equal(balance0, 1);
    assert.equal(balance1, 1);
    assert.equal(balance2, 1);
    // Make sure the bid is now gone
    var bid = await contract.punkBids.call(1);
    assert.equal(false, bid[1]);
    // Make sure A1 was refunded for bid
    var amount1 = await contract.pendingWithdrawals.call(accounts[1]);
    assert.equal(4000, amount1);
    await contract.withdraw({from: accounts[1]});
    var newAmount1 = await contract.pendingWithdrawals.call(accounts[1]);
    assert.equal(0, newAmount1);
  }),
  it("place a bid, then owner transfers punk to bidder", async function () {
    var contract = await CryptoPunksMarket.deployed();
    // A1 bids on punk 2
    await contract.enterBidForPunk(2, {from: accounts[1], value: 10000});
    // A2 transfers it to A1
    await contract.transferPunk(accounts[1], 2, {from: accounts[2]});
    // Check ownership
    var currentOwner = await contract.punkIndexToAddress.call(2);
    assert.equal(accounts[1], currentOwner);
    // Check the balances
    var balance0 = await contract.balanceOf.call(accounts[0]);
    var balance1 = await contract.balanceOf.call(accounts[1]);
    var balance2 = await contract.balanceOf.call(accounts[2]);
    assert.equal(balance0, 1);
    assert.equal(balance1, 2);
    assert.equal(balance2, 0);
    // Make sure the bid is now gone
    var bid = await contract.punkBids.call(1);
    assert.equal(false, bid[1]);
    // Make sure A1 was refunded for bid
    var amount = await contract.pendingWithdrawals.call(accounts[1]);
    assert.equal(10000, amount);
    await contract.withdraw({from: accounts[1]});
    var newAmount = await contract.pendingWithdrawals.call(accounts[1]);
    assert.equal(0, newAmount);
  })
});
