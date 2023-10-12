const { execSync } = require("child_process");
const config = require('config');
const accounts = require('../utils/accounts');
const utils = require("../utils/utils");
fs = require('fs');
const { spawn } = require("child_process");

class EVMChainDeployer {
    constructor() {
        this.contracts = {};
    }

    launchBitcoinBackend(chainInfo) {
        console.log('chainInfo', chainInfo)
        let cfg = `export default {provider: "${chainInfo.rpc}",}`;
        fs.writeFileSync(
            config.get('submodules.bitcoinBackendPath') + 'config/config.ts',
            cfg
          );
        spawn('npx', ['ts-node', 'index.ts'], {
            cwd: config.get('submodules.bitcoinBackendPath'),
          });
    }

    deployOmniverse(chainInfo) {
        // Launch bitcoin backend
        this.launchBitcoinBackend(chainInfo);
    }
}

module.exports = new EVMChainDeployer();