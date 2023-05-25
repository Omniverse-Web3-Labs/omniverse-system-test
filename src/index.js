const nodes = require('./nodes/index');
const contracts = require('./contracts/index');
const ftTest = require('./tests/ft');
const nftTest = require('./tests/nft');
const config = require('config');
const accounts = require('./utils/accounts');
const database = require('./database');
const { program } = require('commander');
const { execSync } = require("child_process");
const synchronizer = require('./synchronizer');
global.networkMgr = require('./utils/networkMgr');
global.Childs = [];

function install() {
    console.log('install');
    let cmd = "cd " + config.get('submodules.omniverseContractPath') + " && npm install";
    execSync(cmd);
    cmd = "cd " + config.get('submodules.synchronizerPath') + " && npm install";
    execSync(cmd);
    cmd = "cd " + config.get('submodules.databasePath') + " && npm install";
    execSync(cmd);
    cmd = "cd " + config.get('submodules.substrateOmniverseToolPath') + " && npm install";
    execSync(cmd);
}

async function init() {
    accounts.init();
    global.networkMgr.init();
}

async function deploy(contractType) {
    let tests;
    if (contractType == 'ft') {
        tests = ftTest;
    }
    else if (contractType == 'nft') {
        tests = nftTest;
    }
    else {
        console.log('Contract type error');
    }

    ////////////////////////////////////////////////////////
    //                  Initialize System                 //
    ////////////////////////////////////////////////////////
    init();

    ////////////////////////////////////////////////////////
    //                     Launch Nodes                   //
    ////////////////////////////////////////////////////////
    nodes.launch();

    ////////////////////////////////////////////////////////
    //                  Deploy Contracts                  //
    ////////////////////////////////////////////////////////
    await contracts.deploy(contractType);

    ////////////////////////////////////////////////////////
    //                  Prepare Database                  //
    ////////////////////////////////////////////////////////
    database.prepare(contractType);

    ////////////////////////////////////////////////////////
    //                Prepare Synchronizer                //
    ////////////////////////////////////////////////////////
    synchronizer.prepare(contractType);

    ////////////////////////////////////////////////////////
    //                  Initialize Tests                  //
    ////////////////////////////////////////////////////////
    await tests.prepare();
}

async function test(contractType) {
    let tests;
    if (contractType == 'ft') {
        tests = ftTest;
    }
    else if (contractType == 'nft') {
        tests = nftTest;
    }
    else {
        console.log('Contract type error');
    }

    // Deploy
    await deploy(contractType);

    ////////////////////////////////////////////////////////
    //                  Launch Database                   //
    ////////////////////////////////////////////////////////
    await database.launch(contractType);

    // Run test cases
    await tests.runTest();

    console.log('Success');
}

(async function () {
    program
        .version('0.1.0')
        .option('-i, --install', 'Install environment')
        .option('-t, --test <app name>', 'Test application')
        .option('-d, --deploy', 'Deploy contracts')
        .parse(process.argv);

    if (program.opts().install) {
        install();
    }
    else if (program.opts().test) {
        await test(program.opts().test);
    }
    else if (program.opts().deploy) {
        await deploy(program.opts().test);
    }
}());

// kill the child process
process.on('exit', () => {
    for (let child of Childs) {
        process.kill(child.pid);
    }
});