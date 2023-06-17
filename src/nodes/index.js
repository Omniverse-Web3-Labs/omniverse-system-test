const EVMChain = require('./EVMChain');
const SustrateChain = require('./substrate');
const InkChain = require('./ink');
const { execSync } = require('child_process');

class NodesMgr {
  constructor() {
    this.id = 0;
    this.nodesInfo = {};
    this.port = 9500;
  }

  init() {}

  /**
   * @method launch Launch nodes for testing
   */
  launch() {
    console.log(
      '///////////////////////////////////////////////////\
      \n//                 Luanch Nodes                  //\
      \n///////////////////////////////////////////////////'
    );
    for (let i in NetworkMgr.networks) {
      if (NetworkMgr.networks[i].rpc) {
        continue;
      }
      this.launchChain(NetworkMgr.networks[i]);
      if (NetworkMgr.networks[i].chainType == 'SUBSTRATE') {
        NetworkMgr.networks[i].rpc = 'ws://127.0.0.1:' + this.port;
        NetworkMgr.networks[i].ws = 'ws://127.0.0.1:' + this.port;
      } else if (NetworkMgr.networks[i].chainType == 'EVM') {
        NetworkMgr.networks[i].rpc = 'http://127.0.0.1:' + this.port;
        NetworkMgr.networks[i].ws = 'http://127.0.0.1:' + this.port;
      } else if (NetworkMgr.networks[i].chainType == 'INK') {
        NetworkMgr.networks[i].rpc = 'ws://127.0.0.1:' + this.port;
        NetworkMgr.networks[i].ws = 'ws://127.0.0.1:' + this.port;
      }
      NetworkMgr.networks[i].port = this.port;
      this.nodesInfo[i] = this.port++;
    }
    console.log('All nodes information:', NetworkMgr.networks);
  }

  /**
   * @method launchChain Launch a node of `chainInfo`
   * @param chainInfo Information of the chain to be launched
   * @return Port of the chain
   */
  launchChain(chainInfo) {
    console.log('launchChain', chainInfo);
    if (chainInfo.chainType == 'EVM') {
      EVMChain.launch(this.port, chainInfo);
    } else if (chainInfo.chainType == 'SUBSTRATE') {
      SustrateChain.launch(this.port, chainInfo);
    } else if (chainInfo.chainType == 'INK') {
      InkChain.launch(this.port, chainInfo);
    }
  }

  getNodePort(chainName) {
    return this.nodesInfo[chainName];
  }
}

module.exports = new NodesMgr();
