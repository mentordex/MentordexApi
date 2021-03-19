const _ = require('lodash'); 
const { Team } = require('../schema/team');
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
    const { name, title, image, description } = req.body

    if (_.has(req.body, ['id']) && (req.body.id)){    
        //checking unique Office
        let existingTeam = await Team.findOne(
            {_id:mongoose.Types.ObjectId(req.body.id)},
            { _id: 1 }
        );
        
        if (!existingTeam) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));     

        //update Team 
        Team.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.id) }, { $set: req.body }, { new: true }, function (err, type) {
            
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));        
                
            return res.status(responseCode.CODES.SUCCESS.OK).send(type);        
            
        });
    }else{
          

        //save Team 
        newTeam = new Team(_.pick(req.body, ['name','title', 'image', 'image_object', 'is_active', 'description','created_at','modified_at']));
        
        newTeam.save(async function (err, type) {
            
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
        condition['name'] =  { $regex: req.body['search'], $options: 'i' }   
        condition['description'] =  { $regex: req.body['search'], $options: 'i' }
    }
    
    let totalRecords = await Team.count(condition);   
    //calculating the limit and skip attributes to paginate records
    let totalPages = totalRecords / size;
    console.log('totalPages',totalPages);
    let start = pageNumber * size;
  
    let skip = (parseInt(pageNumber) * parseInt(size)) - parseInt(size);
    let limit = parseInt(size);  
    
  
    let records = await Team.find(condition).skip(skip).limit(limit).sort(sortBy);
    let data = {
        records:records,
        total_records:totalRecords
    }

    return res.status(responseCode.CODES.SUCCESS.OK).send(data);
    
    
   
}

exports.deleteTeam = async (req, res) => {

    Team.deleteOne({ _id:mongoose.Types.ObjectId(req.body.id) }, function (err, doc) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
        return res.status(responseCode.CODES.SUCCESS.OK).send(true);
    }); 
   
}


exports.changeStatus = async(req, res) => {
    let existingRecord = await Team.findOne({ _id: mongoose.Types.ObjectId(req.body.id) }, { _id: 1 });

    if (!existingRecord) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));

    req.body['modified_at'] = new Date()
        //update Office 
        Team.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.id) }, { $set: { is_active: req.body.is_active } }, { new: true }, function(err, data) {

        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

        return res.status(responseCode.CODES.SUCCESS.OK).send(data);

    });
}
