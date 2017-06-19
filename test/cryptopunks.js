var CryptoPunks = artifacts.require("./CryptoPunks.sol");

/*
contract('CryptoPunks', function (accounts) {
    it("should have 10000 punks available to assign", function () {
        return CryptoPunks.deployed().then(function (instance) {
            // console.log("Deployed");
            return instance.punksRemainingToAssign.call();
        }).then(function (balance) {
            assert.equal(balance.valueOf(), 10000, "10000 punks not available.");
        });
    }),
        it("should be able to reserve, buy and sell punks", function () {
            var contract;
            var previousBalance;
            var punksRemainingToAssign;
            var numberOfPunksToReserve;
            var numberOfPunksReserved;
            var NULL_ACCOUNT = "0x0000000000000000000000000000000000000000";

            return CryptoPunks.deployed().then(function (instance) {
                // console.log("Deployed");
                contract = instance;
                return instance.reservePunksForOwner(50);
            }).then(function () {
                return contract.balanceOf.call(accounts[0]);
            }).then(function (result) {
                assert.equal(result.valueOf(), 50, "50 punks were not assigned to owner.");
                return contract.punksRemainingToAssign.call();
            }).then(function (result) {
                assert.equal(result.valueOf(), 9950, "Incorrect remaining punks.");
                return contract.numberOfPunksReserved.call();
            }).then(function (result) {
                assert.equal(result.valueOf(), 50, "Count of punks reserved is incorrect.");
                return contract.numberOfPunksToReserve.call();
            }).then(function (result) {
                assert.equal(result.valueOf(), 1000, "Count of punks to reserve is incorrect.");
                return contract.punksRemainingToAssign.call();
            }).then(function (result) {
                assert.equal(result.valueOf(), 9950, "Incorrect remaining punks.");
                // reserve remaining punks
                var reservationPromises = [];
                for (var i=0; i < 19; i++) {
                    reservationPromises.push(contract.reservePunksForOwner(50));
                }
                Promise.all(reservationPromises).then(function() {
                    return contract.balanceOf.call(accounts[0]);
                }).then(function (result) {
                    console.log("Owner of contract now has "+result.valueOf()+" punks.");
                    assert.equal(result.valueOf(), 1000, "1000 punks were not assigned to owner.");
                    // try one more reserve which should fail
                    return contract.reservePunksForOwner(50);
                }).then(function (returnValue) {
                    assert(false, "Was supposed to throw but didn't.");
                }).catch(function (error) {
                    if (error.toString().indexOf("invalid opcode") != -1) {
                        // Expecting a throw here
                        // console.log("We were expecting a Solidity throw (aka an invalid JUMP), we got one. Test succeeded.");
                    } else {
                        // if the error is something else (e.g., the assert from previous promise), then we fail the test
                        assert(false, error.toString());
                    }
                }).then(function() {
                    return contract.getPunk(1000);
                }).then(function() {
                    return contract.balanceOf.call(accounts[0]);
                }).then(function(result) {
                    assert.equal(result.valueOf(), 1001, "Should have 1001 punks now.");
                    return contract.punksRemainingToAssign();
                }).then(function(result) {
                    assert.equal(result.valueOf(), 8999, "Should have 8999 punks remaining to assign.");
                    return contract.nextPunkIndexToAssign();
                }).then(function(result) {
                    assert.equal(result.valueOf(), 1000, "Punk assign index should stay at 1000.");

                    console.log("Trying to get punk 500 when it's already assigned.");

                    return contract.getPunk(500, {from: accounts[1]});
                }).then(function () {
                    // console.log("Bought punk.");
                    assert(false, "Was supposed to throw but didn't.");
                }).catch(function (error) {
                    if (error.toString().indexOf("invalid opcode") != -1) {
                        // Expecting a throw here
                        // console.log("We were expecting a Solidity throw (aka an invalid JUMP), we got one. Test succeeded.");
                    } else {
                        // if the error is something else (e.g., the assert from previous promise), then we fail the test
                        assert(false, error.toString());
                    }
                    // Get account 0 to buy a punk with enough ether

                    // Send ether to other accounts so they can run some tests
                    web3.eth.sendTransaction({from:accounts[0], to:accounts[2], value: 10000000})
                    return web3.eth.sendTransaction({from:accounts[0], to:accounts[1], value: 10000000});
                }).then(function() {
                    // Try to transfer a punk from someone who doesn't own it
                    return contract.transferPunk(accounts[1], 1000, {from: accounts[1]});
                }).then(function (returnValue) {
                    assert(false, "Was supposed to throw but didn't.");
                }).catch(function (error) {
                    if (error.toString().indexOf("invalid opcode") != -1) {
                        // Expecting a throw here
                        // console.log("We were expecting a Solidity throw (aka an invalid JUMP), we got one. Test succeeded.");
                    } else {
                        // if the error is something else (e.g., the assert from previous promise), then we fail the test
                        assert(false, error.toString());
                    }

                }).then(function() {
                    // Give all remaining punks to account 1
                    console.log("Getting a bunch of punks for account 1.");
                    var promises = [];
                    for (var i=0; i < 100; i++) {
                        promises.push(contract.getPunk(1001+i, {from: accounts[1]}));
                    }

                    Promise.all(promises).then(function() {
                        return contract.balanceOf.call(accounts[1]);
                    }).then(function(result) {
                        console.log("Account 1 now has "+result.valueOf()+" punks.");
                        assert.equal(result.valueOf(), 100, "Should have 100 punks in account 1 now.");
                        return contract.offerPunkForSale(1001, 10000, {from: accounts[1]});
                    }).then(function () {
                        return contract.punksOfferedForSale(1001);
                    }).then(function (offer) {
                        console.log("Offer for sale: "+offer);
                        assert.isOk(offer[0], "Punk was not actually for sale.");
                        assert.equal(offer[3], 10000, "Punk sale price incorrect.");
                        assert.equal(offer[4], NULL_ACCOUNT, "Punk should be for sale to anyone.");
                        // Get account 0 to buy a punk, but send too little ether and expect an exception
                        return contract.buyPunk(1001, {from: accounts[0], value: 1000});
                    }).then(function () {
                        // console.log("Bought punk.");
                        assert(false, "Was supposed to throw but didn't.");
                    }).catch(function (error) {
                        if (error.toString().indexOf("invalid opcode") != -1) {
                            // Expecting a throw here
                            // console.log("We were expecting a Solidity throw (aka an invalid JUMP), we got one. Test succeeded.");
                        } else {
                            // if the error is something else (e.g., the assert from previous promise), then we fail the test
                            assert(false, error.toString());
                        }
                        // Get account 0 to buy a punk with enough ether
                        console.log("Buying punk 1001 with correct amount of ether.");
                        return contract.buyPunk(1001, {from: accounts[0], value: 10000});
                    }).then(function (address) {
                        console.log("Checking punk 1001 owned by account 0.");
                        return contract.punkIndexToAddress(1001);
                    }).then(function (address) {
                        assert.equal(accounts[0], address, "Did not buy the punk successfully.");
                        console.log("Making sure punk 1001 is no longer for sale.");
                        return contract.punksOfferedForSale(1001);
                    }).then(function (offer) {
                        console.log("Offer for sale: "+offer);
                        assert.equal(offer[0], false, "Punk was still for sale.");

                        console.log("Making sure punk 1001 can't be bought.");
                        return contract.buyPunk(1001, {from: accounts[2], value: 10000});
                    }).then(function () {
                        // console.log("Bought punk.");
                        assert(false, "Was supposed to throw but didn't.");
                    }).catch(function (error) {
                        if (error.toString().indexOf("invalid opcode") != -1) {
                            // Expecting a throw here
                            // console.log("We were expecting a Solidity throw (aka an invalid JUMP), we got one. Test succeeded.");
                        } else {
                            // if the error is something else (e.g., the assert from previous promise), then we fail the test
                            assert(false, error.toString());
                        }

                        console.log("Offer punk 1001 for sale only to account 2.");
                        return contract.offerPunkForSaleToAddress(1001, 10000, accounts[2], {from: accounts[0]});
                       // return contract.punkIndexToAddress(1001);
                    }).then(function (address) {
                        console.log("Try to get account 1 to buy punk 1001 but fail.");
                        return contract.buyPunk(1001, {from: accounts[1], value: 10000});
                    }).then(function () {
                        // console.log("Bought punk.");
                        assert(false, "Was supposed to throw but didn't.");
                    }).catch(function (error) {
                        if (error.toString().indexOf("invalid opcode") != -1) {
                            // Expecting a throw here
                            // console.log("We were expecting a Solidity throw (aka an invalid JUMP), we got one. Test succeeded.");
                        } else {
                            // if the error is something else (e.g., the assert from previous promise), then we fail the test
                            assert(false, error.toString());
                        }
                        // Get account 0 to buy a punk with enough ether
                        console.log("Buying punk 1001 with account 2 which should be allowed.");
                        return contract.buyPunk(1001, {from: accounts[2], value: 10000});
                    }).then(function (address) {
                        console.log("Checking punk 1001 now owned by account 2.");
                        return contract.punkIndexToAddress(1001);
                    }).then(function (address) {
                        assert.equal(accounts[2], address, "Account 2 did not buy the punk successfully.");
                        console.log("Offer punk 1001 again.");
                        return contract.offerPunkForSale(1001, 10000, {from: accounts[2]});
                    }).then(function (address) {
                        console.log("Try to make it no longer available for sale.");
                        return contract.punkNoLongerForSale(1001, {from: accounts[2]});
                    }).then(function (address) {
                        return contract.punksOfferedForSale(1001);
                    }).then(function (offer) {
                        console.log("Offer for sale: " + offer);
                        assert.equal(offer[0], false, "Punk was still for sale.");
                        console.log("Check that punk purchase price is available for withdrawal.");
                        return contract.pendingWithdrawals(accounts[0]);
                    }).then(function (balance) {
                        assert.equal(balance, 10000, "Account 0 balance incorrect.");
                    }).then(function () {
                        return web3.eth.getBalance(accounts[0]);
                    }).then(function (balance) {
                        previousBalance = balance;
                        console.log("Previous account 0 balance: "+balance);
                        console.log("Withdrawing balance for account 0 from contract.");
                        return contract.withdraw();
                    }).then(function () {
                        console.log("Checking new account balance after withdrawal.");
                        return web3.eth.getBalance(accounts[0]);
                    }).then(function (balance) {
                        console.log("Balance after withdrawal: " + balance);
                        var strPrevBalance = String(previousBalance);
                        var subPrevBalance = strPrevBalance.substr(strPrevBalance.length - 6, strPrevBalance.length);
                        var strBalance = String(balance);
                        var subCurrBalance = strBalance.substr(strBalance.length - 6, strBalance.length);
                        console.log("Comparing only least significant digits: "+subPrevBalance+" vs. "+subCurrBalance);
                        assert.equal(Number(subCurrBalance), Number(subPrevBalance) + 10000, "Account 0 balance incorrect after withdrawal.");
                    })
                        // return contract.nextPunkIndexToAssign();
                })
        });
    });
});
*/
