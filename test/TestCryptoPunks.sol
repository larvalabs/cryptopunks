pragma solidity ^0.4.8;


import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/CryptoPunks.sol";


contract TestCryptoPunks {

    function testInitialBalanceUsingDeployedContract() {
        CryptoPunks punks = CryptoPunks(DeployedAddresses.CryptoPunks());

        Assert.equal(punks.balanceOf(tx.origin), 0, "Owner should have 0 punks initially");
        Assert.equal(punks.punksRemainingToAssign(), 10000, "Should be all punks remaining.");

//        punks.reservePunksForOwner(50);
//        Assert.equal(punks.balanceOf(tx.origin), 50, "Now owner should have 50 punks.");
    }


}
