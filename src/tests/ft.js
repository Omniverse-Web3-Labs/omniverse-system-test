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
const prompt = require('prompt-sync')();

class Test {
  async initialize() {
    for (let tokenId of contractsMgr.tokenId) {
      console.log('tokenId', tokenId);
      let allienceInfo = '';
      for (let i in NetworkMgr.networks) {
        let network = NetworkMgr.networks[i];
        let item = '';
        if (network.chainType == 'EVM') {
          let name = network.omniverseContractAddress[tokenId];
          item = '"' + network.omniverseChainId + '|' + name + '"';
        } else if (network.chainType == 'SUBSTRATE') {
          let name = '0x' + Buffer.from(tokenId).toString('hex');
          item = '"' + network.omniverseChainId + '|' + name + '"';
        } else if (network.chainType == 'INK') {
          let name =
            '0x' +
            Buffer.from(network.omniverseContractAddress[tokenId]).toString(
              'hex'
            );
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
      for (let i in NetworkMgr.networks) {
        let network = NetworkMgr.networks[i];
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
        } else if (network.chainType == 'INK') {
          let subCommand = ' -ti ' + tokenId;
          cmd =
            'cd ' +
            config.get('submodules.inkOmniverseToolPath') +
            ' && node index.js -i ' +
            network.chainName +
            ',' +
            allienceInfo +
            subCommand;
          execSync(cmd);
        }
      }
      await SubstrateChain.setMembers('token', tokenId);
    }

    let users = accounts.getUsers()[1];
    let mpc = accounts.getMpc()[1];
    users.push(mpc);
    console.log('Waiting for transfering substrate native token');
    for (let i in NetworkMgr.networks) {
      if (NetworkMgr.networks[i].chainType == 'SUBSTRATE') {
        await base.transferSubstrateNativeToken(
          NetworkMgr.networks[i],
          users,
          accounts.getPorters()[0]
        );
      } else if (NetworkMgr.networks[i].chainType == 'INK') {
        await base.transferSubstrateNativeToken(
          NetworkMgr.networks[i],
          users,
          accounts.getPorters()[0]
        );
      }
    }
  }

  updateToolConfig() {
    console.log('Test updateToolConfig');
    let cfg = {};
    for (let i in NetworkMgr.networks) {
      let item = {};
      let network = NetworkMgr.networks[i];
      if (network.chainType == 'SUBSTRATE') {
        item.nodeAddress = network.rpc;
        item.tokenId = network.tokenId;
        item.omniverseChainId = network.omniverseChainId;
        cfg[network.chainType]
          ? (cfg[network.chainType][network.chainName] = item)
          : (cfg[network.chainType] = { [network.chainName]: item });
      } else if (network.chainType == 'INK') {
        item.nodeAddress = network.rpc;
        item.coolingDown = network.coolingDown;
        item.omniverseChainId = network.omniverseChainId;
        item.omniverseContractAddress = network.omniverseContractAddress;
        item.metadataPath = './res/INKContract.json';
        cfg[network.chainType]
          ? (cfg[network.chainType][network.chainName] = item)
          : (cfg[network.chainType] = { [network.chainName]: item });
      }
    }
    if (cfg['SUBSTRATE']) {
      fs.writeFileSync(
        config.get('submodules.substrateOmniverseToolPath') +
          'config/default.json',
        JSON.stringify(cfg['SUBSTRATE'], null, '\t')
      );
    }
    if (cfg['INK']) {
      fs.writeFileSync(
        config.get('submodules.inkOmniverseToolPath') + 'config/default.json',
        JSON.stringify(cfg['INK'], null, '\t')
      );
    }
  }

  updateToolSecret() {
    console.log('Test updateToolSecret');
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
    fs.writeFileSync(
      config.get('submodules.inkOmniverseToolPath') + '.secret',
      JSON.stringify(secretCfg, null, '\t')
    );
  }

  updateToolRes() {
    console.log('Test updateToolRes');
    execSync(
      'mkdir -p ' +
        config.get('submodules.inkOmniverseToolPath') +
        'res' +
        ' && cp ./res/ink/omniverse_protocol.contract ' +
        config.get('submodules.inkOmniverseToolPath') +
        'res/INKContract.json'
    );
    // execSync('cp ' + config.get('') + 'build/contracts/.json ' + config.get('') + 'res/');
    // execSync('cd ' + config.get('') + ' && echo -n ' + '' + ' > .secret');
  }

  async prepare() {
    console.log(
      '///////////////////////////////////////////////////\
      \n//             Prepare for Testing              //\
      \n///////////////////////////////////////////////////'
    );
    this.updateToolConfig();

    this.updateToolSecret();

    this.updateToolRes();

    await this.initialize();

    await utils.sleep(10);
  }

  async testRestore() {
    console.log(
      '////////////////////////////////////////////////////\
      \n//               Test work Restore               //\
      \n///////////////////////////////////////////////////'
    );
    let index = 1;
    for (let i in NetworkMgr.networks) {
      console.log(NetworkMgr.networks[i].chainType, index);
      // Prepare for testing work restore
      await this.beforeRestore(NetworkMgr.networks[i], index);

      // Launch synchronizer
      await synchronizer.launch();

      // Test work restore
      await this.afterRestore(NetworkMgr.networks[i], index);

      // Shut down synchronizer
      synchronizer.shutdown();

      index++;
    }
  }

  updateToolSecret() {
    console.log('Test updateToolSecret');
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
    fs.writeFileSync(
      config.get('submodules.inkOmniverseToolPath') + '.secret',
      JSON.stringify(secretCfg, null, '\t')
    );
  }

  async testFlow(doSwap, docker) {
    console.log(
      '///////////////////////////////////////////////////\
      \n//                 Test Workflow                //\
      \n//////////////////////////////////////////////////'
    );
    // Launch synchronizer
    if (docker) {
      while (true) {
        const userInput = prompt('Have you launched the synchronizer(y)?');
        if (userInput == 'y') {
          break;
        } else {
          console.log('Please input y');
          continue;
        }
      }
    } else {
      await synchronizer.launch();
    }
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
    for (let i in NetworkMgr.networks) {
      let network = NetworkMgr.networks[i];
      console.log(i, network.chainType);
      let tokenIds =
        network.chainType != 'SUBSTRATE'
          ? Object.keys(network.omniverseContractAddress)
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
        // let ret = base.balanceOf(
        //   network.chainType,
        //   network.chainName,
        //   users[2],
        //   tokenId
        // );
        // console.log('ret', ret.toString());
        console.log('user1:');
        this.getAllBalance(
          NetworkMgr.networks,
          users[1],
          tokenId,
          (100 - 11) * index
        );
        console.log('user2:');
        this.getAllBalance(NetworkMgr.networks, users[2], tokenId, 11 * index);
      }
      index++;
    }
  }

