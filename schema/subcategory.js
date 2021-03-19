'use strict';
var mongoose = require('mongoose');
var config = require('config');
var Schema = mongoose.Schema

var subcategorySchema = new mongoose.Schema({
    title: { type: String, trim:true },
    category_id: { 
        type: Schema.Types.ObjectId,
        ref: 'Category',
    },
    image: { type: String, trim:true },
    image_object:{
        
    },
    count: {  
        type: Number, 
        default:0
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

module.exports.Subcategory =  mongoose.model('Subcategory', subcategorySchema);