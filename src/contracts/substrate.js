const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const accounts = require('../utils/accounts');
const config = require('config');
const utils = require('../utils/utils');
class SubstrateDeployer {
  constructor() {
    this.tokenInfo = {};
  }

  beforeDeploy(contractType, count) {
    let networks = NetworkMgr.getNetworksByType('SUBSTRATE');
    for (let i in networks) {
      let template = config.get('tokenInfo')[contractType];
      // console.log(template[0])
      this.tokenInfo[networks[i].chainName] = [...template];
      if (template.length != count) {
        for (let j = 1; j < count; ++j) {
          this.tokenInfo[networks[i].chainName].push({
            name: template[0].name + j,
            symbol: template[0].symbol + j,
          });
        }
      }
    }
  }

  async deployOmniverse(chainInfo, contractType, tokenInfo) {
    console.log('Substrate deploy omniverse', chainInfo);
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
          tokenInfo.name,
          null,
          1,
        ]);
        let assetId = (
          await api.query.assets.tokenId2AssetId(tokenInfo.name)
        ).toJSON();
        await utils.enqueueTask(Queues, api, 'assets', 'setMetadata', owner, [
          assetId,
          tokenInfo.name,
          tokenInfo.symbol,
          12,
        ]);
      } else {
        await utils.enqueueTask(Queues, api, 'uniques', 'createToken', alice, [
          accounts.getOwner()[1],
          tokenInfo.name,
          null,
          1,
        ]);
      }
    }
    console.log('Substrate waiting for in block');
  }

  async setMembers(contractType, tokenId) {
    console.log('Substrate set members');
    let keyring = new Keyring({ type: 'ecdsa' });
    let owner = keyring.addFromSeed(
      Buffer.from(utils.toByteArray(accounts.getOwner()[0]))
    );
    for (let i in NetworkMgr.networks) {
      if (NetworkMgr.networks[i].chainType == 'SUBSTRATE') {
        let provider = new WsProvider(NetworkMgr.networks[i].ws);
        let api = await ApiPromise.create({
          provider,
          noInitWarn: true,
        });
        let members = [];
        for (let j in NetworkMgr.networks) {
          let network = NetworkMgr.networks[j];
          if (j != i) {
            if (network.chainType == 'EVM') {
              let member = network.omniverseContractAddress[tokenId];
              members.push([network.omniverseChainId, member]);
            } else if (network.chainType == 'SUBSTRATE') {
              members.push([omniverseChainId, tokenId]);
            } else if (network.chainType == 'INK') {
              members.push([network.omniverseChainId, tokenId]);
            }
          }
        }
        if (contractType == 'ft') {
          await utils.enqueueTask(Queues, api, 'assets', 'setMembers', owner, [
            tokenId,
            members,
          ]);
        } else {
          await utils.enqueueTask(Queues, api, 'uniques', 'setMembers', owner, [
            tokenId,
            members,
          ]);
        }
      }
    }
  }
}

module.exports = new SubstrateDeployer();
