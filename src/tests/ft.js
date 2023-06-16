const { execSync } = require('child_process');
const config = require('config');
const utils = require('../utils/utils');
const fs = require('fs');
const accounts = require('../utils/accounts');
const assert = require('assert');
const base = require('./base');
const synchronizer = require('../synchronizer');
const SubstrateChain = require('../contracts/substrate');
const contractsMgr = require('../contracts');
const SwapService = require('./swap');

class Test {
  async initialize() {
    console.log('initialize', global.networkMgr.networks);
    for (let tokenId of contractsMgr.tokenId) {
      console.log('tokenId', tokenId);
      let allienceInfo = '';
      for (let i in global.networkMgr.networks) {
        let network = global.networkMgr.networks[i];
        let item = '';
        if (network.chainType == 'EVM') {
          let name = network.EVMContract[tokenId];
          item = '"' + network.omniverseChainId + '|' + name + '"';
        } else if (network.chainType == 'SUBSTRATE') {
          let name = '0x' + Buffer.from(tokenId).toString('hex');
          item = '"' + network.omniverseChainId + '|' + name + '"';
        }

        if (allienceInfo == '') {
          allienceInfo = item;
        } else {
          allienceInfo += ',' + item;
        }
      }
      let cmd;
      // Omniverse contracts
      console.log('allienceInfo', allienceInfo);
      for (let i in global.networkMgr.networks) {
        let network = global.networkMgr.networks[i];
        if (network.chainType == 'EVM') {
          let subCommand = ' -ti ' + tokenId;
          cmd =
            'cd ' +
            config.get('submodules.omniverseContractPath') +
            ' && node register/index.js -i ' +
            network.chainName +
            ',' +
            allienceInfo +
            subCommand;
          execSync(cmd);
        }
      }
      await SubstrateChain.setMembers('ft', tokenId);
    }

    let users = accounts.getUsers()[1];
    let mpc = accounts.getMpc()[1];
    users.push(mpc);
    console.log('Waiting for transfering substrate native token');
    for (let i in networkMgr.networks) {
      if (networkMgr.networks[i].chainType == 'SUBSTRATE') {
        await base.transferSubstrateNativeToken(
          networkMgr.networks[i],
          users,
          accounts.getPorters()[0]
        );
      }
    }
  }

  updateToolConfig() {
    console.log('updateToolConfig');
    let cfg = {};
    for (let i in global.networkMgr.networks) {
      let item = {};
      let network = global.networkMgr.networks[i];
      if (network.chainType == 'SUBSTRATE') {
        item.nodeAddress = network.rpc;
        item.tokenId = network.tokenId;
        item.omniverseChainId = network.omniverseChainId;
        cfg[network.chainName] = item;
      }
    }
    fs.writeFileSync(
      config.get('submodules.substrateOmniverseToolPath') +
        'config/default.json',
      JSON.stringify(cfg, null, '\t')
    );
  }

