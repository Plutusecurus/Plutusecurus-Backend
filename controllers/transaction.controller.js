const Transaction = require('../models/transaction.model')
const User = require('../models/user.model')
const getContract = require('../contracts/Contract')
const { BigNumber, ethers } = require('ethers')
const io = require('../utils/socket').getIO()
const CC = require('currency-converter-lt')


exports.transactETHtoETH = async (data) => {
    const { senderPublicAddress, senderPrivateKey, recipientPublicAddress, amount, remark } = data
    var transactionId

    try {
        const sender = await User.findOne({account:senderPublicAddress})
        const recipient = await User.findOne({account:recipientPublicAddress})

        if(!sender) {
            const error = new Error(`Sender with public address: ${senderPublicAddress} not found.`)
            error.statusCode = 404
            throw error
        }

        if(!recipient) {
            const error = new Error(`Recipient with public address: ${recipientPublicAddress} not found.`)
            error.statusCode = 404
            throw error
        }

        let currencyConverter = new CC({from:"ETH", to:"INR", amount:amount})
        const amountInINR = await currencyConverter.convert()

        const transaction = new Transaction({
            sender: sender._id,
            recipient: recipient._id,
            eth: amount,
            inr: amountInINR,
            remark: remark
        })

        const transactionResult = await transaction.save()
        io.emit(senderPublicAddress, { status: 'TransactionId-E2E', data: transactionResult._id.toString() })
        const contract = getContract(senderPrivateKey)

        transactionId = transactionResult._id
        const dateTime = transactionResult.createdAt.toString();

        const overrides = {
            value: ethers.utils.parseEther(amount.toString()),
        }

        const tx = await contract.transactionETHtoETH(recipientPublicAddress, transactionId.toString(), dateTime, overrides);
        const receipt = await tx.wait(); 

        io.emit(senderPublicAddress, { status: 'TransactionHash-E2E', data: receipt.transactionHash })

        sender.spending[remark] = sender.spending[remark] + amountInINR
        recipient.earning = recipient.earning + amountInINR
        const senderRes = await sender.save()
        const recipientRes = await recipient.save()

        io.emit(senderPublicAddress, { status: 'Success-E2E', data: `${senderRes._id.toString()} ${recipientRes._id.toString()}` })
    } catch(err) {
        console.log(err)
        await Transaction.deleteOne({_id: transactionId})
        io.emit(senderPublicAddress, { status: 'Failure-E2E', data: err.message })
        
    }
}

exports.transactINRtoETH = async(data) => {
    const { senderPublicAddress, senderPrivateKey, recipientPublicAddress, amountInETH, remark, paymentId } = data
    let transactionId

    try {
        const sender = await User.findOne({account:senderPublicAddress})
        const recipient = await User.findOne({account:recipientPublicAddress})

        if(!sender) {
            const error = new Error(`Sender with public address: ${senderPublicAddress} not found.`)
            error.statusCode = 404
            throw error
        }

        if(!recipient) {
            const error = new Error(`Recipient with public address: ${recipientPublicAddress} not found.`)
            error.statusCode = 404
            throw error
        }

        let currencyConverter = new CC({from:"ETH", to:"INR", amount:amountInETH})
        const amountInINR = await currencyConverter.convert()

        const transaction = new Transaction({
            sender: sender._id,
            recipient: recipient._id,
            eth: amountInETH,
            inr: amountInINR,
            remark: remark,
            razorpayPaymentId: paymentId
        })

        const transactionResult = await transaction.save()
        io.emit(senderPublicAddress, { status: 'TransactionId-I2E', data: transactionResult._id.toString() })
        const contract = getContract(senderPrivateKey)

        transactionId = transactionResult._id
        const dateTime = transactionResult.createdAt.toString();

        const tx = await contract.transferETH(recipientPublicAddress, amountInETH, transactionId.toString(), dateTime);
        const receipt = await tx.wait(); 

        io.emit(senderPublicAddress, { status: 'TransactionHash-I2E', data: receipt.transactionHash })

        sender.spending[remark] = sender.spending[remark] + amountInINR
        recipient.earning = recipient.earning + amountInINR
        const senderRes = await sender.save()
        const recipientRes = await recipient.save()

        io.emit(senderPublicAddress, { status: 'SuccessI2E', data: `${senderRes._id.toString()} ${recipientRes._id.toString()}` })
    } catch(err) {
        console.log(err)
        await Transaction.deleteOne({_id:transactionId})
        io.emit(senderPublicAddress, { status: 'FailureI2E', data: `${err.message}` })
    }
}