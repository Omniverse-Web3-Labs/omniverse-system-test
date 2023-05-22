const { execSync } = require("child_process");
const config = require('config');
const utils = require('../utils/utils');
const fs = require('fs');
const accounts = require('../utils/accounts');
const assert = require('assert');
const base = require('./base');
const synchronizer = require("../synchronizer");

class Test {
    initialize() {
        console.log('initialize', global.networkMgr.networks);
        let allienceInfo = '';
        for (let i in global.networkMgr.networks) {
            let item;
            if (global.networkMgr.networks[i].chainType == 'EVM') {
                item = '"' + i + '|' + global.networkMgr.networks[i].EVMContract + '"';
            } else if (global.networkMgr.networks[i].chainType == 'SUBSTRATE') {
                item = '"' + i + '|' + global.networkMgr.networks[i].tokenId + '"';
            }
            
            
            if (allienceInfo == '') {
                allienceInfo = item;
            }
            else {
                allienceInfo += ',' + item;
            }
        }
        let cmd;
        // Omniverse contracts
        console.log('allienceInfo', allienceInfo);
        for (let i in global.networkMgr.networks) {
            cmd = 'cd ' + config.get('submodules.omniverseContractPath') + ' && node register/index.js -i ' + i + ',' + allienceInfo;
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
        secretCfg.sks = accounts.getAll()[0];
        secretCfg.index = 0;
        secretCfg.mpc = secretCfg.sks[0];
        fs.writeFileSync(config.get('submodules.omniverseToolPath') + 'register/.secret', JSON.stringify(secretCfg, null, '\t'));
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
        for (let i in global.networkMgr.networks) {
            // Prepare for testing work restore
            await this.beforeRestore(global.networkMgr.networks[i]);

            // Launch synchronizer
            await synchronizer.launch();

            // Test work restore
            await this.afterRestore(global.networkMgr.networks[i]);

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
        let index = 1;
        for (let i in global.networkMgr.networks) {
            base.mint(global.networkMgr.networks[i].chainType, i, users[1], 100);
            await utils.sleep(2);
            base.transfer(global.networkMgr.networks[i].chainType, i, 3, users[2], 11);
            await utils.sleep(2);
            let ret = await base.balanceOf(global.networkMgr.networks[i].chainType, i, users[2]);
            console.log('ret', ret.toString());
            assert(ret.includes((11 * index).toString()), 'Balance error');
            index++;
        }
    }

    async runTest() {
        console.log('runTests');
        synchronizer.prepare();

        // await this.testRestore();

        await this.testFlow();
    }

    async beforeRestore(network) {
        console.log('beforeRestore');
        let users = accounts.getUsers()[1];
        // Mint to user 0
        base.mint(network.chainType, network.chainName, users[0], 100);
        await utils.sleep(2);

        let ret = await base.balanceOf(network.chainType, network.chainName, users[0]);
        console.log('ret', ret.toString())
        assert(ret.includes('0'), 'Balance error');
    }

    async afterRestore(network) {
        console.log('afterRestore');
        let users = accounts.getUsers()[1];

        let ret = await base.balanceOf(network.chainType, network.chainName, users[0]);
        console.log('ret', ret.toString())
        assert(ret.includes('100'), 'Balance error');
    }
}

module.exports = new Test();