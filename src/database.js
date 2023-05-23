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
            let item;
            if (global.networkMgr.networks[i].chainType == 'EVM') {
                item = JSON.parse(JSON.stringify(config.get("database.networkTemp.EVM")));
                item.nodeAddress = global.networkMgr.networks[i].rpc;
                item.omniverseContractAddress = global.networkMgr.networks[i].EVMContract;
                item.omniverseChainId = global.networkMgr.networks[i].id;
            } else if (global.networkMgr.networks[i].chainType == 'SUBSTRATE') {
                item = JSON.parse(JSON.stringify(config.get("database.networkTemp.SUBSTRATE")));
                item.nodeAddress = global.networkMgr.networks[i].rpc;
                item.tokenId = global.networkMgr.networks[i].tokenId;
                item.omniverseChainId = global.networkMgr.networks[i].id;
                if (contractType == 'ft') {
                    item.pallets = ['assets'];
                } else {
                    item.pallets = ['uniques'];
                }
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
    }

    launch(contractType) {
        this.beforeLaunch(contractType);

        exec('cd ' + config.get('submodules.databasePath') + ' && node src/main.js > out.log');
    }
}

module.exports = new Database();