  updateToolSecret() {
    console.log('Test updateToolSecret');
    console.log('For EVM');
    let secretCfg = {};
    secretCfg.sks = accounts.getAll()[0];
    secretCfg.index = 0;
    fs.writeFileSync(
      config.get('submodules.omniverseToolPath') + 'register/.secret',
      JSON.stringify(secretCfg, null, '\t')
    );
    fs.writeFileSync(
      config.get('submodules.substrateOmniverseToolPath') + '.secret',
      JSON.stringify(secretCfg, null, '\t')
    );
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
      console.log(global.networkMgr.networks[i].chainType, index);
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

  async testFlow(doSwap) {
    console.log('test flow');
    // Launch synchronizer
    await synchronizer.launch();
    if (doSwap) {
      SwapService.prepare();
      await SwapService.launch();
      console.log('do swap test');
      await this.doSwapTest();
      return;
    }
    let users = accounts.getUsers()[1];
    // Mint token to user 1
    console.log('Mint token');
    let index = 1;
    for (let i in global.networkMgr.networks) {
      let network = global.networkMgr.networks[i];
      console.log(i, network.chainType);
      let tokenIds =
        network.chainType == 'EVM'
          ? Object.keys(network.EVMContract)
          : network.tokenId;
      for (let tokenId of tokenIds) {
        await base.mint(
          network.chainType,
          network.chainName,
          users[1],
          100,
          tokenId
        );
        await utils.sleep(10);
        await base.transfer(
          network.chainType,
          network.chainName,
          4,
          users[2],
          11,
          tokenId
        );
        await utils.sleep(15);
        let ret = base.balanceOf(
          network.chainType,
          network.chainName,
          users[2],
          tokenId
        );
        console.log('ret', ret.toString());
        assert(ret.includes((11 * index).toString()), 'Balance error');
      }
      index++;
    }
  }

  async doSwapTest() {
    let networks = networkMgr.getNetworksByType('SUBSTRATE');
    let user = accounts.getUsers()[1][1];
    let userIndex = 4;
    for (let chainName in networks) {
      let network = networks[chainName];
      let tokenX = network.tokenId[0];
      let mintAmount = 10001000000;
      let tokenXAmount = 10100000;
      let tokenY = network.tokenId[1];
      let tokenYAmount = 1010000000;
      let tradingPairName = tokenX + '/' + tokenY;
      // mint tokenX
      await base.mint(
        network.chainType,
        network.chainName,
        user,
        mintAmount,
        tokenX
      );
      await utils.sleep(10);

      // mint tokenY
      await base.mint(
        network.chainType,
        network.chainName,
        user,
        mintAmount,
        tokenY
      );
      await utils.sleep(10);
      // depist omniverse token to swap
      base.swapDeposit(network.chainName, userIndex, mintAmount, tokenX);
      base.swapDeposit(network.chainName, userIndex, mintAmount, tokenY);
      await utils.sleep(10);

      // check balance of swap.
      this.swapCheck(network.chainName, user, tokenX, mintAmount);
      this.swapCheck(network.chainName, user, tokenY, mintAmount);

      // Add Liquidity
      base.addLiquidity(
        network.chainName,
        userIndex,
        tradingPairName,
        tokenX,
        10000000,
        tokenY,
        1000000000
      );
      base.swapX2Y(network.chainName, userIndex, tradingPairName, 100);
      this.swapCheck(
        network.chainName,
        user,
        tokenX,
        mintAmount - 10000000 - 100
      );
      this.swapCheck(
        network.chainName,
        user,
        tokenY,
        mintAmount - 1000000000 + 9999
      );

      base.swapY2X(network.chainName, userIndex, tradingPairName, 10000);
      this.swapCheck(network.chainName, user, tokenX, mintAmount - 10000000);
      this.swapCheck(
        network.chainName,
        user,
        tokenY,
        mintAmount - 1000000000 - 1
      );

      base.withdraw(
        network.chainName,
        userIndex,
        tokenX,
        mintAmount - 10000000
      );
      await utils.sleep(10);
      this.swapCheck(network.chainName, user, tokenX, 0);
      let ret = base.balanceOf(
        network.chainType,
        network.chainName,
        user,
        tokenX
      );
      console.log(
        tokenX,
        'expect omniverse balance:',
        mintAmount - 10000000,
        'balance of omniverse',
        ret.toString()
      );
      assert(
        ret.includes((mintAmount - 10000000).toLocaleString()),
        'omniverse balance not expect'
      );
    }
  }

  swapCheck(chainName, account, tokenId, expect) {
    let ret = base.swapBalanceOf(chainName, account, tokenId);
    console.log(
      tokenId,
      'expect balance:',
      expect,
      'and balance of swap',
      ret.toString()
    );
    assert(ret.includes(expect.toLocaleString()), 'swap balance not expect');
  }

  async runTest(doSwap) {
    console.log('runTests');

    // await this.testRestore();

    await this.testFlow(doSwap);
  }

  async beforeRestore(network, index) {
    console.log('beforeRestore');
    let users = accounts.getUsers()[1];
    let tokenIds =
      network.chainType == 'EVM'
        ? Object.keys(network.EVMContract)
        : network.tokenId;
    console.log(tokenIds);
    for (let tokenId of tokenIds) {
      await base.mint(
        network.chainType,
        network.chainName,
        users[0],
        100,
        tokenId
      );

      let ret = base.balanceOf(
        network.chainType,
        network.chainName,
        users[0],
        tokenId
      );
      console.log('ret', ret.toString());
      assert(ret.includes((100 * (index - 1)).toString()), 'Balance error');
    }
  }

  async afterRestore(network, index) {
    console.log('afterRestore');
    await utils.sleep(5);
    let users = accounts.getUsers()[1];
    let tokenIds =
      typeof network.EVMContract == 'object'
        ? Object.keys(network.EVMContract)
        : network.tokenId;
    for (let tokenId of tokenIds) {
      let ret = base.balanceOf(
        network.chainType,
        network.chainName,
        users[0],
        tokenId
      );
      console.log('ret', ret.toString());
      assert(ret.includes((100 * (index - 1)).toString()), 'Balance error');
    }
  }
}

module.exports = new Test();
