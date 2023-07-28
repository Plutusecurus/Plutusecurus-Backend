var mongoose = require('mongoose');
const Schema = mongoose.Schema

const userSchema = new mongoose.Schema({
    profilePic: {
        type: String,
        required: true,
    },
    account: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    upiID: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    walletAmount: {
        type: Number,
        default: 0
    },
    earning: {
        type: Number,
        default: 0
    },
    spending: {
        essentials: {
            type: Number,
            default: 0,
        },
        housing: {
            type: Number,
            default: 0
        },
        food: {
            type: Number,
            default: 0,
        },
        medical: {
            type: Number,
            default: 0,
        },
        transport: {
            type: Number,
            default: 0,
        },
        luxury: {
            type: Number,
            default: 0,
        },
        gifts: {
            type: Number,
            default: 0,
        },
        misc: {
            type: Number,
            default: 0,
        },
        total: {
            type: Number,
            virtual: true,
            get: function () {
                return this.spending.essentials + this.spending.housing + this.spending.food + this.spending.medical + this.spending.transport + this.spending.luxury + this.spending.gifts + this.spending.misc;
            },
        }
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;