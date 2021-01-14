'use strict';
var mongoose = require('mongoose');
var config = require('config');
var Schema = mongoose.Schema

var faqSchema = new mongoose.Schema({     
    type:{
        type: String, 
        trim:true
    }, 
    description:{
        type: String, 
        trim:true
    },
    category: { 
        type: String,
        enum : ['GENERAL','PARENTS','MENTORS'],
        default: 'GENERAL'
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

module.exports.Amenity =  mongoose.model('Faq', faqSchema);