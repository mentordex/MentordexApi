'use strict';
var mongoose = require('mongoose');
var config = require('config');
var Schema = mongoose.Schema

var messageSchema = new mongoose.Schema({
    message: {
        type: String,
        trim: true
    },
    sender_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    receiver_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    job_id: {
        type: Schema.Types.ObjectId,
        ref: 'Jobs',
    },
    message_file: [{
        file_path: {
            type: String,
            trim: true
        },
        file_name: {
            type: String,
            trim: true
        },
        file_key: {
            type: String,
            trim: true
        },
        file_mimetype: {
            type: String,
            trim: true
        },
        file_category: {
            type: String,
            trim: true
        }
    }],
    is_read: {
        type: Boolean,
        enum: [true, false],
        default: false
    },
    created_at: {
        type: Date,
        default: new Date().toISOString()
    },
    modified_at: {
        type: Date,
        default: new Date().toISOString()
    }


});

module.exports.Messages = mongoose.model('Messages', messageSchema);