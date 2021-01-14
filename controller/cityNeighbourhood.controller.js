const _ = require('lodash'); 
const config = require('config');
const sgMail = require('@sendgrid/mail');
const { City } = require('../schema/city');
const { Neighbourhood } = require('../schema/neighbourhood');
const { Property } = require('../schema/property');
const responseCode = require('../utilities/responseCode');
var mongoose = require('mongoose');



/*
* Here we would probably call the DB to confirm the user exists
* Then validate if they're authorized to login
* Create a JWT or a cookie
* Send an email to that address with the URL to login directly to change their password
* And finally let the user know their email is waiting for them at their inbox
*/
exports.addCity = async (req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { title } = req.body

    if (_.has(req.body, ['id']) && (req.body.id)!=null){   
         //checking unique city
         let existingCity = await City.findOne(
            {_id:mongoose.Types.ObjectId(req.body.id)},
            { _id: 1 }
        );
        
        if (!existingCity) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));     

        //save city 
        City.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.id) }, { $set: req.body }, { new: true }, function (err, type) {
            
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));        
                
            return res.status(responseCode.CODES.SUCCESS.OK).send(type);        
            
        });
    }else{
        //checking unique city
        let existingCity = await City.findOne(
            {title:title},
            { _id: 1 }
        );
        
        if (existingCity) return res.status(400).send(req.polyglot.t('CITY-ALREADY-EXIST'));     

        //save city 
        newCity = new City(_.pick(req.body, ['title','image', 'count','created_at','modified_at']));
        
        newCity.save(async function (err, city) {
            
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));        
                
            return res.status(responseCode.CODES.SUCCESS.OK).send(city);        
            
        });
    }
    
}

exports.addNeighbourhood = async (req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { title, city_id } = req.body

    if (_.has(req.body, ['id']) && (req.body.id)!=null){ 
        //checking unique Neighbourhood
        let existingNeighbourhood = await Neighbourhood.findOne(
            {_id:mongoose.Types.ObjectId(req.body.id)},
            { _id: 1 }
        );
        
        if (!existingNeighbourhood) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));     

        //save Neighbourhood 
        Neighbourhood.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.id) }, { $set: req.body }, { new: true }, function (err, type) {
            
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));        
                
            return res.status(responseCode.CODES.SUCCESS.OK).send(type);        
            
        });
    }else{
        //save Neighbourhood 
        newNeighbourhood = new Neighbourhood(_.pick(req.body, ['title','city_id', 'count','created_at','modified_at']));
        
        newNeighbourhood.save(async function (err, neighbourhood) {
            
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));   
                        
            return res.status(responseCode.CODES.SUCCESS.OK).send(neighbourhood);        
            
        });
    }
    
}

exports.cityListing = async (req, res) => {

    
    let records = await City.aggregate([   
        

        {
            $lookup: {
                from: "neighbourhoods",
                localField: "city_id",
                foreignField: "_id",
                as: "neighbourhood"
            }
        },       
        {
            $project: {
                title: 1,    
                count: 1,    
                image:1,          
                "neighbourhood.title": 1,
                "neighbourhood._id": 1,
                "neighbourhood._id": 1,

            }
        }        
    ]) 
    return res.status(responseCode.CODES.SUCCESS.OK).send(records);    
}


exports.neighbourhoodListing = async (req, res) => {
   
    Neighbourhood.find({city_id:req.body.city_id}, function(err, result) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR')); 

        return res.status(responseCode.CODES.SUCCESS.OK).send(result);  
    });         
       
}

exports.allNeighbourhoods = async (req, res) => {
   
    Neighbourhood.find({}, function(err, result) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR')); 

        return res.status(responseCode.CODES.SUCCESS.OK).send(result);  
    });         
       
}
exports.deleteCity = async (req, res) => {

    let condition = {}
    condition['city'] = mongoose.Types.ObjectId(req.body['id']);

    let record = await Property.findOne(condition, { _id: 1 } );
    
    if (record) return res.status(responseCode.CODES.SUCCESS.OK).send(false); 

    if (!record){
        City.deleteOne({ _id:mongoose.Types.ObjectId(req.body.id) }, function (err, doc) {
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
            return res.status(responseCode.CODES.SUCCESS.OK).send(true);
        });
    }  
   
}

exports.deleteNeighborhood = async (req, res) => {

    let condition = {}
    condition['neighborhood'] = mongoose.Types.ObjectId(req.body['id']);

    let record = await Property.findOne(condition, { _id: 1 } );
    
    if (record) return res.status(responseCode.CODES.SUCCESS.OK).send(false); 

    if (!record){
        Neighbourhood.deleteOne({ _id:mongoose.Types.ObjectId(req.body.id) }, function (err, doc) {
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
            return res.status(responseCode.CODES.SUCCESS.OK).send(true);
        });
    }  
   
}



