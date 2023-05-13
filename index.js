const nodes = require('./nodes/index');
const contracts = require('./contracts/index');
const coordinator = require('./coordinator');
const tests = require('./tests/index');
const config = require('config');
const { exec } = require('child_process');
const eccrypto = require('eccrypto');
const utils = require('./utils');

const users = [
    '0x0cc0c2de7e8c30525b4ca3b9e0b9703fb29569060d403261055481df7014f7fa',
    '0xb97de1848f97378ee439b37e776ffe11a2fff415b2f93dc240b2d16e9c184ba9',
    '0x42f3b9b31fcaaa03ca71cab7d194979d0d1bedf16f8f4e9414f0ed4df699dd10',
    '0x41219e3efe938f4b1b5bd68389705be763821460b940d5e2bd221f66f40028d3',
    '0x64530eda5f401cc2e9bba4e7b2e0ba9b1bb9d95c344bf8643776b57bb6eb9845',
    '0x76db32cb46895cdb4473c86b4468dbd45f46c1b3d7972002c72bea74efff18ef',
    '0x3b747127e9ea07790d0fe9b8e5b6508953740d6cf0269d3145cdf1b69c22f2bb',
    '0xc01836866febf10022ec9ae632677937f3070d4ed4819e5c6e03d3e8ec02dc2e',
    '0xdf207d299d941818bb4f7822cf003662370a7d685016dfc3f1e2cac03d47fc1d',
    '0x2d9d98ee99c8f7c664125ff2b3b91f356e880917b2d9fc508ffe1b647bd7a9fd',
];

async function main() {
    if (process.argv.length != 3) {
        console.log('Lack of parameter');
        return;
    }

    let userPks = [];
    for (let i = 0; i < users.length; i++) {
        let privateKeyBuffer = Buffer.from(utils.toByteArray(users[i]));
        let publicKeyBuffer = eccrypto.getPublic(privateKeyBuffer);
        let publicKey = '0x' + publicKeyBuffer.toString('hex').slice(2);
        userPks.push(publicKey);
    }

    // Generate config
    let networks = coordinator.generateConfig();

    // Launch nodes
    await nodes.launch(networks);

    // Update truffle config
    coordinator.onDeployContracts(networks);
    // Deploy contracts
    await contracts.deploy(networks);

    // Update synchronizer config
    coordinator.onLaunchSynchronizer(networks, process.argv[2]);
    // Launch synchronizer
    exec('cd ' + config.get('synchronizerPath') + ' && node src/main.js > out.log');    

    // Update test config
    coordinator.onTest(networks, users);
    // Run test cases
    await tests.runFTTests(networks, userPks);
}

main();