const TransactionLogger = artifacts.require("TransactionLogger");

module.exports = function(deployer) {
  deployer.deploy(TransactionLogger);
};
