'use strict';
var mongoose = require('mongoose');
var config = require('config');
var Schema = mongoose.Schema

var pageviewSchema = new mongoose.Schema({
    property_id: { 
        type: Schema.Types.ObjectId,
        ref: 'Property',
    },    
    ip: {
        type: String, 
        trim:true
    },
    created_at: {
        type: Date,
        default: new Date()      
    }       

});



module.exports.Pageview =  mongoose.model('Pageview', pageviewSchema);