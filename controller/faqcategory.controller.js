const _ = require('lodash'); 
const config = require('config');
const { Faqcategory } = require('../schema/faqcategory');
const { Amenity } = require('../schema/amenity');
const responseCode = require('../utilities/responseCode');
var mongoose = require('mongoose');



/*
* Here we would probably call the DB to confirm the user exists
* Then validate if they're authorized to login
* Create a JWT or a cookie
* Send an email to that address with the URL to login directly to change their password
* And finally let the user know their email is waiting for them at their inbox
*/
exports.addCategory = async (req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { title } = req.body

    if (_.has(req.body, ['id']) && (req.body.id)!=null){   
         //checking unique city
         let existingCategory = await Faqcategory.findOne(
            {_id:mongoose.Types.ObjectId(req.body.id)},
            { _id: 1 }
        );
        
        if (!existingCategory) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));     

        //save city 
        Faqcategory.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.id) }, { $set: req.body }, { new: true }, function (err, type) {
            
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));        
                
            return res.status(responseCode.CODES.SUCCESS.OK).send(type);        
            
        });
    }else{
        //checking unique city
        let existingCategory = await Faqcategory.findOne(
            {title:title},
            { _id: 1 }
        );
        
        if (existingCategory) return res.status(400).send(req.polyglot.t('CATEGORY-ALREADY-EXIST'));     

        
            
        newCategory = new Faqcategory(_.pick(req.body, ['title','is_active','created_at','modified_at']));
       
        newCategory.save(async function (err, category) {
            
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));        
                
            return res.status(responseCode.CODES.SUCCESS.OK).send(category);        
            
        });

          

        
    }
    
}

exports.categoryListing = async (req, res) => {

    
    Faqcategory.find({}, function(err, result) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR')); 

        return res.status(responseCode.CODES.SUCCESS.OK).send(result);  
    }).sort({created_at: -1}).limit(8);  
      
}





exports.deleteCategory = async (req, res) => {

    let condition = {}
    condition['_id'] = mongoose.Types.ObjectId(req.body['id']);

    let record = await Faqcategory.findOne(condition, { _id: 1 } );
    
    if (!record) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));  

    
    Faqcategory.deleteOne({ _id:mongoose.Types.ObjectId(req.body.id) }, function (err, doc) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
        Amenity.deleteMany({ category_id:mongoose.Types.ObjectId(req.body.id) }, function (err, doc) {
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
            return res.status(responseCode.CODES.SUCCESS.OK).send(true);
        });
    });

    
     
   
}