  async doSwapTest() {
    let networks = NetworkMgr.getNetworksByType('SUBSTRATE');
    let user = accounts.getUsers()[1][1];
    let userIndex = 4;
    for (let chainName in networks) {
      let network = networks[chainName];
      let tokenX = network.tokenId[0];
      let mintAmount = 10001000000;
      let tokenY = network.tokenId[1];
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
      console.log('user:');
      this.getAllBalance(NetworkMgr.networks, user, tokenX, mintAmount);
      this.getAllBalance(NetworkMgr.networks, user, tokenY, mintAmount);

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

      base.withdraw(
        network.chainName,
        userIndex,
        tokenY,
        mintAmount - 1000000000 - 1
      );
      await utils.sleep(10);
      this.swapCheck(network.chainName, user, tokenY, 0);

      let ret = base.balanceOf(
        network.chainType,
        network.chainName,
        user,
        tokenX
      );
      
      console.log('user:');
      this.getAllBalance(
        NetworkMgr.networks,
        user,
        tokenX,
        mintAmount - 10000000
      );
      this.getAllBalance(
        NetworkMgr.networks,
        user,
        tokenY,
        mintAmount - 1000000000 - 1
      );
    }
  }

  getAllBalance(networks, account, tokenId, expect) {
    for (let i in networks) {
      let network = networks[i];
      let ret = base
        .balanceOf(network.chainType, network.chainName, account, tokenId)
        .toString();
      console.log(tokenId + ' On', network.chainName, ret);

      assert(
        ret.includes(expect.toLocaleString()) ||
          ret.includes(expect.toString()),
        'Balance error'
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

  async runTest(doSwap, docker) {
    console.log('runTests');

    // await this.testRestore();

    await this.testFlow(doSwap, docker);
  }

  async beforeRestore(network, index) {
    console.log('beforeRestore');
    let users = accounts.getUsers()[1];
    let tokenIds =
      network.chainType == 'EVM'
        ? Object.keys(network.omniverseContractAddress)
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
      typeof network.omniverseContractAddress == 'object'
        ? Object.keys(network.omniverseContractAddress)
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
