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
    category_id: { 
        type: Schema.Types.ObjectId,
        ref: 'Faqcategory',
    },
    is_active:{
        type: String, 
        default:'No'
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