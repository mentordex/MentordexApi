'use strict';
var mongoose = require('mongoose');
var config = require('config');


var bannerSchema = new mongoose.Schema({
    title: { 
        type: String, 
        trim:true 
    },
    description: { 
        type: String, 
        trim:true 
    },
    image:{ 
        type: String, 
        trim:true 
    },
    button_text:{ 
        type: String, 
        trim:true 
    }, 
    button_link:{ 
        type: String, 
        trim:true 
    }, 
    video_button_text:{ 
        type: String, 
        trim:true 
    },
    video_button_link:{ 
        type: String, 
        trim:true 
    }, 
    is_active:{
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



module.exports.Banner =  mongoose.model('Banner', bannerSchema);