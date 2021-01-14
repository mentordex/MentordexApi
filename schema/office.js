

'use strict';
var mongoose = require('mongoose');
var config = require('config');
var Schema = mongoose.Schema

var officeSchema = new mongoose.Schema({     
    title:{
        type: String, 
        trim:true
    }, 
    address:{
        type: String, 
        trim:true
    },
    city:{
        type: String, 
        trim:true
    }, 
    state:{
        type: String, 
        trim:true
    },
    zipcode:{
        type: String, 
        trim:true
    }, 
    phone:{
        type: String, 
        trim:true
    },
    country:{
        type: String, 
        trim:true
    }, 
    image:{
        type: String, 
        trim:true
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

module.exports.Office =  mongoose.model('Office', officeSchema);