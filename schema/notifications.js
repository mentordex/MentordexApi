'use strict';
var mongoose = require('mongoose');
var config = require('config');
var Schema = mongoose.Schema

var notificationSchema = new mongoose.Schema({
    notification_type: {
        type: String,
        enum: ['BOOKING', 'MESSAGE', 'PAYMENT', 'PAYMENT'],
        default: 'BOOKING'
    },
    notification: {
        type: String,
        trim: true
    },
    job_id: {
        type: Schema.Types.ObjectId,
        ref: 'Jobs',
    },
    message_id: {
        type: Schema.Types.ObjectId,
        ref: 'Messages',
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
    is_read: {
        type: Boolean,
        enum: [true, false],
        default: false
    },
    is_archived: {
        type: Boolean,
        enum: [true, false],
        default: false
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

module.exports.Notifications = mongoose.model('Notifications', notificationSchema);