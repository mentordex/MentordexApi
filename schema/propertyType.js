'use strict';
var mongoose = require('mongoose');
var config = require('config');
var Schema = mongoose.Schema

var propertyTypeSchema = new mongoose.Schema({     
    type:{
        type: String, 
        trim:true
    }, 
    count: {  
        type: Number, 
        default:0
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

module.exports.PropertyType =  mongoose.model('PropertyType', propertyTypeSchema);