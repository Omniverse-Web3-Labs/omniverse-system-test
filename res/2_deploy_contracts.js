const OmniverseProtocolHelper = artifacts.require("OmniverseProtocolHelper");
const SkywalkerFungible = artifacts.require("SkywalkerFungible");
const SkywalkerNonFungible = artifacts.require("SkywalkerNonFungible");
const fs = require("fs");

const CHAIN_IDS = {
  CHAINS_ID_TEMPLATE
};

module.exports = async function (deployer, network) {
  const contractAddressFile = './config/default.json';
  let data = fs.readFileSync(contractAddressFile, 'utf8');
  let jsonData = JSON.parse(data);
  if (!jsonData[network]) {
    console.error('There is no config for: ', network, ', please add.');
    return;
  }

  await deployer.deploy(OmniverseProtocolHelper);
  await deployer.link(OmniverseProtocolHelper, SkywalkerFungible);
  await deployer.link(OmniverseProtocolHelper, SkywalkerNonFungible);
  await deployer.deploy(SkywalkerFungible, CHAIN_IDS[network], "SKYWALKER", "SW");
  await deployer.deploy(SkywalkerNonFungible, CHAIN_IDS[network], "SKYWALKER", "SW");

  jsonData[network].skywalkerFungibleAddress = SkywalkerFungible.address;
  jsonData[network].skywalkerNonFungibleAddress = SkywalkerNonFungible.address;
  fs.writeFileSync(contractAddressFile, JSON.stringify(jsonData, null, '\t'));
};
