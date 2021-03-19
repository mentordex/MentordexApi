const _ = require('lodash'); 
const { Banner } = require('../schema/banner');
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
    const { title, description, image, button_text, button_link, video_button_text, video_button_link, is_active} = req.body

    if (_.has(req.body, ['id']) && (req.body.id)){    
        //checking unique Office
        let existingType = await Banner.findOne(
            {_id:mongoose.Types.ObjectId(req.body.id)},
            { _id: 1 }
        );
        
        if (!existingType) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));     

        //save Banner 
        Banner.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.id) }, { $set: req.body }, { new: true }, function (err, type) {
            
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));        
                
            return res.status(responseCode.CODES.SUCCESS.OK).send(type);        
            
        });
    }else{
            

        //save Banner 
        newBanner = new Banner(_.pick(req.body, ['title', 'description', 'image', 'image_object','button_text', 'button_link', 'video_button_text', 'video_button_link', 'is_active', 'created_at', 'modified_at']));
        
        newBanner.save(async function (err, banner) {
            
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));        
                
            return res.status(responseCode.CODES.SUCCESS.OK).send(banner);        
            
        });
    }

    
}



exports.listing = async (req, res) => {
    Banner.find({is_active:true}, function(err, result) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR')); 

        return res.status(responseCode.CODES.SUCCESS.OK).send(result);  
    });
   
}

exports.deleteBanner = async (req, res) => {

    Banner.deleteOne({ _id:mongoose.Types.ObjectId(req.body.id) }, function (err, doc) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
        return res.status(responseCode.CODES.SUCCESS.OK).send(true);
    }); 
   
}

exports.changeStatus = async (req, res) => {
    let existingRecord = await Banner.findOne(
        {_id:mongoose.Types.ObjectId(req.body.id)},
        { _id: 1 }
    );
    
    if (!existingRecord) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));     
    
    req.body['modified_at'] = new Date()
    //save city 
    Banner.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.id) }, { $set: {is_active:req.body.is_active} }, { new: true }, function (err, data) {
        
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));        
            
        return res.status(responseCode.CODES.SUCCESS.OK).send(data);        
        
    });
}



