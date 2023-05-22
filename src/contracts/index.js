const config = require('config');
const { execSync } = require("child_process");
const EVMChain = require('./EVMChain');
const SubstrateChain = require('./substrate');

class ContractsMgr {
    constructor() {

    }

    beforeDeploy() {
        EVMChain.beforeDeploy();
    }

    async afterDeploy(contractType) {
        let omniverseCfg = JSON.parse(fs.readFileSync(config.get('submodules.omniverseContractPath') + 'config/default.json').toString());
        for (let i in global.networkMgr.networks) {
            if (global.networkMgr.networks[i].chainType == 'EVM') {
                if (contractType == 'ft') {
                    global.networkMgr.networks[i].EVMContract = omniverseCfg[i].skywalkerFungibleAddress;
                }
                else {
                    global.networkMgr.networks[i].EVMContract = omniverseCfg[i].skywalkerNonFungibleAddress;
                }
            }
        }

        if (contractType == 'ft') {
            let cmd = 'cd ' + config.get('submodules.omniverseContractPath') + 'build/contracts/ && cp SkywalkerFungible.json EVMContract.json';
            execSync(cmd);
        }
        else {
            let cmd = 'cd ' + config.get('submodules.omniverseContractPath') + 'build/contracts/ && cp SkywalkerNonFungible.json EVMContract.json';
            execSync(cmd);
        }
    }

    async deploy(contractType) {
        this.beforeDeploy();

        for (let i in global.networkMgr.networks) {
            if (global.networkMgr.networks[i].chainType == 'EVM') {
                await EVMChain.deployOmniverse(global.networkMgr.networks[i]);
            } else if (global.networkMgr.networks[i].chainType == 'SUBSTRATE') {
                if (contractType == 'ft') {
                    networkMgr.networks[i].pallet = ['assets'];
                    networkMgr.networks[i].tokenId = 'FT';
                } else if (contractType == 'nft') {
                    networkMgr.networks[i].pallet = ['uniques'];
                    networkMgr.networks[i].tokenId = 'NFT';
                }
                await SubstrateChain.deployOmniverse(networkMgr.networks[i], contractType);
            }
        }

        this.afterDeploy(contractType);
        SubstrateChain.afterDeploy(contractType);
    }
}

module.exports = new ContractsMgr();