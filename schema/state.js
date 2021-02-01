'use strict';
var mongoose = require('mongoose');
var config = require('config');
var Schema = mongoose.Schema

var stateSchema = new mongoose.Schema({
    title: { type: String, trim:true },   
    count: {  
        type: Number, 
        default:0
    },  
    is_active: {
        type: Boolean,
        enum : [true, false],
        default: true       
    },
    country_id: { 
        type: Schema.Types.ObjectId,
        ref: 'Country',
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



module.exports.State =  mongoose.model('State', stateSchema);