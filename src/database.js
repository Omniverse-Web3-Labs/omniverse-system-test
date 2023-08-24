const config = require('config');
const { spawn, execSync } = require('child_process');
const utils = require('./utils/utils');
const fs = require('fs');
const nodesMgr = require('./nodes');

class Database {
  constructor() {
    this.port;
  }

  updateDatabaseConfig(contractType) {
    console.log('updateDatabaseConfig');
    let cfg = JSON.parse(JSON.stringify(config.get('database')));
    cfg.port = ++nodesMgr.port;
    this.port = cfg.port;
    cfg.networks = {};

    for (let i in NetworkMgr.networks) {
      let network = NetworkMgr.networks[i];
      let item = JSON.parse(
        JSON.stringify(config.get(`database.networkTemp.${network.chainType}`))
      );
      item.nodeAddress = network.ws;
      item.omniverseChainId = network.omniverseChainId;
      if (network.chainType == 'EVM') {
        item.chainId = NetworkMgr.networks[i].chainId;
        item.omniverseContractAddress = network.omniverseContractAddress;
      } else if (network.chainType == 'SUBSTRATE') {
        item.tokenId = NetworkMgr.networks[i].tokenId;
        if (contractType == 'token') {
          item.pallets = ['assets'];
        } else {
          item.pallets = ['uniques'];
        }
        console.log(item);
      }
      cfg.networks[network.chainName] = item;
    }
    fs.writeFileSync(
      config.get('submodules.databasePath') + 'config/default.json',
      JSON.stringify(cfg, null, '\t')
    );
  }

  updateDatabaseRes() {
    console.log('updateDatabaseRes');
    execSync(
      'mkdir -p ' +
        config.get('submodules.databasePath') +
        'res && cp ' +
        config.get('submodules.omniverseContractPath') +
        'build/contracts/EVMContract.json ' +
        config.get('submodules.databasePath') +
        'res/EVMContract.json'
    );
  }

  prepare(contractType) {
    this.updateDatabaseConfig(contractType);

    this.updateDatabaseRes(contractType);
  }

  beforeLaunch() {
    execSync(
      'cd ' +
        config.get('submodules.databasePath') +
        ' && if [ -f "omniverse.db" ]; then rm omniverse.db; fi && if [ -f ".state" ]; then rm .state; fi && if [ -f "out.log" ]; then rm out.log; fi'
    );
  }

  async launch() {
    console.log('Launch database');
    this.beforeLaunch();

    var logStream = fs.createWriteStream(
      config.get('submodules.databasePath') + 'out.log',
      { flags: 'a' }
    );
    let ret = spawn('node', ['src/main.js'], {
      cwd: config.get('submodules.databasePath'),
    });
    ret.stdout.pipe(logStream);
    ret.stderr.pipe(logStream);
    await utils.sleep(5);
  }
}

module.exports = new Database();
