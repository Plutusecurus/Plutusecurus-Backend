const mongoose = require('mongoose')
const Schema = mongoose.Schema

const transactionSchema = new mongoose.Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    eth: {
        type: Number,
        required: true
    },
    inr: {
        type: Number,
        required: true
    },
    remark: {
        type: String,
        default: ''
    },
    razorpayPaymentId: {
        type:String,
        default: ''
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Transaction', transactionSchema)