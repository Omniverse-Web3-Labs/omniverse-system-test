const { execSync } = require("child_process");
const config = require('config');
const utils = require('../utils');
const Web3 = require('web3');
const fs = require('fs');
const nodes = require('../nodes/index');
const assert = require('assert');

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
    runFTTests: async function(networks, users) {
        console.log('runTests');
        // Initialize contracts
        initialize(networks);

        // Mint token to user 1 on chain 1
        console.log('Mint token');
        let cmd = 'cd ' + config.get('omniverseToolPath') + ' && node register/index.js -m CHAIN1,' + users[1] + ',' + 100;
        execSync(cmd);
        await utils.sleep(3);
        
        // Transfer token to user 2 on chain 2
        console.log('Transfer token');
        cmd = 'cd ' + config.get('omniverseToolPath') + ' && node register/index.js -s 1';
        execSync(cmd);
        await utils.sleep(1);
        cmd = 'cd ' + config.get('omniverseToolPath') + ' && node register/index.js -t CHAIN2,' + users[2] + ',11';
        execSync(cmd);
        await utils.sleep(3);

        // Check balance of user 2 on all chains
        console.log('Check');
        for (let i = 0; i < networks.length; i++) {
            cmd = 'cd ' + config.get('omniverseToolPath') + ' && node register/index.js -ob CHAIN' + networks[i].id + ',' + users[2];
            let ret = execSync(cmd);
            assert(ret.includes('11'), 'Error');
        }
    },
    
    runNFTTests: async function(networks, users) {
        console.log('runTests');
        // Initialize contracts
        initializeNFT(networks);

        // Mint token 1 to user 1 on chain 1
        console.log('Mint token');
        let cmd = 'cd ' + config.get('omniverseToolPath') + ' && node register/nft.js -m CHAIN1,' + users[1] + ',' + 1;
        execSync(cmd);
        await utils.sleep(3);
        
        // Transfer token 1 to user 2 on chain 2
        console.log('Transfer token');
        cmd = 'cd ' + config.get('omniverseToolPath') + ' && node register/nft.js -s 1';
        execSync(cmd);
        await utils.sleep(1);
        cmd = 'cd ' + config.get('omniverseToolPath') + ' && node register/nft.js -t CHAIN2,' + users[2] + ',1';
        execSync(cmd);
        await utils.sleep(3);

        // Check balance of user 2 on all chains
        console.log('Check');
        for (let i = 0; i < networks.length; i++) {
            cmd = 'cd ' + config.get('omniverseToolPath') + ' && node register/nft.js -ob CHAIN' + networks[i].id + ',' + users[2];
            let ret = execSync(cmd);
            assert(ret.includes('1'), 'Balance error');
        }

        // Check owner of token 1 on all chains
        console.log('Check');
        for (let i = 0; i < networks.length; i++) {
            cmd = 'cd ' + config.get('omniverseToolPath') + ' && node register/nft.js -oo CHAIN' + networks[i].id + ',1';
            let ret = execSync(cmd);
            assert(ret.includes(users[2]), 'Owner error');
        }
    }
}