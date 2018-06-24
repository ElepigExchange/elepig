const assert = require('assert')
const ganache = require('ganache-cli')
const Web3 = require('web3')
const web3 = new Web3(ganache.provider({"total_accounts": 20}))

const elepigCrowdsale = require('../build/eth/ElepigCrowdsale.solElepigCrowdsale.json')
const elepigTokenSource = require('../build/eth/ElepigToken.solElepigToken.json')
const softcap = web3.utils.toWei('50', 'ether')
const hardcap = web3.utils.toWei('8050', 'ether')
let startTime
let endTime

const totalTokensForSale = 150000000000000000000000000;  // 150 EPGs will be sold in Crowdsale (50% of total tokens for community) 
const totalTokensForSaleDuringPreICO = 30000000000000000000000000; // 30MM out of 150MM EPGs will be sold during Pre ICO
const totalTokensForSaleDuringICO1 = 37500000000000000000000000;   // 37.5MM out of 150MM EPGs will be sold during Bonus Round 1
const totalTokensForSaleDuringICO2 = 37500000000000000000000000;   // 37.5MM out of 150MM EPGs will be sold during Bonus Round 2
const totalTokensForSaleDuringICO3 = 30000000000000000000000000;   // 30MM out of 150MM EPGs will be sold during Bonus Round 3
const totalTokensForSaleDuringICO4 = 15000000000000000000000000;   // 15MM out of 150MM EPGs will be sold during Bonus Round 4
  
const preICOrate = 2380; // 1 EPG = 0.00042 ETH
const iCO1rate = 2040; // 1 EPG = 0.00049 ETH
const iCO2rate = 1785; // 1 EPG = 0.00056 ETH
const iCO3rate = 1587; // 1 EPG = 0.00063 ETH
const iCO4rate = 1503; // 1 EPG = 0.000665 ETH

let elepigToken , elepig, message, sign, r, s, v, encodeFunctionCall
let ownerAddr, signerAddr, communityAddr, contributorAddr, walletAddr

const expectThrow = async (promise) => {
    try {
        await promise;
    } catch (error) {
        const invalidOpcode = error.message.search('invalid opcode') >= 0;
        const outOfGas = error.message.search('out of gas') >= 0;
        const revert = error.message.search('revert') >= 0;
        assert(
            invalidOpcode || outOfGas || revert,
            'Expected throw, got \'' + error + '\' instead',
        );
        return;
    }
    assert.fail('Expected throw not received');
};

beforeEach(async () => {
    accounts = await web3.eth.getAccounts()
    ownerAddr = accounts[0]
    signerAddr = accounts[12]
    communityAddr = accounts[11]
    contributorAddr = accounts[1]
    walletAddr = accounts[10]
    startTime = Math.round((new Date(Date.now() - 86400000).getTime())/1000); // Yesterday
    endTime = Math.round((new Date().getTime() + (86400000 * 20))/1000); // Today + 20 days
    elepigToken = await new web3.eth.Contract(JSON.parse(elepigTokenSource.interface))
        .deploy({ 
            data: elepigTokenSource.bytecode
        })
        .send({ from: ownerAddr, gas: '6000000'})
    elepig = await new web3.eth.Contract(JSON.parse(elepigCrowdsale.interface))
        .deploy({ 
            data: elepigCrowdsale.bytecode, 
            arguments: [
                startTime, 
                endTime, 
                preICOrate, // rate
                walletAddr, // wallet
                softcap, // goal soft cap
                hardcap, // hard cap
                communityAddr, // community address
                elepigToken.options.address, // token
                signerAddr // signer
            ]
        })
        .send({ from: ownerAddr, gas: '6000000'})
    
    message = await web3.utils.sha3(elepig.options.address + contributorAddr.substr(2), {encoding: 'hex'})

    // Signing message (with "\x19Ethereum Signed Message:\n32" as prefix by default)
    sign = await web3.eth.sign(message, signerAddr)

    //Extracting ECDSA variables
    r = sign.substr(0,66)
    s = "0x" + sign.substr(66,64)
    v = parseInt(sign.substr(130,2)) + 27

    encodeFunctionCall = await web3.eth.abi.encodeFunctionCall({
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
    }, [v, r, s])
    await elepigToken.methods.transferOwnership(elepig.options.address).send({
        from: ownerAddr, gas: '600000'
    })
})

