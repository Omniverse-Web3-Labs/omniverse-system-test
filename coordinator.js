const config = require('config');
const fs = require('fs');
const { execSync } = require('child_process');
const nodes = require('./nodes/index');

function updateOmniverseConfig(networks) {
    console.log('updateOmniverseConfig');
    let cfg = {};
    for (let i = 0; i < networks.length; i++) {
        let item = {};
        if (networks[i].chainType == 'EVM') {
            let port = nodes.getNodePort(networks[i].id);
            item.nodeAddress = 'http://127.0.0.1:' + port;
            item.chainId = 1337;
            item.coolingDown = networks[i].coolingDown;
            item.omniverseChainId = networks[i].id;
        }
        cfg['CHAIN' + networks[i].id] = item;
    }
    fs.writeFileSync(config.get('omniverseContractPath') + 'config/default.json', JSON.stringify(cfg, null, '\t'));
}

function updateMigrationScript(networks) {
    console.log('updateMigrationScript');
    let str = '';
    for (let i = 0; i < networks.length; i++) {
        if (networks[i].chainType == 'EVM') {
            let port = nodes.getNodePort(networks[i].id);
            str += 'CHAIN' + networks[i].id + ': ' + networks[i].id + ',\n';
        }
    }
    console.log('migrate networks', str);
    let migrationScript = fs.readFileSync('./res/2_deploy_contracts.js').toString();
    migrationScript = migrationScript.replace('CHAINS_ID_TEMPLATE', str);
    fs.writeFileSync(config.get('omniverseContractPath') + 'migrations/2_deploy_contracts.js', migrationScript);
}

function updateTruffleConfig(networks) {
    console.log('updateTruffleConfig');
    let str = '';
    let netConfig = 'CHAIN_NAME:{\nhost:`CHAIN_HOST`,\nport:`CHAIN_PORT`,\nnetwork_id: "*",},\n';
    for (let i = 0; i < networks.length; i++) {
        if (networks[i].chainType == 'EVM') {
            let port = nodes.getNodePort(networks[i].id);
            str += netConfig.replace('CHAIN_NAME', 'CHAIN' + networks[i].id).
            replace('CHAIN_HOST', '127.0.0.1').
            replace('CHAIN_PORT', port);
        }
    }
    console.log('truffle networks', str);
    let truffleConfigStr = fs.readFileSync('./res/config/truffle-config.js').toString();
    truffleConfigStr = truffleConfigStr.replace('NETWORK_TEMPLATE', str);
    fs.writeFileSync(config.get('omniverseContractPath') + 'truffle-config.js', truffleConfigStr);
}

function updateToolConfig(networks) {
    // console.log('updateToolConfig');
    // let omniverseCfg = JSON.parse(fs.readFileSync(config.get('omniverseToolPath') + 'config/default.json').toString());
    // let cfg = {};
    // for (let i = 0; i < networks.length; i++) {
    //     let item = {};
    //     if (networks[i].chainType == 'EVM') {
    //     }
    //     item.interface = networks[i].chainType;
    //     cfg['CHAIN' + networks[i].id] = item;
    // }
    // fs.writeFileSync(config.get('') + 'config/default.json', JSON.stringify(cfg, null, '\t'));
}

function updateToolSecret(users) {
    console.log('updateToolSecret');
    let secretCfg = {};
    secretCfg.sks = users;
    secretCfg.index = 0;
    secretCfg.mpc = users[0];
    fs.writeFileSync(config.get('omniverseToolPath') + 'register/.secret', JSON.stringify(secretCfg, null, '\t'));
}

function updateToolRes() {
    console.log('updateToolRes');
    // execSync('cp ' + config.get('') + 'build/contracts/.json ' + config.get('') + 'res/');
    // execSync('cp ' + config.get('') + 'build/contracts/.json ' + config.get('') + 'res/');
    // execSync('cd ' + config.get('') + ' && echo -n ' + '' + ' > .secret');
}

