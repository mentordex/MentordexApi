'use strict';
var mongoose = require('mongoose');
var config = require('config');


var categorySchema = new mongoose.Schema({
    title: { type: String, trim:true },  
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



module.exports.Faqcategory =  mongoose.model('Faqcategory', categorySchema);