describe('Elepig Token', () => {
    it('Check is valid access', async () => {
        let isValid = await elepig.methods.isValidAccessMessage(contributorAddr, v, r, s).call()
        assert(isValid)
    })

    it('Send eth to contract should fail without data', async () => {
        await expectThrow(web3.eth.sendTransaction({
            from: contributorAddr,
            to: elepig.options.address,
            value: web3.utils.toWei('1','ether'),
            gas: '600000'
        }))
    })

    it('Send eth to contract should pass with data', async () => {
        await web3.eth.sendTransaction({
            from: contributorAddr,
            to: elepig.options.address,
            value: web3.utils.toWei('1','ether'),
            gas: '600000',
            data: encodeFunctionCall 
        })
        assert.equal(
            web3.utils.fromWei(
                await elepigToken.methods.balanceOf(contributorAddr).call(), 'ether'
            ), preICOrate
        )
    })

    it('cant send less than .15 eth', async () => {
        await expectThrow(web3.eth.sendTransaction({
            from: contributorAddr,
            to: elepig.options.address,
            value: web3.utils.toWei('0.1','ether'),
            gas: '600000',
            data: encodeFunctionCall 
        }))
    })

    it('Black list cant send eth to crowdsale even with data', async () => {
        await elepig.methods.addBlacklistAddress(contributorAddr).send({
            from: ownerAddr,
            gas: '60000'
        })
        await expectThrow(web3.eth.sendTransaction({
            from: contributorAddr,
            to: elepig.options.address,
            value: web3.utils.toWei('1','ether'),
            gas: '600000',
            data: encodeFunctionCall 
        }))
    })

    it('Under softcap dont send money to wallet', async () => {
        let walletBalance = await web3.eth.getBalance(walletAddr)
        await web3.eth.sendTransaction({
            from: contributorAddr,
            to: elepig.options.address,
            value: web3.utils.toWei('25','ether'),
            gas: '600000',
            data: encodeFunctionCall 
        })
        assert.equal(walletBalance, await web3.eth.getBalance(walletAddr), 'Should not send eth to wallet if under softcap')
        await expectThrow(elepig.methods.releaseVault().send({
            from: ownerAddr,
            gas: '60000'
        }))
    }) 

    it('Over softcap send eth to beneficial account', async () => {
        let walletBalance = await web3.eth.getBalance(walletAddr)
        await web3.eth.sendTransaction({
            from: contributorAddr,
            to: elepig.options.address,
            value: web3.utils.toWei('48','ether'),
            gas: '600000',
            data: encodeFunctionCall 
        })
        await web3.eth.sendTransaction({
            from: contributorAddr,
            to: elepig.options.address,
            value: web3.utils.toWei('4','ether'),
            gas: '600000',
            data: encodeFunctionCall 
        })
        assert(await web3.eth.getBalance(walletAddr) < parseInt(walletBalance) + parseInt(softcap))

        await elepig.methods.releaseVault().send({
            from: ownerAddr,
            gas: '60000'
        })
        assert(await web3.eth.getBalance(walletAddr) > parseInt(walletBalance) + parseInt(softcap))
    }) 

    it('Under softcap after ICO, refund', async () => {
        let contributorBalance = parseInt(await web3.eth.getBalance(contributorAddr))
        await web3.eth.sendTransaction({
            from: contributorAddr,
            to: elepig.options.address,
            value: web3.utils.toWei('21','ether'),
            gas: '600000',
            data: encodeFunctionCall 
        })
        await elepig.methods.forwardEndTime(startTime).send({
            from: ownerAddr,
            gas: '600000'
        })
        await elepig.methods.finalize().send({
            from: ownerAddr,
            gas: '600000'
        })
        await elepig.methods.claimRefund().send({
            from: contributorAddr,
            gas: '600000'
        })
        let gasCost = parseInt(await web3.utils.toWei("0.005", "ether"))
        assert(await web3.eth.getBalance(contributorAddr) > contributorBalance - gasCost, "Should refund to contributor after ico if soft cap not reached")
    }) 

    it('Test rate for each round', async () => {
        await elepig.methods.setCrowdsaleStage(0).send({ from: ownerAddr, gas: '600000' })
        await sendEthToCrowdsale(contributorAddr, encodeFunctionCall, "1", elepig.options.address)
        assert.equal(await elepig.methods.rate().call(), preICOrate, "Rate for the preICO is wrong")

        await elepig.methods.setCrowdsaleStage(1).send({ from: ownerAddr, gas: '600000' })
        assert.equal(await elepig.methods.rate().call(), iCO1rate, "rate for ico1 is wrong")

        await elepig.methods.setCrowdsaleStage(2).send({ from: ownerAddr, gas: '600000' })
        assert.equal(await elepig.methods.rate().call(), iCO2rate, "rate for ico 2 is wrong")

        await elepig.methods.setCrowdsaleStage(3).send({ from: ownerAddr, gas: '600000' })
        assert.equal(await elepig.methods.rate().call(), iCO3rate, "Rate for ico 3 is wrong")

        await elepig.methods.setCrowdsaleStage(4).send({ from: ownerAddr, gas: '600000' })
        assert.equal(await elepig.methods.rate().call(), iCO4rate, "Rate for ico 3 is wrong")
    })

    it('change signer', async () => {
        await elepig.methods.transferSigner(accounts[5]).send({from: ownerAddr, gas: "600000"})
        assert.equal(await elepig.methods.signer().call(), accounts[5], "The signer address should change")
    })
    it('change owner back to token', async () => {
        await elepig.methods.transferTokenOwnership(ownerAddr).send({from: ownerAddr, gas: "600000"})
        assert.equal(await elepigToken.methods.owner().call(), ownerAddr)
    })
})

function sendEthToCrowdsale(contributorAddress, dataField, ethAmount, contractAddress) {
    return web3.eth.sendTransaction({
        from: contributorAddress,
        to: contractAddress,
        value: web3.utils.toWei(ethAmount,'ether'),
        gas: '600000',
        data: dataField
    })
}