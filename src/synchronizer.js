const { execSync, spawn } = require('child_process');
const accounts = require('./utils/accounts');
const config = require('config');
const utils = require('./utils/utils');

class Synchronizer {
    constructor() {
        this.instance;
    }

    updateConfig(contractType) {
        console.log('Synchronizer updateConfig');
        let cfg = JSON.parse(JSON.stringify(config.get("synchronizer")));
        cfg.networks = {};
        
        for (let i in global.networkMgr.networks) {
            let item = {};
            if (global.networkMgr.networks[i].chainType == 'EVM') {
                item = JSON.parse(JSON.stringify(config.get("synchronizer.networkTemp.EVM")));
                item.chainId = global.networkMgr.networks[i].chainId;
                item.omniverseContractAddress = global.networkMgr.networks[i].EVMContract;
                item.nodeAddress = global.networkMgr.networks[i].rpc;
                item.omniverseChainId = i;
            } else if (global.networkMgr.networks[i].chainType == 'SUBSTRATE') {
                item = JSON.parse(JSON.stringify(config.get("synchronizer.networkTemp.SUBSTRATE")));
                item.tokenId = global.networkMgr.networks[i].tokenId;
                item.nodeAddress = global.networkMgr.networks[i].rpc;
                item.omniverseChainId = i;
                if (contractType == 'ft') {
                    item.pallets = ['assets'];
                } else {
                    item.pallets = ['uniques'];
                }
            }
            cfg.networks[i] = item;
        }
        fs.writeFileSync(config.get('submodules.synchronizerPath') + 'config/default.json', JSON.stringify(cfg, null, '\t'));
    }
    
    updateRes() {
        console.log('Synchronizer updateRes');
        execSync('mkdir -p ' + config.get('submodules.synchronizerPath') + 'res && cp ' + config.get('submodules.omniverseContractPath') + 'build/contracts/EVMContract.json ' + config.get('submodules.synchronizerPath') + 'res/EVMContract.json');
    }
    
    updateSecret() {
        console.log('Synchronizer updateSecret');
        let secretCfg = {};
        for (let i in global.networkMgr.networks) {
            secretCfg[i] = accounts.getPorters()[0];
        }
        fs.writeFileSync(config.get('submodules.synchronizerPath') + 'config/.secret', JSON.stringify(secretCfg, null, '\t'));
    }

    prepare(contractType) {
        this.updateConfig(contractType);

        this.updateRes();

        this.updateSecret();
    }

    beforeLaunch() {
        execSync('cd ' + config.get('submodules.synchronizerPath') + ' && if [ -f ".state" ]; then rm .state; fi');
    }

    async launch() {
        this.beforeLaunch();

        var logStream = fs.createWriteStream(config.get('submodules.synchronizerPath') + 'out.log', {flags: 'a'});
        this.instance = spawn('node', ['src/main.js'], {
            cwd: config.get('submodules.synchronizerPath')
        });
        this.instance.stdout.pipe(logStream);
        this.instance.stderr.pipe(logStream);
        await utils.sleep(5);
    }

    shutdown() {
        console.log('shutdown');
        this.instance.kill();
    }
}

module.exports = new Synchronizer();