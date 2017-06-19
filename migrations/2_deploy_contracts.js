var ConvertLib = artifacts.require("./ConvertLib.sol");
var CryptoPunks = artifacts.require("./CryptoPunks.sol");
var CryptoPunks2 = artifacts.require("./CryptoPunks2.sol");

module.exports = function(deployer) {
  deployer.deploy(ConvertLib);
  deployer.link(ConvertLib, CryptoPunks);
  deployer.deploy(CryptoPunks);
  deployer.deploy(CryptoPunks2);
};
