const nodes = require('./nodes/index');
const contracts = require('./contracts/index');
const ftTest = require('./tests/ft');
const nftTest = require('./tests/nft');
const config = require('config');
const synchronizer = require('./synchronizer');
const accounts = require('./utils/accounts');
const database = require('./database');

global.networks = {};

async function init() {
    let networks = config.get('networks');
    let index = 0;
    for (let i = 0; i < networks.length; ++i) {
        if (networks[i].count) {
            for (let j = 0; j < networks[i].count; j++) {
                global.networks[index++] = JSON.parse(JSON.stringify(networks[i]));
            }
        }
        else {
            global.networks[index++] = JSON.parse(JSON.stringify(networks[i]));
        }
    }
    accounts.init();
}

async function main() {
    if (process.argv.length != 3) {
        console.log('Lack of parameter');
        return;
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
    await contracts.deploy(process.argv[2]);

    ////////////////////////////////////////////////////////
    //                  Launch Database                   //
    ////////////////////////////////////////////////////////
    database.launch();

    ////////////////////////////////////////////////////////
    //                  Initialize Tests                  //
    ////////////////////////////////////////////////////////
    tests.prepare();

    // Run test cases
    await tests.runTest();

    console.log('Success');
}

main();