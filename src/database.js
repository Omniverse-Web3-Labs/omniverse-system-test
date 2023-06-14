const config = require('config');
const { exec, spawn, execSync } = require("child_process");
const utils = require('./utils/utils');
const fs = require('fs');

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
            item.nodeAddress = network.ws;
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
            } else if (network.chainType == 'INK') {
                item.omniverseContractAddress = global.networkMgr.networks[i].INKContract;
                console.log(item);
            }
            cfg.networks[network.chainName] = item;
        }
        fs.writeFileSync(config.get('submodules.databasePath') + 'config/default.json', JSON.stringify(cfg, null, '\t'));
    }
    
    updateDatabaseRes() {
        console.log('updateDatabaseRes');
        execSync('mkdir -p ' + config.get('submodules.databasePath') + 'res && cp ' + config.get('submodules.omniverseContractPath') + 'build/contracts/EVMContract.json ' + config.get('submodules.databasePath') + 'res/EVMContract.json');
    }

    prepare(contractType) {
        this.updateDatabaseConfig(contractType);

        this.updateDatabaseRes(contractType);
    }

    beforeLaunch() {
        execSync('cd ' + config.get('submodules.databasePath') + ' && if [ -f "omniverse.db" ]; then rm omniverse.db; fi && if [ -f ".state" ]; then rm .state; fi');
    }

    async launch() {
        console.log('Launch database');
        this.beforeLaunch();

        var logStream = fs.createWriteStream(config.get('submodules.databasePath') + 'out.log', {flags: 'a'});
        let ret = spawn('node', ['src/main.js'], {
            cwd: config.get('submodules.databasePath')
        });
        ret.stdout.pipe(logStream);
        ret.stderr.pipe(logStream);
        await utils.sleep(5);
    }
}

module.exports = new Database();