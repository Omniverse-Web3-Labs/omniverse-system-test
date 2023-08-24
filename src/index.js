const nodes = require('./nodes/index');
const contracts = require('./contracts/index');
const ftTest = require('./tests/ft');
const nftTest = require('./tests/nft');
const config = require('config');
const accounts = require('./utils/accounts');
const { program } = require('commander');
const { execSync } = require('child_process');
const synchronizer = require('./synchronizer');
const { queue } = require('async');
const { substrateTxWorker } = require('./utils/utils');
const utils = require('./utils/utils');
global.NetworkMgr = require('./utils/networkMgr');
global.Queues = queue(substrateTxWorker, 1);

function install() {
  console.log('install');
  let cmd =
    'cd ' + config.get('submodules.omniverseContractPath') + ' && npm install';
  execSync(cmd);
  cmd = 'cd ' + config.get('submodules.synchronizerPath') + ' && npm install';
  execSync(cmd);
  cmd =
    'cd ' +
    config.get('submodules.substrateOmniverseToolPath') +
    ' && npm install';
  execSync(cmd);
  cmd =
    'cd ' +
    config.get('submodules.swapServicePath') +
    ' && cd .. && npm install';
  execSync(cmd);
  cmd =
    'cd ' + config.get('submodules.inkOmniverseToolPath') + ' && npm install';
  execSync(cmd);
}

async function init() {
  console.log(
    '///////////////////////////////////////////////////\
    \n//                  Initialize                  //\
    \n//////////////////////////////////////////////////'
  );
  accounts.init();
  NetworkMgr.init();
  await utils.sleep(5);
}

async function deploy(contractType, count) {
  let tests;
  if (contractType == 'token') {
    tests = ftTest;
  } else if (contractType == 'nft') {
    tests = nftTest;
  } else {
    console.log('Contract type error');
    return;
  }

  ////////////////////////////////////////////////////////
  //                  Initialize System                 //
  ////////////////////////////////////////////////////////
  await init();

  ////////////////////////////////////////////////////////
  //                     Launch Nodes                   //
  ////////////////////////////////////////////////////////
  nodes.launch();

  ////////////////////////////////////////////////////////
  //                  Deploy Contracts                  //
  ////////////////////////////////////////////////////////
  await contracts.deploy(contractType, count);

  ////////////////////////////////////////////////////////
  //                Prepare Synchronizer                //
  ////////////////////////////////////////////////////////
  await synchronizer.prepare(contractType);

  ////////////////////////////////////////////////////////
  //                  Initialize Tests                  //
  ////////////////////////////////////////////////////////
  await tests.prepare();

  console.log('Deploy completed');
}

async function test(contractType, count, docker) {
  let tests;
  let doSwap;
  if (contractType == 'token') {
    tests = ftTest;
  } else if (contractType == 'nft') {
    tests = nftTest;
  } else if (contractType == 'swap') {
    contractType = 'token';
    tests = ftTest;
    count = 2;
    doSwap = true;
  } else {
    console.log('Contract type error');
  }

  // Deploy
  await deploy(contractType, count);

  // Run test cases
  await tests.runTest(doSwap, docker);

  console.log('Test competed and successfull');
  console.log('To exit, press Ctrl+C');
  // process.exit();
}

(async function () {
  program
    .version('0.1.0')
    .option('-i, --install', 'Install environment')
    .option('-t, --test <app name>,', 'Test application')
    .option('-d, --deploy <app name>', 'Deploy contracts')
    .option('--docker', 'User docker to launch synchronizer')
    .option('-c, --count <count>', 'The number of contracts to be deployed')
    .parse(process.argv);

  let count = program.opts().count ? Number(program.opts().count) : 1;
  if (program.opts().install) {
    install();
  } else if (program.opts().test) {
    await test(program.opts().test, count, program.opts().docker);
  } else if (program.opts().deploy) {
    await deploy(program.opts().deploy, count);
  }
})();

process.on('unhandledRejection', (err) => {
  console.log('UnhanledRejection', err);
  process.kill(-process.pid);
});

process.on('uncaughtException', (err) => {
  console.log('UnhanledException', err);
  process.kill(-process.pid);
});
