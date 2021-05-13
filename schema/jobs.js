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
        enum: ['NEW', 'ACCEPTED', 'CANCELLED', 'PENDING', 'ARCHIVED'],
        default: 'PENDING'
    },
    job_file: [{
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