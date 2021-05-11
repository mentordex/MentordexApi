const _ = require('lodash'); 
const { Review } = require('../schema/review');
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
    const { name, city, image, review, rating } = req.body

    if (_.has(req.body, ['id']) && (req.body.id)){    
        //checking unique Review
        let existingReview = await Review.findOne(
            {_id:mongoose.Types.ObjectId(req.body.id)},
            { _id: 1 }
        );
        
        if (!existingReview) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));     

        //update Review 
        Review.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.id) }, { $set: req.body }, { new: true }, function (err, type) {
            
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));        
                
            return res.status(responseCode.CODES.SUCCESS.OK).send(type);        
            
        });
    }else{
          

        //save Review 
        newReview = new Review(_.pick(req.body, ['name','city', 'image', 'image_object', 'is_active', 'review','rating','created_at','modified_at']));
        
        newReview.save(async function (err, type) {
            
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
          
        condition['name'] =  { $regex: req.body['search'], $options: 'i' }
    }
    
    let totalRecords = await Review.count(condition);   
    //calculating the limit and skip attributes to paginate records
    let totalPages = totalRecords / size;
    console.log('totalPages',totalPages);
    let start = pageNumber * size;
  
    let skip = (parseInt(pageNumber) * parseInt(size)) - parseInt(size);
    let limit = parseInt(size);  
    
  
    let records = await Review.find(condition).skip(skip).limit(limit).sort(sortBy);
    let data = {
        records:records,
        total_records:totalRecords
    }

    return res.status(responseCode.CODES.SUCCESS.OK).send(data);
    
    
   
}

exports.deleteReview = async (req, res) => {

    Review.deleteOne({ _id:mongoose.Types.ObjectId(req.body.id) }, function (err, doc) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
        return res.status(responseCode.CODES.SUCCESS.OK).send(true);
    }); 
   
}


exports.changeStatus = async(req, res) => {
    let existingRecord = await Review.findOne({ _id: mongoose.Types.ObjectId(req.body.id) }, { _id: 1 });

    if (!existingRecord) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));

    req.body['modified_at'] = new Date()
        //update Review 
        Review.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.id) }, { $set: { is_active: req.body.is_active } }, { new: true }, function(err, data) {

        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

        return res.status(responseCode.CODES.SUCCESS.OK).send(data);

    });
}
