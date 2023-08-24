# Omniverse system test

Scripts for executing system test

## Prerequisites

- node >= v18
- git

## Usage

### Clone this repository
```
git clone --recursive https://github.com/Omniverse-Web3-Labs/omniverse-system-test.git
```

### Install

Install for the system test tool
```
npm install
```

Install for related tools
```
npm src/index.js -i
```

### Change config
The fields in the [configuration file](./config/default.json) can be changed to fullfil test demands.

- submodules
    - omniverseContractPath: The path of the omniverse contracts
    - omniverseToolPath: The path of the EVM omniverse command line tool
    - synchronizerPath: The path of the synchronier
    - substrateOmniverseToolPath: The path of substrate omniverse command line tool
    - swapServicePath: The path of swap service
    - inkOmniverseToolPath: the path of INK omniverse command line tool
- coolingDown: The cooling down time between two omniverse transactions
- networks: Indicates on which chains the test should be run
    - chainType: `EVM`, `SUBSTRATE`, `INK`
    - omniverseChainId: The omniverse chain id is set for all public chains, namely each chain will have a unique omniverse chain id.
    - coolingDown: Cooling down time, the interval between two omniverse transactions.
    - chainName: The chain name you assign to the chain.


### Test
```
node src/index.js -t token
```