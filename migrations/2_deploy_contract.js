const HERC20 = artifacts.require("HERC20");

module.exports = async (deployer) => {
  const name = "Holdable Token";
  const symbol = "htkn";
  const accounts = await web3.eth.getAccounts();
  const owner = accounts[0];
  const totalSupply = web3.utils.toWei("1000", "ether").toString();

  //deploy HERC20
  await deployer.deploy(HERC20, name, symbol, owner, totalSupply);
};
