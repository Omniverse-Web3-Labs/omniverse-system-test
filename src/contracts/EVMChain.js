const { execSync } = require("child_process");
const config = require('config');
const accounts = require('../utils/accounts');
const utils = require("../utils/utils");
fs = require('fs');

class EVMChainDeployer {
    constructor() {
        this.contracts = {};
    }

    beforeDeploy() {
        this.updateConfig();
        this.updateMigrationScript();
        this.updateTruffleConfig();
    }

    updateConfig() {
        console.log('EVMChainDeployer update Config');
        let cfg = {};
        for (let i in global.networks) {
            let item = {};
            if (global.networks[i].chainType == 'EVM') {
                item.nodeAddress = global.networks[i].rpc;
                item.chainId = 1337;
                item.coolingDown = global.networks[i].coolingDown;
                item.omniverseChainId = i;
            }
            cfg[i] = item;
        }
        fs.writeFileSync(config.get('submodules.omniverseContractPath') + 'config/default.json', JSON.stringify(cfg, null, '\t'));
    }
    
    updateMigrationScript() {
        console.log('EVMChainDeployer updateMigrationScript');
        let str = '';
        for (let i in global.networks) {
            if (global.networks[i].chainType == 'EVM') {
                str += i + ': ' + i + ',\n';
            }
        }
        console.log('migrate networks', str);
        let migrationScript = fs.readFileSync('./res/2_deploy_contracts.js').toString();
        migrationScript = migrationScript.replace('CHAINS_ID_TEMPLATE', str);
        fs.writeFileSync(config.get('submodules.omniverseContractPath') + 'migrations/2_deploy_contracts.js', migrationScript);
    }
    
    updateTruffleConfig() {
        console.log('EVMChainDeployer updateTruffleConfig');
        let str = '';
        let netConfig = 'CHAIN_NAME:{\nhost:`CHAIN_HOST`,\nport:`CHAIN_PORT`,\nnetwork_id: "*",},\n';
        for (let i in global.networks) {
            if (global.networks[i].chainType == 'EVM') {
                str += netConfig.replace('CHAIN_NAME', i).
                replace('CHAIN_HOST', '127.0.0.1').
                replace('CHAIN_PORT', global.networks[i].port);
            }
        }
        console.log('truffle networks', str);
        let truffleConfigStr = fs.readFileSync('./res/config/truffle-config.js').toString();
        truffleConfigStr = truffleConfigStr.replace('NETWORK_TEMPLATE', str);
        fs.writeFileSync(config.get('submodules.omniverseContractPath') + 'truffle-config.js', truffleConfigStr);
    }

    async deployOmniverse(chainInfo) {
        console.log('deployOmniverse', chainInfo);
        execSync("cd " + config.get('submodules.omniverseContractPath') + " && echo -n " + accounts.getOwner()[1] + " > .secret");

        let cmd = "cd " + config.get('submodules.omniverseContractPath') + " && npx truffle migrate --network " + chainInfo.chainName;
        execSync(cmd);
    }
}

module.exports = new EVMChainDeployer();