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
            let network = global.networkMgr.networks[i];
            let item = '';
            if (network.chainType == 'EVM') {
                item = '"' + network.omniverseChainId + '|' + network.EVMContract + '"';
            } else if (network.chainType == 'SUBSTRATE') {
                let tokenId = '0x' + Buffer.from(network.tokenId).toString('hex');
                item = '"' + network.omniverseChainId + '|' + tokenId + '"';
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
            let network = global.networkMgr.networks[i];
            if (network.chainType == 'EVM') {
                cmd = 'cd ' + config.get('submodules.omniverseContractPath') + ' && node register/nft.js -i ' + network.chainName + ',http://,' + allienceInfo;
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
            let network = global.networkMgr.networks[i];
            let item = {};
            if (network.chainType == 'SUBSTRATE') {
                item.nodeAddress = network.rpc;
                item.tokenId = network.tokenId;
                item.omniverseChainId = network.omniverseChainId;
                cfg[network.chainName] = item;
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
            console.log('111 3')
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
            let network = global.networkMgr.networks[i];
            console.log(i, network.chainType);
            await base.mint(network.chainType, network.chainName, users[1], index);
            await utils.sleep(20);
            await base.transfer(network.chainType, network.chainName, 3, users[2], index);
            await utils.sleep(20);
            let ret = await base.ownerOf(network.chainType, network.chainName, index);
            console.log('ret', ret.toString());
            checkOwner(ret.toString(), network.chainType, users[2], true);
            index++;
        }
    }

    async runTest() {
        console.log('runTests');

        await this.testRestore();

        await this.testFlow();
    }

    async beforeRestore(network, index) {
        console.log('beforeRestore');
        let users = accounts.getUsers()[1];
        // Mint to user 0
        await base.mint(network.chainType, network.chainName, users[0], index);
        await utils.sleep(5);

        let ret = base.ownerOf(network.chainType, network.chainName, index);
        console.log('ret', ret.toString())
        checkOwner(ret.toString(), network.chainType, users[0], false);
    }

    async afterRestore(network, index) {
        console.log('afterRestore');
        await utils.sleep(20);
        let users = accounts.getUsers()[1];

        let ret = await base.ownerOf(network.chainType, network.chainName, index);
        console.log('ret', ret.toString());
        checkOwner(ret.toString(), network.chainType, users[0], true);
    }
}

module.exports = new Test();