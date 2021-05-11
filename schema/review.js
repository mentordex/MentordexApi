

'use strict';
var mongoose = require('mongoose');
var config = require('config');
var Schema = mongoose.Schema

var reviewSchema = new mongoose.Schema({     
    name:{
        type: String, 
        trim:true
    }, 
    city:{
        type: String, 
        trim:true
    },
    review:{
        type: String, 
        trim:true
    }, 
    rating:{
        type: Number, 
        default:0
    },    
    image:{
        type: String, 
        trim:true
    },
    image_object:{
        
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

module.exports.Review =  mongoose.model('Review', reviewSchema);