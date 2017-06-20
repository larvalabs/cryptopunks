require('babel-polyfill');
var CryptoPunksMarket = artifacts.require("./CryptoPunksMarket.sol");

contract('CryptoPunksMarket-setInitial', function (accounts) {
  it("Should start with 0 balance", async function () {
    var contract = await CryptoPunksMarket.deployed();

    await contract.setInitialOwner(accounts[0], 0);
    var balance = await contract.balanceOf.call(accounts[0]);
    assert.equal(balance.valueOf(), 1, "Didn't get the initial punk");
    var owner = await contract.punkIndexToAddress.call(0);
    assert.equal(owner, accounts[0], "Ownership array wrong");
    var remaining = await contract.punksRemainingToAssign.call();
    assert.equal(9999, remaining);

    // todo Set this back to 10000 for final runs
    var assignCoins = 100;
    for (var i=1; i<assignCoins; i++) {
      await contract.setInitialOwner(accounts[0], i);
    }

    var remainingAfter = await contract.punksRemainingToAssign.call();
    assert.equal(10000-assignCoins, remainingAfter);
    var balanceAfter = await contract.balanceOf.call(accounts[0]);
    assert.equal(assignCoins, balanceAfter);

  }),
    it("Can not claim punk after set initial owners assigned", async function () {
      var contract = await CryptoPunksMarket.deployed();
      await contract.allInitialOwnersAssigned();
      try {
        await contract.setInitialOwner(accounts[0], 0);
        assert(false, "Should have thrown exception.");
      } catch (err) {
        // Should catch an exception
      }

    }),
    it("can not pass an invalid index to assign initial", async function () {
      var contract = await CryptoPunksMarket.deployed();
      try {
        await contract.setInitialOwner(accounts[0], 10000);
        assert(false, "Should have thrown exception.");
      } catch (err) {
        // Should catch an exception
      }

    }),
    it("only owner can assign initial", async function () {
      var contract = await CryptoPunksMarket.deployed();
      try {
        await contract.setInitialOwner(accounts[1], 1);
        assert(false, "Should have thrown exception.");
      } catch (err) {
        // Should catch an exception
      }

    })
});
