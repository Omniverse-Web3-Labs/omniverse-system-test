class Database {
    constructor() {

    }

    updateDatabaseConfig() {
        console.log('updateDatabaseConfig');
        let cfg = {
            scanInterval: 1,
            logLevel: 'debug',
            secret: 'config/.secret',
            database: "omniverse.db",
            stateDB: ".state",
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
                item.omniverseChainId = networks[i].id;
            }
            cfg.networks[i] = item;
        }
        fs.writeFileSync(config.get('databasePath') + 'config/default.json', JSON.stringify(cfg, null, '\t'));
    }
    
    updateDatabaseRes() {
        console.log('updateDatabaseRes');
        execSync('mkdir -p ' + config.get('databasePath') + 'res && cp ' + config.get('omniverseContractPath') + 'build/contracts/EVMContract.json ' + config.get('databasePath') + 'res/EVMContract.json');
    }

    beforeLaunch(contractType) {
        this.updateDatabaseConfig(contractType);

        this.updateDatabaseRes(contractType);
    }

    launch(contractType) {
        this.beforeLaunch(contractType);

        exec('cd ' + config.get('databasePath') + ' && node src/main.js > out.log');
    }
}

module.exports = new Database();