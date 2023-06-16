const config = require('config');
const { execSync } = require("child_process");
const EVMChain = require('./EVMChain');
const SubstrateChain = require('./substrate');
const InkChain = require('./ink');
const utils = require('../utils/utils');

class ContractsMgr {
    constructor() {

    }

    beforeDeploy() {
        EVMChain.beforeDeploy();
    }

    async afterDeploy(contractType) {
        for (let i in global.networkMgr.networks) {
            let network = global.networkMgr.networks[i];
            if (network.chainType == 'EVM') {
                let omniverseCfg = JSON.parse(fs.readFileSync(config.get('submodules.omniverseContractPath') + 'config/default.json').toString());
                if (contractType == 'ft') {
                    network.EVMContract = omniverseCfg[network.chainName].skywalkerFungibleAddress;
                }
                else {
                    network.EVMContract = omniverseCfg[network.chainName].skywalkerNonFungibleAddress;
                }
            }
            // else if (network.chainType == 'INK') {
            //     if (contractType == 'ft') {
            //         network.EVMContract = omniverseCfg[network.chainName].skywalkerFungibleAddress;
            //     }
            // }
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
        console.log(
'///////////////////////////////////////////////////\n\
//               Deploy Contracts                //\n\
///////////////////////////////////////////////////'
        );
        this.beforeDeploy();

        for (let i in global.networkMgr.networks) {
            console.log('Deploy', global.networkMgr.networks[i].chainName, global.networkMgr.networks[i].chainType);
            if (global.networkMgr.networks[i].chainType == 'EVM') {
                await EVMChain.deployOmniverse(global.networkMgr.networks[i]);
            } else if (global.networkMgr.networks[i].chainType == 'SUBSTRATE') {
                if (contractType == 'ft') {
                    global.networkMgr.networks[i].pallet = ['assets'];
                    global.networkMgr.networks[i].tokenId = 'FT';
                } else if (contractType == 'nft') {
                    global.networkMgr.networks[i].pallet = ['uniques'];
                    global.networkMgr.networks[i].tokenId = 'NFT';
                }
                await SubstrateChain.deployOmniverse(global.networkMgr.networks[i], contractType);
            } else if (global.global.networkMgr.networks[i].chainType == 'INK') {
                let address = await InkChain.deployOmniverse(global.networkMgr.networks[i], contractType);
                global.networkMgr.networks[i].INKContract = address;
            }
        }

        this.afterDeploy(contractType);
        console.log('All contracts information:', global.networkMgr.networks);
        await utils.sleep(5);
    }
}

module.exports = new ContractsMgr();