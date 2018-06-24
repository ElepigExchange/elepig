// const HDWalletProvider = require('truffle-hdwallet-provider-privkey');
const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const compiledElepigToken = require('./build/eth/ElepigToken.solElepigToken.json');
const compiledElepigCrowdsale = require('./build/eth/ElepigCrowdsale.solElepigCrowdsale.json');

const provider = new HDWalletProvider(
  'argue tube choice loop fashion lumber stay hire height good hollow fresh',
// "c737fadb894c0688069088086f4ad9b2f9ba411457bab2fc12cdaf5f64b04ed2",
  'https://ropsten.infura.io/34imdYtkJj4c47eCAS0X'
);
const web3 = new Web3(provider);

const tokenGenerate = async (crowdsaleAddress, senderAddress) => {

    console.log(crowdsaleAddress)
    console.log(senderAddress)
    let accounts = await web3.eth.getAccounts()
    console.log(accounts)
    // let message = await web3.utils.sha3("test", {encoding: 'hex'})
    let message = await web3.utils.sha3(crowdsaleAddress + senderAddress.substr(2), {encoding: 'hex'})

    // Signing message (with "\x19Ethereum Signed Message:\n32" as prefix by default)
    // let sign = await web3.eth.sign(await web3.utils.sha3("\x1900Ethereum Signed Message:\n32" + message), accounts[0])
    let sign = await web3.eth.accounts.sign(message, '0xc737fadb894c0688069088086f4ad9b2f9ba411457bab2fc12cdaf5f64b04ed2')
    console.log("message:" + message)
    console.log("message:" + await web3.eth.accounts.recover(sign))

    let encodeFunctionCall = await web3.eth.abi.encodeFunctionCall({
        name: 'donate',
        type: 'function',
        inputs: [{
            type: 'uint8',
            name: '_v'
        },{
            type: 'bytes32',
            name: '_r'
        },{
            type: 'bytes32',
            name: '_s'
        }]
    }, [sign.v, sign.r, sign.s])
    console.log(encodeFunctionCall)
    console.log("v: " + sign.v)
    console.log("r: " + sign.r)
    console.log("s: " + sign.s)

    let elepigCrowdsale = await new web3.eth.Contract(JSON.parse(compiledElepigCrowdsale.interface), crowdsaleAddress)
    console.log( "owner: " + await elepigCrowdsale.methods.owner().call())
    console.log( "signer: " + await elepigCrowdsale.methods.signer().call())
    let test = await elepigCrowdsale.methods.isValidAccessMessage("0x8b6BB37BE455882116867D2ac1bBd476e13EF5de", sign.v, sign.r, sign.s).call()
    console.log(test)
};
tokenGenerate(process.argv[2], process.argv[3]);