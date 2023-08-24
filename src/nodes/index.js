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
      \n//                 Launch Nodes                  //\
      \n///////////////////////////////////////////////////'
    );
    for (let i in NetworkMgr.networks) {
      if (NetworkMgr.networks[i].rpc) {
        continue;
      }
      this.download(NetworkMgr.networks[i]);
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

  download(chainInfo) {
    if (chainInfo.chainType == 'SUBSTRATE') {
      let tar =
        process.platform == 'linux'
          ? 'node-template.tar.gz'
          : 'node-template-mac.tar.gz';
      let binPath = process.cwd() + '/bin/';
      let bin = binPath + 'node-template';
      let cmd =
        'mkdir -p ' +
        binPath +
        ' && cd ' +
        binPath +
        ' && curl -JLO ' +
        'https://github.com/Omniverse-Web3-Labs/omniverse-swap/releases/download/w3f-m2/' +
        tar;
      if (!fs.existsSync(bin)) {
        if (!fs.existsSync(binPath + tar)) {
          console.log('Waitting for download node-template');
          execSync(cmd);
          console.log('Download node-template succeed');
        }
        cmd = 'cd ' + binPath + ' && tar -xzvf ' + tar;
        execSync(cmd);
      }
    } else if (chainInfo.chainType == 'INK') {
      let tar =
        process.platform == 'linux'
          ? 'substrate-contracts-node-linux.tar.gz'
          : 'substrate-contracts-node-mac-universal.tar.gz';
      let binPath = process.cwd() + '/bin/';
      let bin =
        process.platform == 'linux'
          ? binPath +
            'artifacts/substrate-contract-node-linux/substrate-contracts-node'
          : binPath +
            'artifacts/substrate-contracts-node-mac/substrate-contracts-node';
      let cmd =
        'mkdir -p ' +
        binPath +
        ' && cd ' +
        binPath +
        ' && curl -JLO ' +
        'https://github.com/paritytech/substrate-contracts-node/releases/download/v0.25.1/' +
        tar;
      if (!fs.existsSync(bin)) {
        if (!fs.existsSync(binPath + tar)) {
          console.log('Waitting for download substrate-contract-node');
          execSync(cmd);
          console.log('Download substrate-contract-node succeed');
        }
        cmd = 'cd ' + binPath + ' && tar -xzvf ' + tar;
        execSync(cmd);
      }
    }
  }

  getNodePort(chainName) {
    return this.nodesInfo[chainName];
  }
}

module.exports = new NodesMgr();
