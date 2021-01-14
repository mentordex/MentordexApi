const _ = require('lodash'); 
const { Office } = require('../schema/office');
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
    const { title, image, address, country, state, city, phone, zipcode } = req.body

    if (_.has(req.body, ['id']) && (req.body.id)){    
        //checking unique Office
        let existingType = await Office.findOne(
            {_id:mongoose.Types.ObjectId(req.body.id)},
            { _id: 1 }
        );
        
        if (!existingType) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));     

        //save Office 
        Office.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.id) }, { $set: req.body }, { new: true }, function (err, type) {
            
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));        
                
            return res.status(responseCode.CODES.SUCCESS.OK).send(type);        
            
        });
    }else{
        //checking unique Office
        let existingType = await Office.findOne(
            {title:title, address:address},
            { _id: 1 }
        );
        
        if (existingType) return res.status(400).send(req.polyglot.t('TYPE-ALREADY-EXIST'));     

        //save city 
        newType = new Office(_.pick(req.body, ['title', 'image', 'address', 'country', 'state', 'city', 'phone', 'zipcode','created_at','modified_at']));
        
        newType.save(async function (err, type) {
            
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));        
                
            return res.status(responseCode.CODES.SUCCESS.OK).send(type);        
            
        });
    }

    
}



exports.listing = async (req, res) => {

    const {  size, pageNumber } = req.body
    let condition = {};
    let sortBy = {};
    sortBy['created_at'] =  -1     
    
    if (_.has(req.body, ['search'])   &&  (req.body['search']).length>0){    
        condition['title'] =  { $regex: req.body['search'], $options: 'i' }   
        //condition['email'] =  { $regex: req.body['search'], $options: 'i' }   
    }
    
    let totalRecords = await Office.count(condition);   
    //calculating the limit and skip attributes to paginate records
    let totalPages = totalRecords / size;
    console.log('totalPages',totalPages);
    let start = pageNumber * size;
  
    let skip = (parseInt(pageNumber) * parseInt(size)) - parseInt(size);
    let limit = parseInt(size);  
    
  
    let records = await Office.find(condition).skip(skip).limit(limit).sort(sortBy);
    let data = {
        records:records,
        total_records:totalRecords
    }

    return res.status(responseCode.CODES.SUCCESS.OK).send(data);
    
    /*Office.find({}, function(err, result) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR')); 

        return res.status(responseCode.CODES.SUCCESS.OK).send(result);  
    });*/
   
}

exports.deleteOffice = async (req, res) => {

    Office.deleteOne({ _id:mongoose.Types.ObjectId(req.body.id) }, function (err, doc) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
        return res.status(responseCode.CODES.SUCCESS.OK).send(true);
    }); 
   
}



