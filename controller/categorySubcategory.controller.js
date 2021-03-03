const _ = require('lodash'); 
const config = require('config');
const { Category } = require('../schema/category');
const { Subcategory } = require('../schema/subcategory');
const responseCode = require('../utilities/responseCode');
var mongoose = require('mongoose');
const upload = require("../utilities/upload");
const singleUpload = upload.single("file");

exports.uploadImage = async (req, res) => {
    
    singleUpload(req, res, function (err) {
		if (err) {       
           
            return res.status(responseCode.CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).send(err); 
        }		
        console.log('file',req.file.location)
		return res.status(responseCode.CODES.SUCCESS.OK).send({
			file:req.file.location,
            fileKey: req.file.key,
            fileName: req.file.originalname,
            fileMimeType: req.file.mimetype
		});        

	});
}

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
         let existingCategory = await Category.findOne(
            {_id:mongoose.Types.ObjectId(req.body.id)},
            { _id: 1 }
        );
        
        if (!existingCategory) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));     

        //save city 
        Category.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.id) }, { $set: req.body }, { new: true }, function (err, type) {
            
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));        
                
            return res.status(responseCode.CODES.SUCCESS.OK).send(type);        
            
        });
    }else{
        //checking unique city
        let existingCategory = await Category.findOne(
            {title:title},
            { _id: 1 }
        );
        
        if (existingCategory) return res.status(400).send(req.polyglot.t('CATEGORY-ALREADY-EXIST'));     

        
            
        newCategory = new Category(_.pick(req.body, ['title','image','image_object','is_visible_on_home', 'count','created_at','modified_at']));
       
        newCategory.save(async function (err, category) {
            
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));        
                
            return res.status(responseCode.CODES.SUCCESS.OK).send(category);        
            
        });

          

        
    }
    
}


exports.addSubcategory = async (req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { title, category_id } = req.body

    if (_.has(req.body, ['id']) && (req.body.id)!=null){ 
        //checking unique Subcategory
        let existingSubcategory = await Subcategory.findOne(
            {_id:mongoose.Types.ObjectId(req.body.id)},
            { _id: 1 }
        );
        
        if (!existingSubcategory) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));     

        //save Neighbourhood 
        Subcategory.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.id) }, { $set: req.body }, { new: true }, function (err, type) {
            
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));        
                
            return res.status(responseCode.CODES.SUCCESS.OK).send(type);        
            
        });
    }else{
        //save Subcategor 
        newSubcategory = new Subcategory(_.pick(req.body, ['title','category_id','image', 'image_object','count','created_at','modified_at','is_active']));
        
        newSubcategory.save(async function (err, subcategory) {
            
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));   
                        
            return res.status(responseCode.CODES.SUCCESS.OK).send(subcategory);        
            
        });
    }
    
}

exports.categoryListing = async (req, res) => {
    
    Category.find({ is_visible_on_home:true }, function(err, result) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR')); 

        return res.status(responseCode.CODES.SUCCESS.OK).send(result);  
    }).sort({created_at: -1}).limit(8);

}


exports.subcategoryListing = async (req, res) => {
   
    Subcategory.find({category_id:req.body.category_id}, function(err, result) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR')); 

        return res.status(responseCode.CODES.SUCCESS.OK).send(result);  
    });         
       
}

exports.allSubcategory = async (req, res) => {
   
    Subcategory.find({}, function(err, result) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR')); 

        return res.status(responseCode.CODES.SUCCESS.OK).send(result);  
    });         
       
}
exports.deleteCategory = async (req, res) => {

    let record = await Category.findOne({_id:mongoose.Types.ObjectId(req.body.id)}, { _id: 1 } );
    
    if (!record) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));  

    
    Category.deleteOne({ _id:mongoose.Types.ObjectId(req.body.id) }, function (err, doc) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
        Subcategory.deleteMany({ category_id:mongoose.Types.ObjectId(req.body.id) }, function (err, doc) {
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
            return res.status(responseCode.CODES.SUCCESS.OK).send(true);
        });
    });
        
    
   
}

exports.deleteSubcategory = async (req, res) => {

    let condition = {}
    condition['_id'] = mongoose.Types.ObjectId(req.body['id']);

    let record = await Subcategory.findOne(condition, { _id: 1 } );
    
    if (!record) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));  

    
    Subcategory.deleteOne({ _id:mongoose.Types.ObjectId(req.body.id) }, function (err, doc) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
        return res.status(responseCode.CODES.SUCCESS.OK).send(true);
    });
     
   
}

exports.changeSubcategoryStatus = async(req, res) => {
    let existingRecord = await Subcategory.findOne({ _id: mongoose.Types.ObjectId(req.body.id) }, { _id: 1 });

    if (!existingRecord) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));

    req.body['modified_at'] = new Date()
        //save city 
        Subcategory.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.id) }, { $set: { is_active: req.body.is_active } }, { new: true }, function(err, data) {

        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

        return res.status(responseCode.CODES.SUCCESS.OK).send(data);

    });
}



