const assert = require('assert')
const ganache = require('ganache-cli')
const Web3 = require('web3')
const web3 = new Web3(ganache.provider({"total_accounts": 20}))

const elepigTokenSource = require('../build/eth/ElepigToken.solElepigToken.json')
let elepigToken

let accounts, elepig, message, sign, r, s, v, encodeFunctionCall
beforeEach(async () => {
    accounts = await web3.eth.getAccounts()
    const startTime = Math.round((new Date(Date.now() - 86400000).getTime())/1000); // Yesterday
    const endTime = Math.round((new Date().getTime() + (86400000 * 20))/1000); // Today + 20 days
    elepigToken = await new web3.eth.Contract(JSON.parse(elepigTokenSource.interface))
        .deploy({ 
            data: elepigTokenSource.bytecode
        })
        .send({ from: accounts[0], gas: '6000000'})
}) 

describe('Elepig Token', () => {
    it('Deploying elepigToken ok', async () => {
        assert.ok(await elepigToken.options.address)
    })

    it('Mint to accounts', async () => {
        let mint = await elepigToken.methods.mint(accounts[1], 1000).send({
            from: accounts[0],
            gas: '6000000'
        })
        assert.equal(await elepigToken.methods.balanceOf(accounts[1]).call(), 1000)
    })

    it('mintwallet', async () => {
        await elepigToken.methods.mintWallets(
            accounts[2], accounts[3], accounts[4], accounts[5], 
            accounts[6], accounts[7], accounts[8], accounts[9]
        ).send({
            from: accounts[0],
            gas: '600000'
        })
        assert.equal(await elepigToken.methods.balanceOf(accounts[2]).call(), 7500000000000000000000000)
        assert.equal(await elepigToken.methods.balanceOf(accounts[3]).call(), 52500000000000000000000000)
        assert.equal(await elepigToken.methods.balanceOf(accounts[4]).call(), 30000000000000000000000000)
        assert.equal(await elepigToken.methods.balanceOf(accounts[5]).call(), 12000000000000000000000000)
        assert.equal(await elepigToken.methods.balanceOf(accounts[6]).call(), 12000000000000000000000000)
        assert.equal(await elepigToken.methods.balanceOf(accounts[7]).call(), 12000000000000000000000000)
        assert.equal(await elepigToken.methods.balanceOf(accounts[8]).call(), 12000000000000000000000000)
        assert.equal(await elepigToken.methods.balanceOf(accounts[9]).call(), 12000000000000000000000000)
    })

    it('mintwalletOnlyOnce', async () => {
        try {
            await elepigToken.methods.mintWallets(
                accounts[2], accounts[3], accounts[4], accounts[5], 
                accounts[6], accounts[7], accounts[8], accounts[9]
            ).send({
                from: accounts[0],
                gas: '600000'
            })
            await elepigToken.methods.mintWallets(
                accounts[2], accounts[3], accounts[4], accounts[5], 
                accounts[6], accounts[7], accounts[8], accounts[9]
            ).send({
                from: accounts[0],
                gas: '600000'
            })
            assert.equal(await elepigToken.methods.balanceOf(accounts[2]).call(), 7500000000000000000000000)
            assert.equal(await elepigToken.methods.balanceOf(accounts[3]).call(), 52500000000000000000000000)
            assert.equal(await elepigToken.methods.balanceOf(accounts[4]).call(), 30000000000000000000000000)
            assert.equal(await elepigToken.methods.balanceOf(accounts[5]).call(), 12000000000000000000000000)
            assert.equal(await elepigToken.methods.balanceOf(accounts[6]).call(), 12000000000000000000000000)
            assert.equal(await elepigToken.methods.balanceOf(accounts[7]).call(), 12000000000000000000000000)
            assert.equal(await elepigToken.methods.balanceOf(accounts[8]).call(), 12000000000000000000000000)
            assert.equal(await elepigToken.methods.balanceOf(accounts[9]).call(), 12000000000000000000000000)
            throw new Error()
        } catch (err) {
        }
    })

    it('finish minting', async () => {
        try {
            let mint = await elepigToken.methods.mint(accounts[1], 1000).send({
                from: accounts[0],
                gas: '6000000'
            })
            await elepigToken.methods.finishMinting().send({
                from: accounts[0],
                gas: '600000'
            })
            let mint2 = await elepigToken.methods.mint(accounts[1], 1000).send({
                from: accounts[0],
                gas: '6000000'
            })
            throw new Error()
        } catch (err) {
        }
    })

    it('burn function', async () => {
        await elepigToken.methods.mint(accounts[1], 1000).send({
            from: accounts[0],
            gas: '6000000'
        })
        await elepigToken.methods.burn(500).send({
            from: accounts[1],
            gas: '60000'
        })
        assert.equal(await elepigToken.methods.balanceOf(accounts[1]).call(), 500)
    })

    it('change ownership', async () => {
        let firstOwner = await elepigToken.methods.owner().call()
        await elepigToken.methods.transferOwnership(accounts[3]).send({
            from: accounts[0],
            gas: '60000'
        })
        assert.equal(await elepigToken.methods.owner().call(), accounts[3])
    })

    it('transfer', async () => {
        await elepigToken.methods.mint(accounts[1], 1000).send({
            from: accounts[0],
            gas: '6000000'
        })
        await elepigToken.methods.transfer(accounts[2], 400).send({
            from: accounts[1],
            gas: '6000000'
        })
        assert.equal(await elepigToken.methods.balanceOf(accounts[1]).call(), 600)
        assert.equal(await elepigToken.methods.balanceOf(accounts[2]).call(), 400)
    })
})