'use strict';
var mongoose = require('mongoose');
var config = require('config');
var Schema = mongoose.Schema

var aboutSchema = new mongoose.Schema({
    page_name:{
        type: String, 
        trim:true 
    },
    title_1: { type: String, trim: true },
    title_2: { type: String, trim: true },
    title_3: { type: String, trim: true },
    title_4: { type: String,trim: true },
    small_description_1: { type: String,trim: true },
    description_1: { type: String,trim: true },
    description_2: { type: String,trim: true },
    description_3: { type: String,trim: true },
    description_4: { type: String,trim: true },
    image_1: { type: String,trim: true },
    image_2: { type: String,trim: true },
    image_3: { type: String,trim: true },
    image_4: { type: String,trim: true },
    image_object_1: { },
    image_object_2: { },
    image_object_3: { },
    image_object_4: { },
    created_at: {
        type: Date,
        default: new Date()
    },
    modified_at: {
        type: Date,
        default: new Date()
    }


});

module.exports.About = mongoose.model('About', aboutSchema);