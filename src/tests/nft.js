const { execSync } = require("child_process");
const config = require('config');
const utils = require('../utils/utils');
const fs = require('fs');
const accounts = require('../utils/accounts');
const assert = require('assert');
const base = require('./baseNFT');
const synchronizer = require("../synchronizer");
const SubstrateChain = require('../contracts/substrate')

function checkOwner(value, chainType, pk, including) {
    if (chainType == 'SUBSTRATE') {
        let addr = utils.toSubstrateAddress(pk);
        let ret = value.includes(addr);
        assert(including ? ret : !ret, 'Balance error');
    }
    else {
        let ret = value.includes(pk);
        assert(including ? ret : !ret, 'Balance error');            
    }
}

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
                cmd = 'cd ' + config.get('submodules.omniverseContractPath') + ' && node register/nft.js -i ' + i + ',http://,' + allienceInfo;
                execSync(cmd);
            }
        }

        await SubstrateChain.setMembers('nft');
        
        let users = accounts.getUsers()[1];
        for (let i in networkMgr.networks) {
            if (networkMgr.networks[i].chainType == 'SUBSTRATE') {
                await base.transferSubstrateOriginToken(networkMgr.networks[i], users, accounts.getPorters()[0]);
            }
        }
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
        let index = 1;
        for (let i in global.networkMgr.networks) {
            // Prepare for testing work restore
            await this.beforeRestore(global.networkMgr.networks[i], index);

            // Launch synchronizer
            await synchronizer.launch();

            // Test work restore
            await this.afterRestore(global.networkMgr.networks[i], index);

            // Shut down synchronizer
            synchronizer.shutdown();

            index++;
        }
    }

    async testFlow() {
        console.log('testFlow');
        let users = accounts.getUsers()[1];
        // Launch synchronizer
        await synchronizer.launch();

        // Mint token to user 1
        console.log('Mint token');
        let index = 100;
        for (let i in global.networkMgr.networks) {
            console.log(i, global.networkMgr.networks[i].chainType);
            await base.mint(global.networkMgr.networks[i].chainType, i, users[1], index);
            await utils.sleep(20);
            await base.transfer(global.networkMgr.networks[i].chainType, i, 3, users[2], index);
            await utils.sleep(20);
            let ret = await base.ownerOf(global.networkMgr.networks[i].chainType, i, index);
            console.log('ret', ret.toString());
            checkOwner(ret, global.networkMgr.networks[i].chainType, users[2], true);
            index++;
        }
    }

    async runTest() {
        console.log('runTests');

        // await this.testRestore();

        await this.testFlow();
    }

    async beforeRestore(network, index) {
        console.log('beforeRestore');
        let users = accounts.getUsers()[1];
        // Mint to user 0
        base.mint(network.chainType, network.chainName, users[0], index);
        await utils.sleep(2);

        let ret = await base.ownerOf(network.chainType, network.chainName, index);
        console.log('ret', ret.toString())
        checkOwner(ret, network.chainType, users[0], false);
    }

    async afterRestore(network, index) {
        console.log('afterRestore');
        let users = accounts.getUsers()[1];

        let ret = await base.ownerOf(network.chainType, network.chainName, index);
        console.log('ret', ret.toString());
        checkOwner(ret, network.chainType, users[0], true);
    }
}

module.exports = new Test();