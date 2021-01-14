'use strict';
var mongoose = require('mongoose');
var config = require('config');
var Schema = mongoose.Schema

var propertySchema = new mongoose.Schema({
    //step1 
    title: { type: String, trim:true },
    description: { type: String, trim:true },
    type:{ 
        type: Schema.Types.ObjectId,
        ref: 'PropertyType',
    },
    status: { 
        type: String,
        enum : ['RENT','SALE'],
        default: 'RENT'
    },
    
    price: {  
        type: Number, 
        default:0
    },    
    area: {  
        type: Number, 
        default:0
    },
    rooms: { 
        type: Number, 
        default:0
    },
    is_featured:{
        type: String,
        enum : ['YES', 'NO'],
        default: 'NO'
    },

    //step2
    loc:{
        type:{
            type:String,
            default:'Point'
        },
        coordinates: { 
			type: [Number], 
			index: '2dsphere'
		}
    },
    zipcode:{ type: Number },
    address: { type: String, trim:true },
    lat: { type: Number },
    lng: { type: Number },
    city: { 
        type: Schema.Types.ObjectId,
        ref: 'City',
    },
    neighborhood: { 
        type: Schema.Types.ObjectId,
        ref: 'Neighbourhood',
    },

    //3rd step
    rooms:{ 
        type: Number, 
        default:0
    },
    bathrooms:{ 
        type: Number, 
        default:0
    },
    parking_spots:{ 
        type: Number, 
        default:0
    },
    property_status:{
        type: String,
        enum : ['NEW', 'USED','IN-CONSTRUCTION'],
        default: 'NEW'
    },
    lot_area:{ 
        type: Number, 
        default:0
    },
    floor_number:{ 
        type: Number, 
        default:0
    },
    land_area:{ 
        type: Number, 
        default:0
    },
    year_built:{ 
        type: Number, 
        default:0
    },
    aminities:[],

    propertyId:{ type: String, trim:true },
    area_size: { 
        type: Number, 
        default:0
    },
    size_prefix:{ type: String, trim:true },
    
    land_area_size_prefix:{ type: String, trim:true },
    bedrooms:{ 
        type: Number, 
        default:0
    },    
    garages:{ 
        type: Number, 
        default:0
    },
    garage_size:{ 
        type: Number, 
        default:0
    },    
    video_url:{ type: String, trim:true },
    virtual_tour:{ type: String, trim:true },
    
    
    //4th step
    images: [],
    videos: [],
    documents: [],
    save_as:{
        type: String,
        enum : ['PUBLISH', 'DRAFT','EXPIRED','IN-REVIEW','WAITING-PAYMENT'],
        default: 'IN-REVIEW'
    },
    //extra fields    
    user_id:{
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    currency: {  
        type: String,
        enum : ['$', '£'],
        default: '$'
    },
    language: {  
        type: String,
        enum : ['en', 'es'],
        default: 'en'
    },   
    page_view_count:  { 
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

//pre save hook on mongodb
propertySchema.pre('save', async function save(next) {    
    try {       
        this.price = this.price*100;  
        this.land_area = this.land_area*100;     
        return next();
    } catch (err) {
        return next(err);
    }
});




module.exports.Property =  mongoose.model('Property', propertySchema);