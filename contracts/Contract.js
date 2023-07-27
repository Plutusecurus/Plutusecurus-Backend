const { ethers, providers } = require('ethers');
const dotenv = require('dotenv')
dotenv.config()

module.exports = (privateKey) => {
    const provider = new ethers.providers.JsonRpcProvider(String(process.env.SEPOLIA_RPC_URL));
    const contractAbi = require('../contracts/EPIContractABI.json')

    const signer = new ethers.Wallet(privateKey, provider);
    const contractAddress = process.env.SEPOLIA_CONTRACT_ADDRESS;
    const contract = new ethers.Contract(contractAddress, contractAbi, signer);

    return contract
}