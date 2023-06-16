const utils = require('../utils/utils');
const config = require('config');
const { execSync } = require('child_process');
const { ApiPromise, Keyring, WsProvider } = require('@polkadot/api');

module.exports = {
  switchAccount(index) {
    let cmd =
      'cd ' +
      config.get('submodules.omniverseToolPath') +
      ' && node register/index.js -s ' +
      index;
    execSync(cmd);
  },

  async mint(chainType, chainName, to, token, tokenId) {
    let ret;
    if (chainType == 'EVM') {
      let subCommand = tokenId ? ' -ti ' + tokenId : '';
      let cmd =
        'cd ' +
        config.get('submodules.omniverseToolPath') +
        ' && node register/index.js -s 0';
      execSync(cmd);
      cmd =
        'cd ' +
        config.get('submodules.omniverseToolPath') +
        ' && node register/index.js -m ' +
        chainName +
        ',' +
        to +
        ',' +
        token +
        subCommand;
      ret = execSync(cmd);
      await utils.sleep(2);
    } else if (chainType == 'SUBSTRATE') {
      let cmd =
        'cd ' +
        config.get('submodules.substrateOmniverseToolPath') +
        ' && node index.js -s 0';
      execSync(cmd);
      cmd =
        'cd ' +
        config.get('submodules.substrateOmniverseToolPath') +
        ' && node index.js -m ' +
        chainName +
        ',' +
        tokenId +
        ',' +
        to +
        ',' +
        token;
      ret = execSync(cmd);
      await utils.sleep(3);
    } else if (chainType == 'INK') {
      let cmd =
        'cd ' +
        config.get('submodules.inkOmniverseToolPath') +
        ' && node index.js -s 0';
      execSync(cmd);
      cmd =
        'cd ' +
        config.get('submodules.inkOmniverseToolPath') +
        ' && node index.js -m ' +
        chainName +
        ',' +
        to +
        ',' +
        token;
      ret = execSync(cmd);
      await utils.sleep(3);
    }
    console.log('mint', chainType, ret.toString());
  },

  async transfer(chainType, chainName, fromIndex, to, token, tokenId) {
    let ret;
    if (chainType == 'EVM') {
      let subCommand = tokenId ? ' -ti ' + tokenId : '';
      let cmd =
        'cd ' +
        config.get('submodules.omniverseToolPath') +
        ' && node register/index.js -s ' +
        fromIndex;
      execSync(cmd);
      cmd =
        'cd ' +
        config.get('submodules.omniverseToolPath') +
        ' && node register/index.js -t ' +
        chainName +
        ',' +
        to +
        ',' +
        token +
        subCommand;
      ret = execSync(cmd);
      await utils.sleep(2);
    } else if (chainType == 'SUBSTRATE') {
      let cmd =
        'cd ' +
        config.get('submodules.substrateOmniverseToolPath') +
        ' && node index.js -s ' +
        fromIndex;
      execSync(cmd);
      cmd =
        'cd ' +
        config.get('submodules.substrateOmniverseToolPath') +
        ' && node index.js -t ' +
        chainName +
        ',' +
        tokenId +
        ',' +
        to +
        ',' +
        token;
      ret = execSync(cmd);
      await utils.sleep(3);
    } else if (chainType == 'INK') {
      let cmd =
        'cd ' +
        config.get('submodules.inkOmniverseToolPath') +
        ' && node index.js -s ' +
        fromIndex;
      execSync(cmd);
      cmd =
        'cd ' +
        config.get('submodules.inkOmniverseToolPath') +
        ' && node index.js -t ' +
        chainName +
        ',' +
        to +
        ',' +
        token;
      ret = execSync(cmd);
      await utils.sleep(3);
    }
    console.log('transfer', chainType, ret.toString());
  },

  balanceOf(chainType, chainName, account, tokenId) {
    let ret;
    if (chainType == 'EVM') {
      let subCommand = tokenId ? ' -ti ' + tokenId : '';
      let cmd =
        'cd ' +
        config.get('submodules.omniverseToolPath') +
        ' && node register/index.js -ob ' +
        chainName +
        ',' +
        account +
        subCommand;
      ret = execSync(cmd);
    } else if (chainType == 'SUBSTRATE') {
      let cmd =
        'cd ' +
        config.get('submodules.substrateOmniverseToolPath') +
        ' && node index.js -o ' +
        chainName +
        ',' +
        tokenId +
        ',' +
        account;
      ret = execSync(cmd);
    } else if (chainType == 'INK') {
      let cmd =
        'cd ' +
        config.get('submodules.inkOmniverseToolPath') +
        ' && node index.js -o ' +
        chainName +
        ',' +
        account;
      ret = execSync(cmd);
    }
    return ret;
  },

  swapBalanceOf(chainName, account, tokenId) {
    let cmd =
      'cd ' +
      config.get('submodules.substrateOmniverseToolPath') +
      ' && node index.js -bs ' +
      chainName +
      ',' +
      tokenId +
      ',' +
      account;
    return execSync(cmd);
  },

  swapDeposit(chainName, fromIndex, token, tokenId) {
    let cmd =
      'cd ' +
      config.get('submodules.substrateOmniverseToolPath') +
      ' && node index.js -s ' +
      fromIndex;
    execSync(cmd);
    cmd =
      'cd ' +
      config.get('submodules.substrateOmniverseToolPath') +
      ' && node index.js -d ' +
      chainName +
      ',' +
      tokenId +
      ',' +
      token;
    execSync(cmd);
  },

  addLiquidity(
    chainName,
    fromIndex,
    tradingPairName,
    tokenX,
    tokenXAmount,
    tokenY,
    tokenYAmount
  ) {
    let cmd =
      'cd ' +
      config.get('submodules.substrateOmniverseToolPath') +
      ' && node index.js -s ' +
      fromIndex;
    execSync(cmd);
    cmd =
      'cd ' +
      config.get('submodules.substrateOmniverseToolPath') +
      ' && node index.js -al ' +
      chainName +
      ',' +
      tradingPairName +
      ',' +
      tokenX +
      ',' +
      tokenXAmount +
      ',' +
      tokenY +
      ',' +
      tokenYAmount;
    execSync(cmd);
  },

  swapX2Y(chainName, fromIndex, tradingPairName, token) {
    let cmd =
      'cd ' +
      config.get('submodules.substrateOmniverseToolPath') +
      ' && node index.js -s ' +
      fromIndex;
    execSync(cmd);
    cmd =
      'cd ' +
      config.get('submodules.substrateOmniverseToolPath') +
      ' && node index.js -x2y ' +
      chainName +
      ',' +
      tradingPairName +
      ',' +
      token;
    execSync(cmd);
  },

  swapY2X(chainName, fromIndex, tradingPairName, token) {
    let cmd =
      'cd ' +
      config.get('submodules.substrateOmniverseToolPath') +
      ' && node index.js -s ' +
      fromIndex;
    execSync(cmd);
    cmd =
      'cd ' +
      config.get('submodules.substrateOmniverseToolPath') +
      ' && node index.js -y2x ' +
      chainName +
      ',' +
      tradingPairName +
      ',' +
      token;
    execSync(cmd);
  },

  withdraw(chainName, fromIndex, tokenId, token) {
    let cmd =
      'cd ' +
      config.get('submodules.substrateOmniverseToolPath') +
      ' && node index.js -s ' +
      fromIndex;
    execSync(cmd);
    cmd =
      'cd ' +
      config.get('submodules.substrateOmniverseToolPath') +
      ' && node index.js -w ' +
      chainName +
      ',' +
      tokenId +
      ',' +
      token;
    execSync(cmd);
  },

  async transferSubstrateNativeToken(network, users, porter) {
    let provider = new WsProvider(network.ws);
    let api = await ApiPromise.create({
      provider,
      noInitWarn: true,
    });
    let amount = BigInt('1000000000000000');
    let keyring = new Keyring({ type: 'sr25519' });
    let alice = keyring.addFromUri('//Alice');
    for (let user of users) {
      let address = utils.toSubstrateAddress(user);
      await utils.enqueueTask(Queues, api, 'balances', 'transfer', alice, [
        address,
        amount,
      ]);
    }
    let address = keyring.addFromSeed(
      Buffer.from(porter.substr(2), 'hex')
    ).address;
    await utils.enqueueTask(Queues, api, 'balances', 'transfer', alice, [
      address,
      amount,
    ]);
  },
};
