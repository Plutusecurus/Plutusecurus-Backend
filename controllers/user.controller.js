const { uploadFile } = require('../utils/s3.util')
const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/user.model');
const Transaction = require('../models/transaction.model')
const CC = require('currency-converter-lt')
const Razorpay = require('razorpay')

exports.registerUser = async (req, res) => {
    try {
        const errors = validationResult(req)
        if(!errors.isEmpty()) {
            const error = new Error('Validation Failed.')
            error.statusCode = 422
            error.data = errors.array()
            throw error
        }

        if (!req.file) res.status(400).json({ success: false, message: "Please upload your profile picture" });

        const imageFile = req.file
        const imageUploadResult = await uploadFile(imageFile)
        if(!imageUploadResult) {
            const error = new Error('Failed to upload image to S3 bucket.')
            error.statusCode = 500
            throw error
        }

        const imageUrl = imageUploadResult.Location
        
        const { name, account, upiID, password } = req.body;

        const existingUser = await User.findOne({ account: account });

        if (existingUser) return res.status(400).json({ message: "User is already registered. Log-in to continue." });

        const hashedPassword = await bcrypt.hash(password, 12)

        const newUser = await User.create({
            profilePic: imageUrl,
            name: name,
            account: account,
            upiID: upiID,
            password: hashedPassword
        })

        await newUser.save();

        return res.status(201).json({ success: true, user: newUser, message: "User created successfully" });
    } catch(err) {
        console.log(err)
        if(!err.statusCode) {
            err.statusCode = 500
        }

        if(err.data) return res.status(err.statusCode).json({message: err.message, data: err.data})
        else return res.status(err.statusCode).json({message: err.message})
    }
}

exports.loginUser = async (req, res) => {
    try {
        const errors = validationResult(req)
        if(!errors.isEmpty()) {
            const error = new Error('Validation Failed.')
            error.statusCode = 422
            error.data = errors.array()
            throw error
        }

        const { account, password } = req.body

        const existingUser = await User.findOne({account: account})

        if(!existingUser) return res.status(404).json({message: "User is not registered. Kindly register first."})

        const passwordCheck = await bcrypt.compare(password, existingUser.password)

        if(!passwordCheck) return res.status(401).json({message: "Wrong password!"})

        const token = jwt.sign({
            userId: existingUser._id.toString(),
            address: existingUser.address
        }, process.env.JWT_SECRET, { expiresIn: '30d' })

        return res.status(201).json({
            name: existingUser.name,
            address: existingUser.address,
            token: token
        })
    } catch(err) {
        console.log(err)
        if(!err.statusCode) {
            err.statusCode = 500
        }

        if(err.data) return res.status(err.statusCode).json({message: err.message, data: err.data})
        else return res.status(err.statusCode).json({message: err.message})
    }
}

exports.addExpense = async (req, res) => {
    try {
        const { address, category, amount } = req.body;

        const existingUser = await User.findOne({ account: address });

        if (!existingUser) return res.status(404).json({ success: false, message: "User not found" });

        existingUser.spending[category] = parseFloat(existingUser.spending[category]) + parseFloat(amount);

        await existingUser.save();

        return res.status(200).json({ success: true, message: "Expense added successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

exports.addIncome = async (req, res) => {
    try {
        const { address, amount } = req.body;

        const existingUser = await User.findOne({ account: address });

        if (!existingUser) return res.status(404).json({ success: false, message: "User not found" });

        existingUser.earning = parseFloat(existingUser.earning) + parseFloat(amount);

        await existingUser.save();

        return res.status(200).json({ success: true, message: "Income added successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

exports.getUserById = async (req, res) => {
    const address = req.params.address;

    const user = await User.findOne({ "account": address });

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    return res.status(200).json({ success: true, user: user, message: "Data fetched successfully" });
}

exports.getAllTransactions = async (req, res) => {
    const { account } = req.body;

    try {
        const transactions = await Transaction.find({
            $or: [
                {sender: account},
                {recipient: account}
            ]
        })
        .populate('sender', 'name account')
        .populate('recipient', 'name account')
        .select('sender recipient eth inr remark createdAt')
    
        if(transactions) {
            return res.status(200).json({ message: "Transactions fetched successfully!", transactions: transactions })
        } else {
            return res.status(404).json({ message: "Transactions not found!" })
        }
    } catch(err) {
        return res.status(500).json({ message: err.message });
    }
}

const createPaymentOrder = async (amount, currency) => {
    if(!amount || !currency) {
        const error = new Error()
        error.statusCode = 400
        error.message = 'Both amount and currency are required!'
        throw error
    }

    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    var instance = new Razorpay({ key_id: keyId, key_secret: keySecret })

    const result = await instance.orders.create({
        amount: amount,
        currency: currency,
        receipt: `receipt#${new Date().getTime()}`,
        // notes: {
        //     key1: "",
        //     key2: ""
        // }
    })

    if(result) return result

    return null
}

exports.createETHtoINROrder = async (req, res) => {
    const {amount, currency} = req.body

    try {
        let currencyConverter = new CC({from:"ETH", to:"INR", amount:amount})
        const amountInINR = await currencyConverter.convert()

        const ethToINROrder = await createPaymentOrder(amountInINR, currency)

        if(ethToINROrder) return res.status(200).json({ethToINROrder})

        return res.status(500).json({ success: false, message: "ETH-to-INR Order could not be created!" })
    } catch(err) {
        console.log(err)
        return res.status(500).json({ success:false, message:err.message })
    }
}

exports.convertINRtoETH = async (req, res) => {
    const amount = req.body.amount

    try {
        let currencyConverter = new CC({from:"INR", to:"ETH", amount:amount})
        const amountInETH = await currencyConverter.convert()

        return res.status(200).json({ success: true, amount: amountInETH })

    } catch(err) {
        console.log(err)
        return res.status(500).json({ success:false, message:err.message })
    }
}