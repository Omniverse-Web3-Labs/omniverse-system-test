const config = require('config');
const { execSync } = require("child_process");
const EVMChain = require('./EVMChain');

class ContractsMgr {
    constructor() {

    }

    beforeDeploy() {
        EVMChain.beforeDeploy();
    }

    async afterDeploy(contractType) {
        let omniverseCfg = JSON.parse(fs.readFileSync(config.get('submodules.omniverseContractPath') + 'config/default.json').toString());
        for (let i in global.networks) {
            if (global.networks[i].chainType == 'EVM') {
                if (contractType == 'ft') {
                    global.networks[i].EVMContract = omniverseCfg[i].skywalkerFungibleAddress;
                }
                else {
                    global.networks[i].EVMContract = omniverseCfg[i].skywalkerNonFungibleAddress;
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

        for (let i in global.networks) {
            if (global.networks[i].chainType == 'EVM') {
                await EVMChain.deployOmniverse(global.networks[i]);
            }
        }

        this.afterDeploy(contractType);
    }
}

module.exports = new ContractsMgr();