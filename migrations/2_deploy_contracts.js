var ConvertLib = artifacts.require("./ConvertLib.sol");
var CryptoPunks = artifacts.require("./CryptoPunks.sol");
var CryptoPunksMarket = artifacts.require("./CryptoPunksMarket.sol");

module.exports = function(deployer) {
  deployer.deploy(ConvertLib);
  deployer.link(ConvertLib, CryptoPunks);
  deployer.deploy(CryptoPunks);
  deployer.deploy(CryptoPunksMarket);
};
