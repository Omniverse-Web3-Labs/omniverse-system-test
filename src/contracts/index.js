const config = require('config');
const { execSync } = require('child_process');
const EVMChain = require('./EVMChain');
const SubstrateChain = require('./substrate');
const InkChain = require('./ink');
const utils = require('../utils/utils');

class ContractsMgr {
  constructor() {
    this.tokenId = [];
  }

  beforeDeploy(contractType, count) {
    EVMChain.beforeDeploy(contractType, count);
    SubstrateChain.beforeDeploy(contractType, count);
    InkChain.beforeDeploy(contractType, count);

    let template = config.get('tokenInfo')[contractType];
    if (template.length < count) {
      this.tokenId = [...template];
      for (let j = template.length; j < count; ++j) {
        this.tokenId.push({
          name: template[0].name + j,
          symbol: template[0].symbol + j,
        });
      }
    } else {
      this.tokenId = [...template.slice(0, count)];
    }
  }

  async afterDeploy(contractType) {
    let omniverseCfg = JSON.parse(
      fs
        .readFileSync(
          config.get('submodules.omniverseContractPath') + 'config/default.json'
        )
        .toString()
    );
    for (let i in NetworkMgr.networks) {
      let network = NetworkMgr.networks[i];
      if (network.chainType == 'EVM') {
        if (contractType == 'token') {
          network.omniverseContractAddress =
            omniverseCfg[network.chainName].skywalkerFungibleAddress;
        } else {
          network.omniverseContractAddress =
            omniverseCfg[network.chainName].skywalkerNonFungibleAddress;
        }
      }
    }
    if (contractType == 'token') {
      let cmd =
        'cd ' +
        config.get('submodules.omniverseContractPath') +
        'build/contracts/ && cp SkywalkerFungible.json EVMContract.json';
      execSync(cmd);
    } else {
      let cmd =
        'cd ' +
        config.get('submodules.omniverseContractPath') +
        'build/contracts/ && cp SkywalkerNonFungible.json EVMContract.json';
      execSync(cmd);
    }
  }

  async deploy(contractType, count) {
    console.log(
      '///////////////////////////////////////////////////\
      \n//               Deploy Contracts               //\
      \n//////////////////////////////////////////////////'
    );
    this.beforeDeploy(contractType, count);

    for (let i in NetworkMgr.networks) {
      let network = NetworkMgr.networks[i];
      console.log('Deploy', network.chainName, network.chainType);
      if (network.chainType == 'EVM') {
        EVMChain.deployOmniverse(network);
      } else if (network.chainType == 'SUBSTRATE') {
        if (contractType == 'token') {
          network.pallet = ['assets'];
        } else if (contractType == 'nft') {
          network.pallet = ['uniques'];
        }
        network.tokenId = [];
        for (let tokenInfo of this.tokenId) {
          network.tokenId.push(tokenInfo.name);
          await SubstrateChain.deployOmniverse(
            network,
            contractType,
            tokenInfo
          );
        }
      } else if (network.chainType == 'INK') {
        network.omniverseContractAddress = {};
        for (let tokenInfo of InkChain.tokenInfo[i]) {
          let address = await InkChain.deployOmniverse(
            network,
            contractType,
            tokenInfo
          );
          network.omniverseContractAddress[tokenInfo.name] = address;
        }
      }
      NetworkMgr.networks[i] = network;
    }

    this.afterDeploy(contractType);
    console.log('All contracts information:', NetworkMgr.networks);
    await utils.sleep(5);
  }
}

module.exports = new ContractsMgr();
