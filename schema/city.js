'use strict';
var mongoose = require('mongoose');
var config = require('config');
var Schema = mongoose.Schema

var citySchema = new mongoose.Schema({
    title: { type: String, trim:true },
    image: { type: String, trim:true },
    image_object:{ 
        
    },
    count: {  
        type: Number, 
        default:0
    },
    zipcodes:[],     
    country_id: { 
        type: Schema.Types.ObjectId,
        ref: 'Country',
    },
    state_id: { 
        type: Schema.Types.ObjectId,
        ref: 'State',
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



module.exports.City =  mongoose.model('City', citySchema);