'use strict';
var mongoose = require('mongoose');
var config = require('config');
var Schema = mongoose.Schema

var membershipSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['day', 'week', 'month', 'quarter', 'semiannual', 'year']
    },
    price: {
        type: Number,
        default: 0
    },
    price_id: {
        type: String,
        trim: true
    },
    product_id: {
        type: String,
        trim: true
    },
    is_active: {
        type: Boolean,
        enum: [true, false],
        default: true
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

module.exports.Membership = mongoose.model('Membership', membershipSchema);