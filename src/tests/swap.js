const { execSync, spawn } = require("child_process");
const config = require('config');
const utils = require('../utils/utils');
const fs = require('fs');
const accounts = require('../utils/accounts');

class SwapService {
    updateToolConfig() {
        console.log('update swap service config');
        let cfg = {};
        for (let i in global.networkMgr.networks) {
            let item = {};
            let network = global.networkMgr.networks[i];
            if (network.chainType == 'SUBSTRATE') {
                item.nodeAddress = network.rpc;
                item.tokenId = network.tokenId;
                item.secret = "config/.secret",
                item.omniverseChainId = network.omniverseChainId;
                cfg[network.chainName] = item;
            }
        }
        fs.writeFileSync(config.get('submodules.swapServicePath') + 'config/default.json', JSON.stringify(cfg, null, '\t'));
    }
    
    updateToolSecret() {
        console.log('Update swap service secret');
        let secret = accounts.getMpc()[0];
        fs.writeFileSync(config.get('submodules.swapServicePath') + 'config/.secret', JSON.stringify(secret, null, '\t'));
    }

    prepare() {
        console.log('Swap prepare');
        this.updateToolConfig();

        this.updateToolSecret();
    }

    beforeLaunch() {
        execSync('cd ' + config.get('submodules.swapServicePath') + ' && if [ -f "out.log" ]; then rm out.log; fi');
    }

    async launch() {
        this.beforeLaunch();

        var logStream = fs.createWriteStream(config.get('submodules.swapServicePath') + 'out.log', {flags: 'a'});
        this.instance = spawn('node', ['index.js'], {
            cwd: config.get('submodules.swapServicePath')
        });
        this.instance.stdout.pipe(logStream);
        this.instance.stderr.pipe(logStream);
        await utils.sleep(5);
    }
}

module.exports = new SwapService();