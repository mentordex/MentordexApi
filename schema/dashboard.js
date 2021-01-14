'use strict';
var mongoose = require('mongoose');
var config = require('config');
var Schema = mongoose.Schema

var dashboardSchema = new mongoose.Schema({
   
    user_id: { 
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    property_count: {  
        type: Number, 
        default:0
    },   
    property_view_count: {  
        type: Number, 
        default:0
    },
    contact_request_count:{
        type: Number, 
        default:0
    }, 
    neighborhoods_count:{
        type: Number, 
        default:0
    }, 
    created_at: {
        type: Date,
        default: new Date()
    }        

});

module.exports.Dashboard =  mongoose.model('Dashboard', dashboardSchema);