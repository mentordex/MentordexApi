const _ = require('lodash'); 
const { PropertyType } = require('../schema/propertyType');
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
exports.add = async (req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { type } = req.body
    if (_.has(req.body, ['id']) && (req.body.id)!=null){ 
        //checking unique PropertyType
        let existingPropertyType = await PropertyType.findOne(
            {_id:mongoose.Types.ObjectId(req.body.id)},
            { _id: 1 }
        );
        
        if (!existingPropertyType) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));     

        //save PropertyType 
        PropertyType.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.id) }, { $set: req.body }, { new: true }, function (err, type) {
            
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));        
                
            return res.status(responseCode.CODES.SUCCESS.OK).send(type);        
            
        });
    }else{
        //checking unique PropertyType
        let existingType = await PropertyType.findOne(
            {type:type},
            { _id: 1 }
        );
        
        if (existingType) return res.status(400).send(req.polyglot.t('TYPE-ALREADY-EXIST'));     

        //save PropertyType 
        newType = new PropertyType(_.pick(req.body, ['type','count','created_at','modified_at']));
        
        newType.save(async function (err, type) {
            
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));        
                
            return res.status(responseCode.CODES.SUCCESS.OK).send(type);        
            
        });
    }
    
}



exports.listing = async (req, res) => {

    
    PropertyType.find({}, function(err, result) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR')); 

        return res.status(responseCode.CODES.SUCCESS.OK).send(result);  
    });
   
}

exports.deletePropertyType = async (req, res) => {

    let condition = {}
    condition['_id'] = mongoose.Types.ObjectId(req.body['id']);

    let record = await Property.findOne(condition, { _id: 1 } );
    
    if (record) return res.status(responseCode.CODES.SUCCESS.OK).send(false); 

    if (!record){
        PropertyType.deleteOne({ _id:mongoose.Types.ObjectId(req.body.id) }, function (err, doc) {
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
            return res.status(responseCode.CODES.SUCCESS.OK).send(true);
        });
    }  
   
}