function updateSynchronizerConfig(networks, contractType) {
    console.log('updateSynchronizerConfig');
    let omniverseCfg = JSON.parse(fs.readFileSync(config.get('omniverseContractPath') + 'config/default.json').toString());
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
    
    for (let i = 0; i < networks.length; i++) {
        let item = {};
        if (networks[i].chainType == 'EVM') {
            let port = nodes.getNodePort(networks[i].id);
            item.nodeAddress = 'ws://127.0.0.1:' + port;
            item.chainId = 1337;
            if (contractType == 'ft') {
                item.omniverseContractAddress = omniverseCfg['CHAIN' + networks[i].id].skywalkerFungibleAddress;
            }
            else {
                item.omniverseContractAddress = omniverseCfg['CHAIN' + networks[i].id].skywalkerNonFungibleAddress;                
            }
            item.omniverseContractAbiPath = './res/SkywalkerFungible.json';
            item.compatibleChain = 'ethereum';
            item.omniverseChainId = networks[i].id;
        }
        cfg.networks['CHAIN' + networks[i].id] = item;
    }
    fs.writeFileSync(config.get('synchronizerPath') + 'config/default.json', JSON.stringify(cfg, null, '\t'));
}

function updateSynchronizerRes(contractType) {
    console.log('updateSynchronizerRes');
    if (contractType == 'ft') {
        execSync('mkdir -p ' + config.get('synchronizerPath') + 'res && cp ' + config.get('omniverseContractPath') + 'build/contracts/SkywalkerFungible.json ' + config.get('synchronizerPath') + 'res/SkywalkerFungible.json');
    }
    else {
        execSync('mkdir -p ' + config.get('synchronizerPath') + 'res && cp ' + config.get('omniverseContractPath') + 'build/contracts/SkywalkerNonFungible.json ' + config.get('synchronizerPath') + 'res/SkywalkerFungible.json');
    }
}

function updateSynchronizerSecret(networks) {
    console.log('updateSynchronizerSecret');
    let secretCfg = {};
    for (let i = 0; i < networks.length; i++) {
        secretCfg['CHAIN' + networks[i].id] = 'b97de1848f97378ee439b37e776ffe11a2fff415b2f93dc240b2d16e9c184ba9';
    }
    fs.writeFileSync(config.get('synchronizerPath') + 'config/.secret', JSON.stringify(secretCfg, null, '\t'));
}

function updateDatabaseConfig(networks, contractType) {
    console.log('updateDatabaseConfig');
    let omniverseCfg = JSON.parse(fs.readFileSync(config.get('omniverseContractPath') + 'config/default.json').toString());
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

    for (let i = 0; i < networks.length; i++) {
        let item = {};
        if (networks[i].chainType == 'EVM') {
            let port = nodes.getNodePort(networks[i].id);
            item.nodeAddress = 'ws://127.0.0.1:' + port;
            item.chainId = 1337;
            if (contractType == 'ft') {
                item.omniverseContractAddress = omniverseCfg['CHAIN' + networks[i].id].skywalkerFungibleAddress;
            }
            else {
                item.omniverseContractAddress = omniverseCfg['CHAIN' + networks[i].id].skywalkerNonFungibleAddress;                
            }
            item.omniverseContractAbiPath = './res/SkywalkerFungible.json';
            item.compatibleChain = 'ethereum';
            item.omniverseChainId = networks[i].id;
        }
        cfg.networks['CHAIN' + networks[i].id] = item;
    }
    fs.writeFileSync(config.get('databasePath') + 'config/default.json', JSON.stringify(cfg, null, '\t'));
}

function updateDatabaseRes(contractType) {
    console.log('updateDatabaseRes');
    if (contractType == 'ft') {
        execSync('mkdir -p ' + config.get('databasePath') + 'res && cp ' + config.get('omniverseContractPath') + 'build/contracts/SkywalkerFungible.json ' + config.get('databasePath') + 'res/SkywalkerFungible.json');
    }
    else {
        execSync('mkdir -p ' + config.get('databasePath') + 'res && cp ' + config.get('omniverseContractPath') + 'build/contracts/SkywalkerNonFungible.json ' + config.get('databasePath') + 'res/SkywalkerFungible.json');
    }
}

