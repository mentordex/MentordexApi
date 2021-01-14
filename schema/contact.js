'use strict';
var mongoose = require('mongoose');
var config = require('config');
var Schema = mongoose.Schema

var contactSchema = new mongoose.Schema({
    user_id: { 
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    name: {  
        type: String, 
        trim:true
    },   
    email: {  
        type: String, 
        trim:true
    }, 
    phone: {  
        type: String, 
        trim:true
    }, 
    message: {  
        type: String, 
        trim:true
    },  
    created_at: {
        type: Date,
        default: new Date()
    }       

});

module.exports.Contact =  mongoose.model('Contact', contactSchema);