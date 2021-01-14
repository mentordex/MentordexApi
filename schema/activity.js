'use strict';
var mongoose = require('mongoose');
var config = require('config');
var Schema = mongoose.Schema

var activitySchema = new mongoose.Schema({
    property_id: { 
        type: Schema.Types.ObjectId,
        ref: 'Property',
    },  
    action:{
        type: String, 
        trim:true
    }, 
    created_at: {
        type: Date,
        default: new Date()      
    }       

});



module.exports.Activity =  mongoose.model('Activity', activitySchema);