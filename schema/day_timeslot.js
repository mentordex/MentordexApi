'use strict';
var mongoose = require('mongoose');
var config = require('config');
var Schema = mongoose.Schema

var dayTimeslotSchema = new mongoose.Schema({
    day: {
        type: String,
        trim: true
    },
    slots: [{
        slot: {
            type: String,
            trim: true
        },
        isChecked: {
            type: Boolean,
            enum: [true, false],
            default: true
        }
    }],
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



module.exports.DayTimeslot = mongoose.model('DayTimeslot', dayTimeslotSchema);