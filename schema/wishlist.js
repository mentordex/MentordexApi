'use strict';
var mongoose = require('mongoose');
var config = require('config');
var Schema = mongoose.Schema

var wishlistSchema = new mongoose.Schema({
    parent_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    mentor_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
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

module.exports.Wishlist = mongoose.model('Wishlist', wishlistSchema);