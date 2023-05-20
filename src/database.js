const config = require('config');
const { exec, execSync } = require("child_process");

class Database {
    constructor() {

    }

    updateDatabaseConfig() {
        console.log('updateDatabaseConfig');
        let cfg = JSON.parse(JSON.stringify(config.get("database")));
        cfg.networks = {};
    
        for (let i in global.networks) {
            let item;
            if (global.networks[i].chainType == 'EVM') {
                item = JSON.parse(JSON.stringify(config.get("database.networkTemp.EVM")));
                item.nodeAddress = global.networks[i].rpc;
                item.omniverseContractAddress = global.networks[i].EVMContract;
                item.omniverseChainId = networks[i].id;
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