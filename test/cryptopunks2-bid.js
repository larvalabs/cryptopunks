require('babel-polyfill');

var CryptoPunks2 = artifacts.require("./CryptoPunks2.sol");

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
  var digitsToCompare = 8;
  var subPrevBalance = strPrevBalance.substr(strPrevBalance.length - digitsToCompare, strPrevBalance.length);
  var strBalance = String(currentBalance);
  var subCurrBalance = strBalance.substr(strBalance.length - digitsToCompare, strBalance.length);
  console.log("Comparing only least significant digits: "+subPrevBalance+" vs. "+subCurrBalance);
  assert.equal(Number(subCurrBalance), Number(subPrevBalance) + amount, "Account 1 balance incorrect after withdrawal.");
};

contract('CryptoPunks2-bid', function (accounts) {
  it("attempt to bid on an unclaimed to punk", async function () {
    var contract = await CryptoPunks2.deployed();
    // Open up the contract for action
    await contract.allInitialOwnersAssigned();
    try {
        await contract.getPunk(0, {from: accounts[0]});
        await contract.getPunk(1, {from: accounts[1]});
        assert(false, "Should have thrown exception.");
    } catch (err) {
        // Should catch an exception
    }
    // Should fail because it is unclaimed
    await expectThrow(contract.enterBidForPunk(2, {from: accounts[0], value: 1}));
  }),
  it("attempt to bid on your own punk", async function () {
    var contract = await CryptoPunks2.deployed();
    await expectThrow(contract.enterBidForPunk(0, {from: accounts[0], value: 1}));
  }),
  it("attempt to bid with zero value", async function () {
    var contract = await CryptoPunks2.deployed();
    await expectThrow(contract.enterBidForPunk(1, {from: accounts[0], value: 0}));
  }),
  it("do a real bid", async function () {
    var contract = await CryptoPunks2.deployed();
    contract.enterBidForPunk(1, {from: accounts[0], value: 1000});
    // todo - check to see if A0's balance went down
  }),
  it("bid underneath an existing bid", async function () {
    var contract = await CryptoPunks2.deployed();
    await expectThrow(contract.enterBidForPunk(1, {from: accounts[2], value: 500}));
  }),
  it("outbid", async function () {
    var contract = await CryptoPunks2.deployed();
    var account2BalancePrev = await web3.eth.getBalance(accounts[2]);
    await contract.enterBidForPunk(1, {from: accounts[2], value: 3000});
    // todo - check to see if A2's balance went down
    var account2Balance = await web3.eth.getBalance(accounts[2]);
    compareBalance(account2BalancePrev, account2Balance, -3000);
    // Make sure A1 was refunded.
    var amount = await contract.pendingWithdrawals.call(accounts[0]);
    assert.equal(1000, amount);
    // Make sure withdraw works
    await contract.withdraw({from: accounts[0]});
    var newAmount = await contract.pendingWithdrawals.call(accounts[0]);
    assert.equal(0, newAmount);
  }),
  it("wrong owner tries to accept bid", async function () {
    var contract = await CryptoPunks2.deployed();
    await expectThrow(contract.acceptBidForPunk(1, {from: accounts[0]}));
  }),
  it("try to accept bid for a punk that has no bid", async function () {
    var contract = await CryptoPunks2.deployed();
    await expectThrow(contract.acceptBidForPunk(0, {from: accounts[0]}));
  }),
  it("accept bid from A2", async function () {
    var contract = await CryptoPunks2.deployed();
    var allAssigned = await contract.allPunksAssigned.call();
    console.log("AllAssigned: " + allAssigned);

    var bid = await contract.punkBids.call(1);
    var currentOwner = await contract.punkIndexToAddress.call(1);
    console.log("Current owner: "+currentOwner);
    console.log("Bid: "+bid);
    await contract.acceptBidForPunk(1, {from: accounts[1]});
    console.log("Bid accepted");
    // Was A1 paid?
    var amount = await contract.pendingWithdrawals.call(accounts[1]);
    assert.equal(3000, amount);
    // Does A2 own the punk
    var owner = await contract.punkIndexToAddress.call(1);
    assert.equal(owner, accounts[2]);
    var balance1 = await contract.balanceOf.call(accounts[1]);
    var balance2 = await contract.balanceOf.call(accounts[2]);
    assert.equal(balance1, 0);
    assert.equal(balance2, 1);
    // Ensure bid object has been zeroed out
    var bid = await contract.punkBids.call(1);
    assert.equal(false, bid[0]);
  }),
  it("offer up a punk for sale, then get a lower bid, accept that bid", async function () {
    var contract = await CryptoPunks2.deployed();
    await contract.offerPunkForSale(0, 9000, {from: accounts[0]});
    await contract.enterBidForPunk(0, {from: accounts[2], value: 5000});
    await contract.acceptBidForPunk(0, {from: accounts[0]});
    // Make sure transaction went through at 5000 price level
    var balance0 = await contract.balanceOf.call(accounts[0]);
    var balance2 = await contract.balanceOf.call(accounts[2]);
    assert.equal(balance0, 0);
    assert.equal(balance2, 2);
    var owner = await contract.punkIndexToAddress.call(0);
    assert.equal(owner, accounts[2]);
    var amount = await contract.pendingWithdrawals.call(accounts[0]);
    assert.equal(5000, amount);
    // Ensure offer object has been zeroed out
    var offer = await contract.punksOfferedForSale.call(0);
    assert.equal(false, offer[0]);
  })
});
