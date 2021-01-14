'use strict';
var mongoose = require('mongoose');
var config = require('config');
var Schema = mongoose.Schema

var neighbourhoodSchema = new mongoose.Schema({
    title: { type: String, trim:true },
    city_id: { 
        type: Schema.Types.ObjectId,
        ref: 'City',
    },
    count: {  
        type: Number, 
        default:0
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

module.exports.Neighbourhood =  mongoose.model('Neighbourhood', neighbourhoodSchema);