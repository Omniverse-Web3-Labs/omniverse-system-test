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
        let cfg = {};
        let networks = global.networkMgr.getNetworksByType('EVM');
        for (let i in networks) {
            let item = {};
            item.nodeAddress = networks[i].rpc;
            item.chainId = networks[i].chainId;
            item.coolingDown = networks[i].coolingDown;
            item.omniverseChainId = networks[i].omniverseChainId;
            cfg[networks[i].chainName] = item;
        }
        fs.writeFileSync(config.get('submodules.omniverseContractPath') + 'config/default.json', JSON.stringify(cfg, null, '\t'));
    }
    
    updateMigrationScript() {
        let str = '';
        let networks = global.networkMgr.getNetworksByType('EVM');
        for (let i in networks) {
            str += networks[i].chainName + ': ' + networks[i].omniverseChainId + ',\n';
        }
        let migrationScript = fs.readFileSync('./res/2_deploy_contracts.js').toString();
        migrationScript = migrationScript.replace('CHAINS_ID_TEMPLATE', str);
        fs.writeFileSync(config.get('submodules.omniverseContractPath') + 'migrations/2_deploy_contracts.js', migrationScript);
    }
    
    updateTruffleConfig() {
        let str = '';
        let netConfig = 'CHAIN_NAME:{\nprovider:()=>new HDWalletProvider(mnemonic, `CHAIN_RPC`),\nnetwork_id:"*"\n},\n';
        let networks = global.networkMgr.getNetworksByType('EVM');
        for (let i in networks) {
            str += netConfig.replace('CHAIN_NAME', networks[i].chainName).
            replace('CHAIN_RPC', networks[i].rpc);
        }
        let truffleConfigStr = fs.readFileSync('./res/config/truffle-config.js').toString();
        truffleConfigStr = truffleConfigStr.replace('NETWORK_TEMPLATE', str);
        fs.writeFileSync(config.get('submodules.omniverseContractPath') + 'truffle-config.js', truffleConfigStr);
    }

    async deployOmniverse(chainInfo) {
        execSync("cd " + config.get('submodules.omniverseContractPath') + " && echo -n " + accounts.getOwner()[0].slice(2) + " > .secret");

        let cmd = "cd " + config.get('submodules.omniverseContractPath') + " && npx truffle migrate --network " + chainInfo.chainName + " --skip-dry-run";
        while (true) {
            try {
                execSync(cmd).toString();
            }
            catch (e) {
                console.log(e)
                continue;
            }
            break;
        }
    }
}

module.exports = new EVMChainDeployer();