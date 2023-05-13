# Omniverse system test

Scripts for executing system test

## Prerequisites

- node >= v18
- git

## Usage

### Clone this repository
```
git clone --recursive git@github.com:
```

### Install
```
npm install
```

### Change config
The fields in the [configuration file](./config/default.json) can be changed to fullfil test demands.

- omniverseContractPath: The path of the omniverse contracts
- omniverseToolPath: The path of the omniverse command line tool
- synchronizerPath: The path of the synchronier
- coolingDown: The cooling down time between two omniverse transactions
- networks: Indicates on which chains the test should be run
    - chainType: only `EVM` currently
    - secretKey: The secret key which is used to deploy contracts


### Test
```
node index.js
```