function updateDatabaseSecret(networks) {
    console.log('updateDatabaseSecret');
    let secretCfg = {};
    for (let i = 0; i < networks.length; i++) {
        secretCfg['CHAIN' + networks[i].id] = 'b97de1848f97378ee439b37e776ffe11a2fff415b2f93dc240b2d16e9c184ba9';
    }
    fs.writeFileSync(config.get('databasePath') + 'config/.secret', JSON.stringify(secretCfg, null, '\t'));
}

function initialize(networks) {
    console.log('initialize');
    let synchronizerCfg = JSON.parse(fs.readFileSync(config.get('synchronizerPath') + 'config/default.json').toString()).networks;
    let allienceInfo = '';
    for (let i = 0; i < networks.length; i++) {
        let item = '"' + networks[i].id + '|' + synchronizerCfg['CHAIN' + networks[i].id].omniverseContractAddress + '"';
        if (i == 0) {
            allienceInfo = item;
        }
        else {
            allienceInfo += ',' + item;
        }
    }
    let cmd;
    // Omniverse contracts
    console.log('allienceInfo', allienceInfo);
    for (let i = 0; i < networks.length; i++) {
        cmd = 'cd ' + config.get('omniverseContractPath') + ' && node register/index.js -i CHAIN' + networks[i].id + ',' + allienceInfo;
        execSync(cmd);
    }
}

function initializeNFT(networks) {
    console.log('initialize');
    let synchronizerCfg = JSON.parse(fs.readFileSync(config.get('synchronizerPath') + 'config/default.json').toString()).networks;
    let allienceInfo = '';
    for (let i = 0; i < networks.length; i++) {
        let item = '"' + networks[i].id + '|' + synchronizerCfg['CHAIN' + networks[i].id].omniverseContractAddress + '"';
        if (i == 0) {
            allienceInfo = item;
        }
        else {
            allienceInfo += ',' + item;
        }
    }
    let cmd;
    // Omniverse contracts
    console.log('allienceInfo', allienceInfo);
    for (let i = 0; i < networks.length; i++) {
        cmd = 'cd ' + config.get('omniverseContractPath') + ' && node register/nft.js -i CHAIN' + networks[i].id + ',http://,' + allienceInfo;
        execSync(cmd);
    }
}

module.exports = {
    generateConfig: function() {
        console.log('generateConfig');
        let ret = [];
        let networks = config.get('networks');
        let index = 1;
        for (let i = 0; i < networks.length; ++i) {
            if (networks[i].count) {
                for (let j = 0; j < networks[i].count; j++) {
                    ret.push({
                        id: index++,
                        chainType: networks[i].chainType,
                        sk: networks[i].secretKey,
                        coolingDown: config.get('coolingDown')
                    });
                }
            }
            else {
                ret.push({
                    id: index++,
                    chainType: networks[i].chainType,
                    sk: networks[i].secretKey,
                    coolingDown: config.get('coolingDown')
                });
            }
        }
        return ret;
    },

    onDeployContracts: function(networks) {
        console.log('onDeployContracts');
        // Update contracts config
        updateOmniverseConfig(networks);

        // Update migration script
        updateMigrationScript(networks);

        // Update truffle config
        updateTruffleConfig(networks);
    },

    onTest: function(networks, users, contractType) {
        console.log('onTest');
        updateToolConfig(networks);

        updateToolSecret(users);

        updateToolRes();

        if (contractType == 'ft') {
            initialize(networks, users);
        }
        else {
            initializeNFT(networks, users);
        }
    },

    onLaunchSynchronizer: function(networks, contractType) {
        updateSynchronizerConfig(networks, contractType);

        updateSynchronizerRes(contractType);

        updateSynchronizerSecret(networks);

        let cmd = 'cd ' + config.get('synchronizerPath') + ' && npm install'
        execSync(cmd);
    },

    onLaunchDatabase: function(networks, contractType) {
        updateDatabaseConfig(networks, contractType);

        updateDatabaseRes(contractType);

        updateDatabaseSecret(networks);

        let cmd = 'cd ' + config.get('databasePath') + ' && npm install'
        execSync(cmd);
    }
}