const path = require('path');
const solc = require('solc');
const fs = require('fs-extra');

const buildPath = path.resolve(__dirname, 'build/eth');
fs.removeSync(buildPath);

const contractPath = path.resolve(__dirname, 'contracts', 'ElepigCrowdsale.sol')
const source = fs.readFileSync(contractPath, 'utf8');
const input = {
    'ElepigToken.sol': fs.readFileSync(path.resolve(__dirname, 'contracts', 'ElepigToken.sol'), 'utf8'),
    'ElepigCrowdsale.sol': fs.readFileSync(path.resolve(__dirname, 'contracts', 'ElepigCrowdsale.sol'), 'utf8')
}
const output = solc.compile({sources: input}, 1).contracts;
console.log(solc.compile({sources: input}, 1))

fs.ensureDirSync(buildPath)

for (let contract in output) {
    fs.outputJsonSync(
        path.resolve(buildPath, contract.replace(":", "") + '.json'),
        output[contract]
    )
}