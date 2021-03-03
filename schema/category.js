'use strict';
var mongoose = require('mongoose');
var config = require('config');


var categorySchema = new mongoose.Schema({
    title: { type: String, trim:true },
    image: { type: String, trim:true },  
    image_object:{
        
    },
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



module.exports.Category =  mongoose.model('Category', categorySchema);