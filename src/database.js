const config = require('config');
const { exec, execSync } = require("child_process");

class Database {
    constructor() {

    }

    updateDatabaseConfig(contractType) {
        console.log('updateDatabaseConfig');
        let cfg = JSON.parse(JSON.stringify(config.get("database")));
        cfg.networks = {};
    
        for (let i in global.networkMgr.networks) {
            let network = global.networkMgr.networks[i];
            let item = JSON.parse(JSON.stringify(config.get(`database.networkTemp.${network.chainType}`)));
            item.nodeAddress = network.rpc;
            item.omniverseChainId = network.omniverseChainId;
            if (network.chainType == 'EVM') {
                item.chainId = global.networkMgr.networks[i].chainId;
                item.omniverseContractAddress = network.EVMContract;
            } else if (network.chainType == 'SUBSTRATE') {
                item.tokenId = global.networkMgr.networks[i].tokenId;
                if (contractType == 'ft') {
                    item.pallets = ['assets'];
                } else {
                    item.pallets = ['uniques'];
                }
                console.log(item);
            }
            cfg.networks[i] = item;
        }
        fs.writeFileSync(config.get('submodules.databasePath') + 'config/default.json', JSON.stringify(cfg, null, '\t'));
    }
    
    updateDatabaseRes() {
        console.log('updateDatabaseRes');
        execSync('mkdir -p ' + config.get('submodules.databasePath') + 'res && cp ' + config.get('submodules.omniverseContractPath') + 'build/contracts/EVMContract.json ' + config.get('submodules.databasePath') + 'res/EVMContract.json');
    }

    beforeLaunch(contractType) {
        this.updateDatabaseConfig(contractType);

        this.updateDatabaseRes(contractType);

        execSync('cd ' + config.get('submodules.databasePath') + ' && rm omniverse.db');
    }

    launch(contractType) {
        this.beforeLaunch(contractType);

        exec('cd ' + config.get('submodules.databasePath') + ' && node src/main.js > out.log');
    }
}

module.exports = new Database();