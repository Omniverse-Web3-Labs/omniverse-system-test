const { exec, execSync, spawn } = require('child_process');
const accounts = require('./utils/accounts');
const config = require('config');
const utils = require('./utils/utils');
const database = require('./database');

class Synchronizer {
  constructor() {
    this.instance;
  }

  async updateConfig(contractType) {
    console.log('Synchronizer updateConfig');
    let cfg = JSON.parse(JSON.stringify(config.get('synchronizer')));
    cfg.networks = {};

    for (let i in NetworkMgr.networks) {
      let network = NetworkMgr.networks[i];
      let item = {};
      if (network.chainType == 'EVM') {
        item = JSON.parse(
          JSON.stringify(config.get('synchronizer.networkTemp.EVM'))
        );
        item.chainId = network.chainId;
        item.omniverseContractAddress = network.omniverseContractAddress;
        item.nodeAddress = network.ws;
        item.omniverseChainId = network.omniverseChainId;
      } else if (network.chainType == 'SUBSTRATE') {
        item = JSON.parse(
          JSON.stringify(config.get('synchronizer.networkTemp.SUBSTRATE'))
        );
        item.tokenId = network.tokenId;
        item.nodeAddress = network.ws;
        item.omniverseChainId = network.omniverseChainId;
        if (contractType == 'token') {
          item.pallets = ['assets'];
        } else {
          item.pallets = ['uniques'];
        }
      } else if (network.chainType == 'INK') {
        item = JSON.parse(
          JSON.stringify(config.get('synchronizer.networkTemp.INK'))
        );
        item.omniverseContractAddress =
          NetworkMgr.networks[i].omniverseContractAddress;
        item.nodeAddress = network.ws;
        item.omniverseChainId = network.omniverseChainId;
      } else if (network.chainType == 'BTC') {
        item = JSON.parse(
          JSON.stringify(config.get('synchronizer.networkTemp.BTC'))
        );
        item.omniverseChainId = network.omniverseChainId;
        // clear data
        let ret = execSync('rm -rf ~/.local/share/ord/regtest');
        console.debug('clear ord', ret.toString());
        // create an account for creating inscriptions
        ret = execSync('ord -r --bitcoin-rpc-pass=b --bitcoin-rpc-user=a wallet create');
        console.debug('create wallet', ret.toString());
        let accountStr = execSync('ord -r --bitcoin-rpc-pass=b --bitcoin-rpc-user=a wallet receive');
        let account = JSON.parse(accountStr.toString()).address;
        console.log('account', account);
        // get some BTC for gas fee
        ret = exec('bitcoin-cli -regtest -rpcuser=a -rpcpassword=b generatetoaddress 101 ' + account);
        await utils.sleep(2);
        setInterval(() => {
            exec('bitcoin-cli -regtest -rpcuser=a -rpcpassword=b generatetoaddress 1 ' + account);
        }, 1000);
      }
      cfg.networks[network.chainName] = item;
    }
    if (cfg.database) {
      let databaseRpc = cfg.database.replace('port', database.port);
      cfg.database = databaseRpc;
    }
    fs.writeFileSync(
      config.get('submodules.synchronizerPath') + 'config/default.json',
      JSON.stringify(cfg, null, '\t')
    );
  }

  updateRes() {
    console.log('Synchronizer updateRes');
    execSync(
      'mkdir -p ' +
        config.get('submodules.synchronizerPath') +
        'res && cp ' +
        config.get('submodules.omniverseContractPath') +
        'build/contracts/EVMContract.json ' +
        config.get('submodules.synchronizerPath') +
        'res/EVMContract.json'
    );
    execSync(
      'mkdir -p ' +
        config.get('submodules.synchronizerPath') +
        'res && cp ./res/ink/omniverse_protocol.contract ' +
        config.get('submodules.synchronizerPath') +
        'res/INKContract.json'
    );
  }

  updateSecret() {
    console.log('Synchronizer updateSecret');
    let secretCfg = {};
    for (let i in NetworkMgr.networks) {
      secretCfg[NetworkMgr.networks[i].chainName] = accounts.getPorters()[0];
    }
    fs.writeFileSync(
      config.get('submodules.synchronizerPath') + 'config/.secret',
      JSON.stringify(secretCfg, null, '\t')
    );
  }

  async prepare(contractType) {
    console.log(
      '///////////////////////////////////////////////////\
      \n//           Prepare for Synchronizer           //\
      \n//////////////////////////////////////////////////'
    );
    await this.updateConfig(contractType);

    this.updateRes();

    this.updateSecret();

    await utils.sleep(5);
  }

  beforeLaunch() {
    execSync(
      'cd ' +
        config.get('submodules.synchronizerPath') +
        ' && if [ -f ".state" ]; then rm .state; fi && if [ -f "out.log" ]; then rm out.log; fi && if [ -f "fileout.log" ]; then rm fileout.log; fi'
    );
  }

  async launch() {
    this.beforeLaunch();

    var logStream = fs.createWriteStream(
      config.get('submodules.synchronizerPath') + 'out.log',
      { flags: 'a' }
    );
    this.instance = spawn('node', ['src/main.js'], {
      cwd: config.get('submodules.synchronizerPath'),
    });
    this.instance.stdout.pipe(logStream);
    this.instance.stderr.pipe(logStream);
    await utils.sleep(5);
  }

  shutdown() {
    console.log('shutdown');
    this.instance.kill();
  }
}

module.exports = new Synchronizer();
