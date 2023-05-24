const { execSync } = require("child_process");
const config = require('config');
const utils = require('../utils/utils');
const fs = require('fs');
const accounts = require('../utils/accounts');
const assert = require('assert');
const base = require('./base');
const synchronizer = require("../synchronizer");
const SubstrateChain = require('../contracts/substrate')

class Test {
    async initialize() {
        console.log('initialize', global.networkMgr.networks);
        let allienceInfo = '';
        for (let i in global.networkMgr.networks) {
            let item = '';
            if (global.networkMgr.networks[i].chainType == 'EVM') {
                item = '"' + i + '|' + global.networkMgr.networks[i].EVMContract + '"';
            } else if (global.networkMgr.networks[i].chainType == 'SUBSTRATE') {
                let tokenId = '0x' + Buffer.from(global.networkMgr.networks[i].tokenId).toString('hex');
                item = '"' + i + '|' + tokenId + '"';
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
            if (global.networkMgr.networks[i].chainType == 'EVM') {
                cmd = 'cd ' + config.get('submodules.omniverseContractPath') + ' && node register/index.js -i ' + i + ',' + allienceInfo;
                execSync(cmd);
            }
        }

        await SubstrateChain.setMembers('ft');
    }

    updateToolConfig() {
        console.log('updateToolConfig');
        let cfg = {};
        for (let i in global.networkMgr.networks) {
            let item = {};
            if (global.networkMgr.networks[i].chainType == 'SUBSTRATE') {
                item.nodeAddress = global.networkMgr.networks[i].rpc;
                item.tokenId = global.networkMgr.networks[i].tokenId;
                item.omniverseChainId = i;
                cfg[i] = item;
            }
        }
        fs.writeFileSync(config.get('submodules.substrateOmniverseToolPath') + 'config/default.json', JSON.stringify(cfg, null, '\t'));
    }
    
    updateToolSecret() {
        console.log('Test updateToolSecret');
        console.log('For EVM');
        let secretCfg = {};
        secretCfg.sks = accounts.getAll()[0];
        secretCfg.index = 0;
        secretCfg.mpc = secretCfg.sks[0];
        fs.writeFileSync(config.get('submodules.omniverseToolPath') + 'register/.secret', JSON.stringify(secretCfg, null, '\t'));
        fs.writeFileSync(config.get('submodules.substrateOmniverseToolPath') + '.secret', JSON.stringify(secretCfg, null, '\t'));
    }
    
    updateToolRes() {
        console.log('updateToolRes');
        // execSync('cp ' + config.get('') + 'build/contracts/.json ' + config.get('') + 'res/');
        // execSync('cp ' + config.get('') + 'build/contracts/.json ' + config.get('') + 'res/');
        // execSync('cd ' + config.get('') + ' && echo -n ' + '' + ' > .secret');
    }

    async prepare() {
        console.log('Test prepare');
        this.updateToolConfig();

        this.updateToolSecret();

        this.updateToolRes();

        await this.initialize();
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
        let porter = accounts.getPorters()[1];
        // Launch synchronizer
        await synchronizer.launch();
        for (let i in networkMgr.networks) {
            if (networkMgr.networks[i].chainType == 'SUBSTRATE') {
                await base.transferSubstrateOriginToken(networkMgr.networks[i], users, porter);
            }
        }
        // Mint token to user 1
        console.log('Mint token');
        let index = 1;
        for (let i in global.networkMgr.networks) {
            console.log(i, global.networkMgr.networks[i].chainType);
            await base.mint(global.networkMgr.networks[i].chainType, i, users[1], 100);
            await utils.sleep(5);
            await base.transfer(global.networkMgr.networks[i].chainType, i, 3, users[2], 11);
            if (global.networkMgr.networks[i].chainType == 'SUBSTRATE') {   
                await utils.sleep(30);
            }
            let ret = await base.balanceOf(global.networkMgr.networks[i].chainType, i, users[2]);
            console.log('ret', ret.toString());
            // assert(ret.includes((11 * index).toString()), 'Balance error');
            index++;
        }
    }

    async runTest() {
        console.log('runTests');
        synchronizer.prepare('ft');

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