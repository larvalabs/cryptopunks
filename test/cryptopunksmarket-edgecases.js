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
  it("re-assign a punk during assignment phase, assign same punk twice", async function () {
    var contract = await CryptoPunksMarket.deployed();
    // Assign a two punks, then re-assign one of them
    await contract.setInitialOwner(accounts[3], 500, {from: accounts[0]});
    await contract.setInitialOwner(accounts[4], 501, {from: accounts[0]});
    await contract.setInitialOwner(accounts[4], 500, {from: accounts[0]});
    await contract.setInitialOwner(accounts[4], 501, {from: accounts[0]});
    // Check the balances
    var balance3 = await contract.balanceOf.call(accounts[3]);
    var balance4 = await contract.balanceOf.call(accounts[4]);
    assert.equal(balance3, 0);
    assert.equal(balance4, 2);
    // Check ownership
    var currentOwner = await contract.punkIndexToAddress.call(500);
    assert.equal(accounts[4], currentOwner);
    // Check the number of punks left to assign
    var leftToAssign = await contract.punksRemainingToAssign.call();
    assert.equal(leftToAssign, 9998);
  }),
  it("place a bid, then transfer the punk, then new owner accepts bid", async function () {
    var contract = await CryptoPunksMarket.deployed();
    // Open up the contract for action, assign some punks
    await contract.allInitialOwnersAssigned();
    await contract.getPunk(1001, {from: accounts[1]});
    await contract.getPunk(1002, {from: accounts[5]});
    await contract.getPunk(1003, {from: accounts[8]});
    var punkIndex = 1001;
    var firstOwner = accounts[1];
    var bidder = accounts[0];
    var newOwner = accounts[2];
    var bidPrice = 8000;
    // Check initial ownership
    var initialOwner = await contract.punkIndexToAddress.call(punkIndex);
    assert.equal(firstOwner, initialOwner);
    // Bidder bids on punk
    var accountBalancePrev = await web3.eth.getBalance(bidder);
    await contract.enterBidForPunk(punkIndex, {from: bidder, value: bidPrice});
    // Owner transfers it to New Owner
    await contract.transferPunk(newOwner, punkIndex, {from: firstOwner});
    // New owner accepts original bid
    var pendingAmount = await contract.pendingWithdrawals.call(bidder);
    assert.equal(0, pendingAmount);
    // console.log("Prev acc0: " + accountBalancePrev);
    await contract.acceptBidForPunk(punkIndex, bidPrice, {from: newOwner});
    // Make sure A0 was charged
    var accountBalance = await web3.eth.getBalance(bidder);
    //console.log("Post acc0: " + accountBalance);
    compareBalance(accountBalancePrev, accountBalance, -bidPrice);
    // Make sure new owner was paid
    var amount = await contract.pendingWithdrawals.call(newOwner);
    assert.equal(bidPrice, amount);
    await contract.withdraw({from: newOwner});
    var newAmount = await contract.pendingWithdrawals.call(newOwner);
    assert.equal(0, newAmount);
    // Check ownership
    var currentOwner = await contract.punkIndexToAddress.call(punkIndex);
    assert.equal(bidder, currentOwner);
    // Check the balances
    var balance0 = await contract.balanceOf.call(bidder);
    var balance1 = await contract.balanceOf.call(firstOwner);
    var balance2 = await contract.balanceOf.call(newOwner);
    assert.equal(balance0, 1);
    assert.equal(balance1, 0);
    assert.equal(balance2, 0);
  }),
  it("place a bid, then owner offers for sale, somebody accepts that offer", async function () {
    var contract = await CryptoPunksMarket.deployed();
    var punkIndex = 1002;
    var firstOwner = accounts[5];
    var bidder = accounts[6];
    var buyer = accounts[7];
    var bidPrice = 7000;
    var salePrice = 9000;
    // Check initial ownership
    var initialOwner = await contract.punkIndexToAddress.call(punkIndex);
    assert.equal(firstOwner, initialOwner);
    // Bidder bids on punk
    await contract.enterBidForPunk(punkIndex, {from: bidder, value: bidPrice});
    // Owner offers it for sale
    await contract.offerPunkForSale(punkIndex, salePrice, {from: firstOwner});
    // Buyer buys
    var accountBalancePrev = await web3.eth.getBalance(buyer);
    await contract.buyPunk(punkIndex, {from: buyer, value: salePrice});
    // Make sure Buyer was charged
    var accountBalance = await web3.eth.getBalance(buyer);
    compareBalance(accountBalancePrev, accountBalance, -salePrice);
    // Make sure First Owner was paid
    var amount = await contract.pendingWithdrawals.call(firstOwner);
    assert.equal(salePrice, amount);
    await contract.withdraw({from: firstOwner});
    var newAmount = await contract.pendingWithdrawals.call(firstOwner);
    assert.equal(0, newAmount);
    // Check ownership
    var currentOwner = await contract.punkIndexToAddress.call(punkIndex);
    assert.equal(buyer, currentOwner);
    // Check the balances
    var balance0 = await contract.balanceOf.call(bidder);
    var balance1 = await contract.balanceOf.call(firstOwner);
    var balance2 = await contract.balanceOf.call(buyer);
    assert.equal(balance0, 0);
    assert.equal(balance1, 0);
    assert.equal(balance2, 1);
    // Make sure the bid is still in place
    var bid = await contract.punkBids.call(punkIndex);
    assert.equal(true, bid[0]);
    assert.equal(punkIndex, bid[1]);
    assert.equal(bidPrice, bid[3]);
  }),
  it("place a bid, then owner offers for sale, then bidder accepts that offer", async function () {
    var contract = await CryptoPunksMarket.deployed();
    var punkIndex = 1003;
    var firstOwner = accounts[8];
    var bidder = accounts[9];
    var bidPrice = 14000;
    var salePrice = 15000;
    // Check initial ownership
    var initialOwner = await contract.punkIndexToAddress.call(punkIndex);
    assert.equal(firstOwner, initialOwner);
    // Bidder bids on punk
    console.log("About to enter bid");
    var accountBalancePrev = await web3.eth.getBalance(bidder);
    await contract.enterBidForPunk(punkIndex, {from: bidder, value: bidPrice});
    console.log("Enter bid");
    // Owner offers it for sale
    await contract.offerPunkForSale(punkIndex, salePrice, {from: firstOwner});
    console.log("Offer for sale");
    // Bidder buys
    await contract.buyPunk(punkIndex, {from: bidder, value: 15000});
    console.log("Buy punk");
    // Make sure bidder was charged for both bid and sale
    var accountBalance = await web3.eth.getBalance(bidder);
    compareBalance(accountBalancePrev, accountBalance, -(bidPrice + salePrice));
    // Make sure seller was paid
    var amount = await contract.pendingWithdrawals.call(firstOwner);
    console.log("Amount: " + amount);
    assert.equal(salePrice, amount);
    await contract.withdraw({from: firstOwner});
    var newAmount = await contract.pendingWithdrawals.call(firstOwner);
    assert.equal(0, newAmount);    
    // Check ownership
    var currentOwner = await contract.punkIndexToAddress.call(punkIndex);
    assert.equal(bidder, currentOwner);
    // Check the balances
    var balance0 = await contract.balanceOf.call(bidder);
    var balance1 = await contract.balanceOf.call(firstOwner);
    assert.equal(balance0, 1);
    assert.equal(balance1, 0);
    // Make sure the bid is now gone
    var bid = await contract.punkBids.call(punkIndex);
    assert.equal(false, bid[0]);
    // Make sure bidder was refunded for bid
    var amount1 = await contract.pendingWithdrawals.call(bidder);
    console.log("Amount1: " + amount1);
    assert.equal(bidPrice, amount1);
    await contract.withdraw({from: bidder});
    var newAmount1 = await contract.pendingWithdrawals.call(bidder);
    assert.equal(0, newAmount1);
  }),
  it("place a bid, then owner transfers punk to bidder", async function () {
    var contract = await CryptoPunksMarket.deployed();
    var punkIndex = 501;
    var firstOwner = accounts[4];
    var bidder = accounts[3];
    var bidPrice = 10000;    
    // Check initial ownership
    var initialOwner = await contract.punkIndexToAddress.call(punkIndex);
    assert.equal(firstOwner, initialOwner);
    // Bidder bids on punk
    await contract.enterBidForPunk(punkIndex, {from: bidder, value: bidPrice});
    // Owner transfers it to Bidder
    await contract.transferPunk(bidder, punkIndex, {from: firstOwner});
    // Check ownership
    var currentOwner = await contract.punkIndexToAddress.call(punkIndex);
    assert.equal(bidder, currentOwner);
    // Check the balances
    var balance0 = await contract.balanceOf.call(bidder);
    var balance1 = await contract.balanceOf.call(firstOwner);
    assert.equal(balance0, 1);
    assert.equal(balance1, 1);
    // Make sure the bid is now gone
    var bid = await contract.punkBids.call(punkIndex);
    assert.equal(false, bid[0]);
    // Make sure bidder was refunded for bid
    var amount = await contract.pendingWithdrawals.call(bidder);
    assert.equal(bidPrice, amount);
    await contract.withdraw({from: bidder});
    var newAmount = await contract.pendingWithdrawals.call(bidder);
    assert.equal(0, newAmount);
  })
});
