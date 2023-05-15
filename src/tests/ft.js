const { execSync } = require("child_process");
const config = require('config');
const utils = require('../utils/utils');
const Web3 = require('web3');
const fs = require('fs');
const nodes = require('../nodes/index');
const accounts = require('../utils/account');
const assert = require('assert');
const base = require('./base');
const synchronizer = require("../synchronizer");

class Test {
    initialize(networks) {
        console.log('initialize');
        let allienceInfo = '';
        for (let i in global.networks) {
            let item;
            if (global.networks[i].chainType == 'EVM') {
                item = '"' + i + '|' + global.networks[i].omniverseContractAddress + '"';
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
            cmd = 'cd ' + config.get('omniverseContractPath') + ' && node register/index.js -i CHAIN' + networks[i].id + ',' + allienceInfo;
            execSync(cmd);
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

        this.initialize();
    }

    async testRestore() {
        console.log('testRestore');
        for (let i in global.networks) {
            // Prepare for testing work restore
            await this.beforeRestore();

            // Launch synchronizer
            await synchronizer.launch();

            // Test work restore
            await this.afterRestore();

            // Shut down synchronizer
            synchronizer.shutdown();
        }
    }

    async testFlow() {
        console.log('testFlow');
        let users = accounts.getUsers()[1];
        // Launch synchronizer
        await synchronizer.launch();
        // Mint token to user 1
        console.log('Mint token');
        for (let i in global.networks) {
            base.mint(global.networks[i].chainType, i, users[1], 100);
            await utils.sleep(2);
            base.transfer(global.networks[i].chainType, i, users[0], 100);
            await utils.sleep(2);
            let ret = base.balanceOf(global.networks[i], i, users[0]);
            console.log('ret', ret.toString())
            assert(ret.includes('0'), 'Balance error');
        }
    }

    async runTest() {
        console.log('runTests');
        await this.testRestore();

        await this.testFlow();
    }

    async beforeRestore(network) {
        let users = accounts.getUsers()[1];
        console.log('beforeRestore');
        // Mint to user 0
        base.mint(network.chainType, i, users[0], 100);
        await utils.sleep(2);

        let ret = base.balanceOf(network.chainType, i, users[0]);
        console.log('ret', ret.toString())
        assert(ret.includes('0'), 'Balance error');
    }

    async afterRestore(network) {
        console.log('afterRestore');

        let ret = base.balanceOf(network.chainType, i, users[0]);
        console.log('ret', ret.toString())
        assert(ret.includes('100'), 'Balance error');
    }
}

module.exports = new Test();