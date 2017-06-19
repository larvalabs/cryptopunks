require('babel-polyfill');
var CryptoPunks2 = artifacts.require("./CryptoPunks2.sol");

contract('CryptoPunks2', function (accounts) {
  it("Should start with 0 balance", async function () {
    var contract = await CryptoPunks2.deployed();

    await contract.setInitialOwner(accounts[0],0);
    var balance = await contract.balanceOf.call(accounts[0]);
    assert.equal(balance.valueOf(), 1, "Didn't get the initial punk");
    var owner = await contract.punkIndexToAddress.call(0);
    assert.equal(owner, accounts[0], "Ownership array wrong");
    var remaining = await contract.punksRemainingToAssign.call();
    assert.equal(9999, remaining);
  }),
  it("Can not claim punk after set initial owners assigned", async function () {
    var contract = await CryptoPunks2.deployed();
    await contract.allInitialOwnersAssigned();
    try {
      await contract.setInitialOwner(accounts[0],0);
      assert(false, "Should have thrown exception.");
    } catch (err) {
      // Should catch an exception
    }

  }),
  it("can not pass an invalid index to assign initial", async function () {
    var contract = await CryptoPunks2.deployed();
    try {
      await contract.setInitialOwner(accounts[0],10000);
      assert(false, "Should have thrown exception.");
    } catch (err) {
      // Should catch an exception
    }

  }),
  it("only owner can assign initial", async function () {
    var contract = await CryptoPunks2.deployed();
    try {
      await contract.setInitialOwner(accounts[1],1);
      assert(false, "Should have thrown exception.");
    } catch (err) {
      // Should catch an exception
    }

  })
});
