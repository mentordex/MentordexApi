'use strict';
var mongoose = require('mongoose');
var config = require('config');
var Schema = mongoose.Schema

var countrySchema = new mongoose.Schema({
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
    created_at: {
        type: Date,
        default: new Date()
    },
    modified_at: {
        type: Date,
        default: new Date()      
    }         

});



module.exports.Country =  mongoose.model('Country', countrySchema);