'use strict';
var mongoose = require('mongoose');
var config = require('config');
var Schema = mongoose.Schema

var transactionSchema = new mongoose.Schema({
    transaction_type: {
        type: String,
        trim: true
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    user_type: {
        type: String,
        enum: ['PARENT', 'MENTOR'],
        default: 'MENTOR'
    },
    invoice_id: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        default: 0
    },
    payment_details: {
        stripe_card_id: {
            type: String,
            trim: true
        },
        credit_card_number: {
            type: Number,
            trim: true
        },
        card_holder_name: {
            type: String,
            trim: true

        },
        card_type: {
            type: String,
            trim: true
        },
        exp_month: {
            type: String,
            trim: true
        },
        exp_year: {
            type: String,
            trim: true
        }
    },
    created_at: {
        type: Date,
        default: new Date()
    },
    modified_at: {
        type: Date,
        default: new Date()
    }


});

module.exports.Transactions = mongoose.model('Transactions', transactionSchema);