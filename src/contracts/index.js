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
  }

  async afterDeploy(contractType) {
    let omniverseCfg = JSON.parse(
      fs
        .readFileSync(
          config.get('submodules.omniverseContractPath') + 'config/default.json'
        )
        .toString()
    );
    for (let i in global.networkMgr.networks) {
      let network = global.networkMgr.networks[i];
      if (network.chainType == 'EVM') {
        if (contractType == 'ft') {
          network.EVMContract =
            omniverseCfg[network.chainName].skywalkerFungibleAddress;
        } else {
          network.EVMContract =
            omniverseCfg[network.chainName].skywalkerNonFungibleAddress;
        }
      }
    }
    if (contractType == 'ft') {
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
      '///////////////////////////////////////////////////\n\
      //               Deploy Contracts                //\n\
      ///////////////////////////////////////////////////'
    );
    this.beforeDeploy(contractType, count);

    for (let i in global.networkMgr.networks) {
      console.log(
        'Deploy',
        global.networkMgr.networks[i].chainName,
        global.networkMgr.networks[i].chainType
      );
      if (global.networkMgr.networks[i].chainType == 'EVM') {
        EVMChain.deployOmniverse(global.networkMgr.networks[i]);
      } else if (global.networkMgr.networks[i].chainType == 'SUBSTRATE') {
        if (contractType == 'ft') {
          networkMgr.networks[i].pallet = ['assets'];
        } else if (contractType == 'nft') {
          networkMgr.networks[i].pallet = ['uniques'];
        }
        networkMgr.networks[i].tokenId = [];
        for (let tokenInfo of SubstrateChain.tokenInfo[i]) {
          networkMgr.networks[i].tokenId.push(tokenInfo.name);
          this.tokenId.push(tokenInfo.name);
          await SubstrateChain.deployOmniverse(
            networkMgr.networks[i],
            contractType,
            tokenInfo
          );
        }
      } else if (global.global.networkMgr.networks[i].chainType == 'INK') {
        let address = await InkChain.deployOmniverse(
          global.networkMgr.networks[i],
          contractType
        );
        global.networkMgr.networks[i].INKContract = address;
      }
    }

    this.afterDeploy(contractType);
    console.log('All contracts information:', global.networkMgr.networks);
    await utils.sleep(5);
  }
}

module.exports = new ContractsMgr();
