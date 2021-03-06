

'use strict';
var mongoose = require('mongoose');
var config = require('config');
var Schema = mongoose.Schema

var teamSchema = new mongoose.Schema({     
    name:{
        type: String, 
        trim:true
    }, 
    title:{
        type: String, 
        trim:true
    },
    description:{
        type: String, 
        trim:true
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

module.exports.Team =  mongoose.model('Team', teamSchema);