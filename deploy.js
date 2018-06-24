const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const compiledElepigToken = require('./build/eth/ElepigToken.solElepigToken.json');
const compiledElepigCrowdsale = require('./build/eth/ElepigCrowdsale.solElepigCrowdsale.json');

const provider = new HDWalletProvider(
  'argue tube choice loop fashion lumber stay hire height good hollow fresh',
  'https://ropsten.infura.io/34imdYtkJj4c47eCAS0X'
);

// token: 0xF0A8d7c702A711D01fBfe516f29b9a6e2D25b355
// crowdsale: 0x8696A7F83a324DaE1fbd532dE2a7CC52165Ce166
const web3 = new Web3(provider);

const deploy = async () => {
    const accounts = await web3.eth.getAccounts();

    console.log('Attempting to deploy from account', accounts[0]);

    const startTime = Math.round((new Date(Date.now() - 86400000).getTime())/1000); // Yesterday 1527779421
    const endTime = Math.round((new Date().getTime() + (86400000 * 20))/1000); // Today + 20 days 1529593832
    let elepigToken = await new web3.eth.Contract(JSON.parse(compiledElepigToken.interface))
        .deploy({ 
            data: compiledElepigToken.bytecode
        })
        .send({ from: accounts[0], gas: '6000000'})

    console.log('Elepig Contract deployed to', elepigToken.options.address);

    let elepig = await new web3.eth.Contract(JSON.parse(compiledElepigCrowdsale.interface))
        .deploy({ 
            data: compiledElepigCrowdsale.bytecode, 
            arguments: [
                startTime, 
                endTime, 
                5, // rate
                '0x8b6BB37BE455882116867D2ac1bBd476e13EF5de', // wallet
                2000000000000000000, // goal
                500000000000000000000,  // cap
                '0x8F1ea79e5ee31dB228a081092dDee3A6a68D8E5D', // communityAddress
                elepigToken.options.address, // token
                accounts[0] // signer                
            ]
        })
        .send({ from: accounts[0], gas: '6000000'})
    console.log('Elepig crowdsale contract deploy to', elepig.options.address)

    console.log('transfer owner ship to the crowdsale contract')
    await elepigToken.methods.transferOwnership(elepig.options.address).send({
        from: accounts[0], gas: '600000'
    })
    console.log('done')
};
deploy();