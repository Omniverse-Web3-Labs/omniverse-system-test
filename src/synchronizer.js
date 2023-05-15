const { execSync } = require('child_process');
const accounts = require('./utils/accounts');

class Synchronizer {
    constructor() {

    }

    updateConfig() {
        console.log('Synchronizer updateConfig');
        let cfg = {
            scanInterval: 1,
            logLevel: 'debug',
            secret: 'config/.secret',
            stateDB: ".state",
            database: "http://127.0.0.1:8866/omniverse/v1/pending",
            payload: {
                keys: ["op", "exData", "amount"],
                types: ["uint8", "bytes", "uint256"]
            },
            networks: {}
        };
        
        for (let i in global.networks) {
            let item = {};
            if (global.networks[i].chainType == 'EVM') {
                item.nodeAddress = global.networks[i].rpc;
                item.chainId = 1337;
                item.omniverseContractAddress = global.networks[i].EVMContract;
                item.omniverseContractAbiPath = './res/EVMContract.json';
                item.compatibleChain = 'ethereum';
                item.omniverseChainId = i;
            }
            cfg.networks[i] = item;
        }
        fs.writeFileSync(config.get('synchronizerPath') + 'config/default.json', JSON.stringify(cfg, null, '\t'));
    }
    
    updateRes() {
        console.log('Synchronizer updateRes');
        execSync('mkdir -p ' + config.get('synchronizerPath') + 'res && cp ' + config.get('omniverseContractPath') + 'build/contracts/EVMContract.json ' + config.get('synchronizerPath') + 'res/EVMContract.json');
    }
    
    updateSecret() {
        console.log('Synchronizer updateSecret');
        let secretCfg = {};
        for (let i in global.networks) {
            secretCfg[i] = accounts.getPorters()[0];
        }
        fs.writeFileSync(config.get('synchronizerPath') + 'config/.secret', JSON.stringify(secretCfg, null, '\t'));
    }

    beforeLaunch() {
        this.updateConfig();

        this.updateRes();

        this.updateSecret();

        exec('cd ' + config.get('synchronizerPath') + ' && rm .state');
    }

    async launch() {
        this.beforeLaunch();

        exec('cd ' + config.get('synchronizerPath') + ' && node src/main.js > sync.log');
        await utils.sleep(5);
    }

    shutdown() {
        execSync('ps -ef | grep "node src/main.js > sync.log" | grep -v grep | awk "{print $2}" | xargs kill -9');
    }
}

module.exports = new Synchronizer();