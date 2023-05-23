const { execSync } = require("child_process");
const config = require('config');
const utils = require('../utils/utils');
const fs = require('fs');
const accounts = require('../utils/accounts');
const assert = require('assert');

class Test {    
    initialize(networks) {
        console.log('initialize');
        let synchronizerCfg = JSON.parse(fs.readFileSync(config.get('synchronizerPath') + 'config/default.json').toString()).networks;
        let allienceInfo = '';
        for (let i = 0; i < networks.length; i++) {
            let item = '';;
            if (networks[i].chainType == 'EVM') {
                item = '"' + networks[i].id + '|' + synchronizerCfg['CHAIN' + networks[i].id].omniverseContractAddress + '"';
            } else if (networks[i].chainType == 'SUBSTRATE') {
                let tokenId = '0x' + Buffer.from(synchronizerCfg['CHAIN' + networks[i].id].tokenId).toString('hex');
                item = '"' + networks[i].id + '|' + tokenId + '"';
            }
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
            if (networks[i].chainType == 'EVM') {
                cmd = 'cd ' + config.get('omniverseContractPath') + ' && node register/nft.js -i CHAIN' + networks[i].id + ',http://,' + allienceInfo;
                execSync(cmd);
            }
        }
    }

    updateToolConfig() {
        // console.log('updateToolConfig');
    }
    
    updateToolSecret() {
        console.log('Test updateToolSecret');
        console.log('For EVM');
        let secretCfg = {};
        secretCfg.sks = accounts.getUsers();
        secretCfg.index = 0;
        secretCfg.mpc = secretCfg.sks[0];
        fs.writeFileSync(config.get('omniverseToolPath') + 'register/.secret', JSON.stringify(secretCfg, null, '\t'));
    }
    
    updateToolRes() {
        console.log('updateToolRes');
        // execSync('cp ' + config.get('') + 'build/contracts/.json ' + config.get('') + 'res/');
        // execSync('cp ' + config.get('') + 'build/contracts/.json ' + config.get('') + 'res/');
        // execSync('cd ' + config.get('') + ' && echo -n ' + '' + ' > .secret');
    }

    prepare() {
        console.log('Test prepare');
        this.updateToolConfig();

        this.updateToolSecret();

        this.updateToolRes();

        this.initialize(networks, users);
    }

    async runTest(networks, users, contractType) {
        console.log('runTests');

        // Mint token 1 to user 1 on chain 1
        console.log('Mint token');
        let cmd = 'cd ' + config.get('omniverseToolPath') + ' && node register/nft.js -m CHAIN1,' + users[1] + ',' + 1;
        execSync(cmd);
        await utils.sleep(5);
        
        // Transfer token 1 to user 2 on chain 2
        console.log('Transfer token');
        cmd = 'cd ' + config.get('omniverseToolPath') + ' && node register/nft.js -s 1';
        execSync(cmd);
        await utils.sleep(1);
        cmd = 'cd ' + config.get('omniverseToolPath') + ' && node register/nft.js -t CHAIN2,' + users[2] + ',1';
        execSync(cmd);
        await utils.sleep(5);

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

    async beforeRestore(networks, users, contractType) {
        console.log('beforeRestore');
        let cmd = 'cd ' + config.get('omniverseToolPath') + ' && node register/nft.js -m CHAIN' + networks[1].id + ',' + users[1] + ',' + 100;
        execSync(cmd);
        await utils.sleep(3);
        cmd = 'cd ' + config.get('omniverseToolPath') + ' && node register/nft.js -ob CHAIN' + networks[1].id + ',' + users[1];
        let ret = execSync(cmd);
        assert(ret.includes('0'), 'Balance error');
    }

    async restore(networks, users, contractType) {
        console.log('afterRestore');
        let cmd = 'cd ' + config.get('omniverseToolPath') + ' && node register/nft.js -ob CHAIN' + networks[1].id + ',' + users[1];
        let ret = execSync(cmd);
        assert(ret.includes('1'), 'Balance error');
    }
}

module.exports = new Test();