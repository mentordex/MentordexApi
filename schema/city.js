'use strict';
var mongoose = require('mongoose');
var config = require('config');


var citySchema = new mongoose.Schema({
    title: { type: String, trim:true },
    image: { type: String, trim:true },
    count: {  
        type: Number, 
        default:0
    },  
    is_visible_on_home:{
        type: Boolean, 
        default:false
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



module.exports.City =  mongoose.model('City', citySchema);