const { execSync, spawn } = require("child_process");
const config = require('config');
const utils = require('../utils/utils');
const fs = require('fs');
const accounts = require('../utils/accounts');

class SwapService {
    updateToolConfig() {
        // console.log('update swap service config');
        let cfg = {};
        for (let i in NetworkMgr.networks) {
            let item = {};
            let network = NetworkMgr.networks[i];
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
        // console.log('Update swap service secret');
        let secret = accounts.getMpc()[0];
        fs.writeFileSync(config.get('submodules.swapServicePath') + 'config/.secret', JSON.stringify(secret, null, '\t'));
    }

    prepare() {
        // console.log('Swap prepare');
        this.updateToolConfig();

        this.updateToolSecret();
    }

    beforeLaunch() {
        let cmd = 'ps -ef | grep node | grep index.js | grep -v "ps -ef" | awk \'{print $2}\' '
        let pIds = execSync(cmd).toString();
        const ids = pIds.split(/\r?\n/).filter(item => item !== "");
        for (let id of ids) {
            cmd = 'lsof -p ' + id;
            let result = execSync(cmd).toString();
            // console.log(result)
            if (result.includes('omniverse-service')) {
                process.kill(id)
                return;
            }
        }
        execSync('cd ' + config.get('submodules.swapServicePath') + ' && if [ -f "out.log" ]; then rm out.log; fi');
    }

    async launch() {
        this.beforeLaunch();

        let childProcess = spawn('nohup node index.js > ./out.log 2>&1 &', {
          cwd: config.get('submodules.swapServicePath'),
          detached: true,
          shell: true,
        });
        childProcess.unref();
        
        await utils.sleep(5);
    }
}

module.exports = new SwapService();