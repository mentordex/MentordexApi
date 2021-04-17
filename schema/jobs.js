'use strict';
var mongoose = require('mongoose');
var config = require('config');
var Schema = mongoose.Schema

var jobSchema = new mongoose.Schema({
    job_title: {
        type: String,
        trim: true
    },
    job_description: {
        type: String,
        trim: true
    },
    category_id: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
    },
    subcategory_id: {
        type: Schema.Types.ObjectId,
        ref: 'Subcategory',
    },
    parent_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    mentor_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    booking_time: {
        type: String,
    },
    hourly_rate: {
        type: String,
    },
    booking_date: {
        type: String,
    },
    job_status: {
        type: String,
        enum: ['NEW', 'APPROVED', 'REJECTED', 'PENDING'],
        default: 'PENDING'
    },
    job_active: {
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

module.exports.Jobs = mongoose.model('Jobs', jobSchema);