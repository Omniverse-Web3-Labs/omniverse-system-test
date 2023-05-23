const { encodeAddress, blake2AsHex } = require('@polkadot/util-crypto');
const expectThrow = async (promise, message) => {
    try {
        await promise;
    }
    catch (err) {
        if (!message) {
            const outOfGas = err.message.includes("out of gas");
            const invalidOpcode = err.message.includes("invalid opcode");
            assert(
                outOfGas || invalidOpcode,
                "Expected throw, got `" + err + "` instead"
            );
        }
        else {
            const expectedException = err.message.includes(message);
            assert(expectedException,
                "Expected throw, got `" + err + "` instead")
        }
        return;
    }
    assert.fail("Expected throw not received");
};

// Convert hex string to u8 array
function toByteArray(hexString) {
    if (hexString.substr(0, 2) == '0x') {
        hexString = hexString.substr(2);
    }
    
    let result = [];
    for (let i = 0; i < hexString.length; i += 2) {
        result.push(parseInt(hexString.substr(i, 2), 16));
    }
    return result;
}

// Convert normal string to u8 array
function stringToByteArray(str) {
    return Array.from(str, function(byte) {
        return byte.charCodeAt(0);
    });
}

// Convert u8 array to hex string
function toHexString(byteArray) {
    return '0x' + Array.from(byteArray, function(byte) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('')
}

// Mine one block
async function evmMineOneBlock (provider) {
    await new Promise((resolve, reject) => {
        provider.send({
            jsonrpc: "2.0",
            method: "evm_mine",
            id: new Date().getTime()
            }, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
    });
};


async function sleep(seconds) {
    await new Promise((resolve) => {
        setTimeout(() => {
        resolve();
        }, seconds * 1000);
    });
}

// Mine blocks
async function evmMine (num, provider) {
    for (let i = 0; i < num; i++) {
        await evmMineOneBlock(provider);
    }
};

// Returns the latest block
async function getBlock(web3js) {
    let block = await web3js.eth.getBlock("latest");
    return block;
}

function toSubstrateAddress(publicKey) {
    if (publicKey.substr(0, 2) == '0x') {
      publicKey = publicKey.substr(2);
    }
  
    const y = "0x" + publicKey.substring(64);
    // console.log(y);
  
    const _1n = BigInt(1);
    let flag = BigInt(y) & _1n ? '03' : '02';
    // console.log(flag);
  
    const x = Buffer.from(publicKey.substring(0, 64), "hex");
    // console.log(pubKey.substring(0, 64));
    const finalX = Buffer.concat([Buffer.from([flag]), x]);
    const finalXArray = new Uint8Array(finalX);
    // console.log("Public Key: \n", finalXArray);
    const addrHash = blake2AsHex(finalXArray);
    return encodeAddress(addrHash);
}

module.exports = {
    stringToByteArray: stringToByteArray,
    toHexString: toHexString,
    expectThrow: expectThrow,
    evmMine: evmMine,
    getBlock: getBlock,
    toByteArray: toByteArray,
    sleep: sleep,
    toSubstrateAddress
}