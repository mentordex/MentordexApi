const _ = require('lodash'); 
const { Amenity } = require('../schema/amenity');
const { Property } = require('../schema/property');
const { Faqcategory } = require('../schema/faqcategory');
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
    const { type, description, category } = req.body

    if (_.has(req.body, ['id']) && (req.body.id)){    
        //checking unique Amenity
        let existingType = await Amenity.findOne(
            {_id:mongoose.Types.ObjectId(req.body.id)},
            { _id: 1 }
        );
        
        if (!existingType) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));     

        //save Amenity 
        Amenity.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.id) }, { $set: req.body }, { new: true }, function (err, type) {
            
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));        
                
            return res.status(responseCode.CODES.SUCCESS.OK).send(type);        
            
        });
    }else{
        //checking unique Amenity
        let existingType = await Amenity.findOne(
            {type:type, category:category},
            { _id: 1 }
        );
        
        if (existingType) return res.status(400).send(req.polyglot.t('TYPE-ALREADY-EXIST'));     

        //save city 
        newType = new Amenity(_.pick(req.body, ['type','description','category_id','is_active','created_at','modified_at']));
        
        newType.save(async function (err, type) {
            
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));        
                
            return res.status(responseCode.CODES.SUCCESS.OK).send(type);        
            
        });
    }

    
}



exports.listing = async (req, res) => {

    const {category} = req.body
   
    Amenity.find({'category_id':mongoose.Types.ObjectId(category), 'is_active':'Yes'}, function(err, result) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR')); 

        return res.status(responseCode.CODES.SUCCESS.OK).send(result);  
    });
   
}
exports.categories = async (req, res) => {  
   
    Faqcategory.find({'is_active':'Yes'}, function(err, result) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR')); 

        return res.status(responseCode.CODES.SUCCESS.OK).send(result);  
    });
   
}

exports.top5listing = async (req, res) => {
    
    Amenity.find({'is_active':'Yes'}, function(err, result) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR')); 

        return res.status(responseCode.CODES.SUCCESS.OK).send(result);  
    }).sort({created_at: -1}).limit(5);  
   
}

exports.deleteAmenity = async (req, res) => {

    let condition = {}
    condition['aminities'] = { $in: req.body['id'] }  

    let amenity = await Property.findOne(condition, { _id: 1 } );
    
    if (amenity) return res.status(responseCode.CODES.SUCCESS.OK).send(false); 

    if (!amenity){
        Amenity.deleteOne({ _id:mongoose.Types.ObjectId(req.body.id) }, function (err, doc) {
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
            return res.status(responseCode.CODES.SUCCESS.OK).send(true);
        });
    }  
   
}



