const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const accounts = require('../utils/accounts');
const utils = require('../utils/utils');
class SubstrateDeployer {
  constructor() {
    this.contracts = {};
  }

  async deployOmniverse(chainInfo, contractType) {
    let keyring = new Keyring({ type: 'ecdsa' });
    let owner = keyring.addFromSeed(
      Buffer.from(utils.toByteArray(accounts.getOwner()[0]))
    );
    let amount = BigInt('20000000000000000');
    let provider = new WsProvider(chainInfo.ws);
    let api = await ApiPromise.create({
      provider,
      noInitWarn: true,
    });
    {
      let keyring = new Keyring({ type: 'sr25519' });
      let alice = keyring.addFromUri('//Alice');
      await utils.enqueueTask(Queues, api, 'balances', 'transfer', alice, [
        owner.address,
        amount,
      ]);
      if (contractType == 'ft') {
        await utils.enqueueTask(Queues, api, 'assets', 'createToken', alice, [
          accounts.getOwner()[1],
          chainInfo.tokenId,
          null,
          1
        ]);
      } else {
        await utils.enqueueTask(Queues, api, 'uniques', 'createToken', alice, [
          accounts.getOwner()[1],
          chainInfo.tokenId,
          null,
          1
        ]);
      }
    }
    console.log('Substrate waiting for in block');
  }

  async setMembers(contractType) {
    let keyring = new Keyring({ type: 'ecdsa' });
    let owner = keyring.addFromSeed(
      Buffer.from(utils.toByteArray(accounts.getOwner()[0]))
    );
    for (let i in global.networkMgr.networks) {
      if (global.networkMgr.networks[i].chainType == 'SUBSTRATE') {
        let provider = new WsProvider(global.networkMgr.networks[i].ws);
        let api = await ApiPromise.create({
          provider,
          noInitWarn: true,
        });
        let members = [];
        for (let j in global.networkMgr.networks) {
          let network = global.networkMgr.networks[j];
          if (network.chainType == 'EVM') {
            members.push([network.omniverseChainId, network.EVMContract]);
          } else if (network.chainType == 'SUBSTRATE') {
            members.push([network.omniverseChainId, network.tokenId]);
          } else if (network.chainType == 'INK') {
            members.push([network.omniverseChainId, network.tokenId]);
          }
        }
        if (contractType == 'ft') {
          await utils.enqueueTask(Queues, api, 'assets', 'setMembers', owner, [
            networkMgr.networks[i].tokenId,
            members
          ]);
        } else {
          await utils.enqueueTask(Queues, api, 'uniques', 'setMembers', owner, [
            networkMgr.networks[i].tokenId,
            members
          ]);
        }
      }
    }
  }
}

module.exports = new SubstrateDeployer();
