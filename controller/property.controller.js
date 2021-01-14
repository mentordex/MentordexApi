const upload = require('../utilities/upload');
const _ = require('lodash'); 
const config = require('config');
const sgMail = require('@sendgrid/mail');
const responseCode = require('../utilities/responseCode');
const { Property } = require('../schema/property');
const { User } = require('../schema/user');
const { Activity } = require('../schema/activity');
const { Pageview } = require('../schema/pageview');
const { Dashboard } = require('../schema/dashboard');
const { PropertyType } = require('../schema/propertyType');
const { City } = require('../schema/city');
const singleImageUpload = upload.single('file')
sgMail.setApiKey(config.get('sendgrid.key'));
var mongoose = require('mongoose');

const aws = require('aws-sdk');
aws.config.update({
	secretAccessKey: config.get('aws.secretKey'),
	accessKeyId: config.get('aws.accessKey')	
});
const s3 = new aws.S3();


exports.uploadImage = async (req, res) => {
    singleImageUpload(req, res, function (err) {
		if (err) {           
            return res.status(responseCode.CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).send(err); 
		}		
		return res.status(responseCode.CODES.SUCCESS.OK).send({
			fileLocation: req.file.location,
			fileKey: req.file.key,
			fileName: req.file.originalname,
			fileMimeType: req.file.mimetype
		});
	});
}

/*
* Here we would probably call the DB to confirm the user exists
* Then validate if they're authorized to add property
* create and save property
* Send an email to that address 
*/
exports.addProperty = async (req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { user_id } = req.body

    //checking unique email
    let existingUser = await User.findOne(
        {_id:user_id},
        { email: 1, name:1 }
    );   
 
	if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));  


    //save user 
    newProperty = new Property(_.pick(req.body, ['title','description', 'type','status', 'price', 'area', 'rooms','loc', 'address', 'lat','lng','city','zipcode','neighborhood','propertyId','area_size','size_prefix','land_area','bedrooms','bathrooms','garages','garage_size','year_built','video_url','virtual_tour','aminities','images','documents','save_as','user_id','currency','language','created_at','modified_at','rooms','parking_spots','property_status','lot_area','floor_number']));


    
    newProperty.save(async function (err, property) {
        
        if (err) return res.status(500).send(err);   

       
        City.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.city) }, { $inc: { count: 1} }, { new: true, upsert: true },function(err, data){
                    
        })

        PropertyType.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.type) }, { $inc: { count: 1} }, { new: true, upsert: true },function(err, data){
                    
        })

        Dashboard.findOneAndUpdate({ user_id: mongoose.Types.ObjectId(user_id) }, { $inc: { property_count: 1, neighborhoods_count:1 } }, { new: true, upsert: true },function(err, data){
                    
        })
        

        Activity.create({
            property_id:property._id,
            action:'property added',           
        });
        

        const msg = {
            to: existingUser.email,
            from: config.get('sendgrid.from'),
            subject: req.polyglot.t('PROPERTY-ADDED'),
            //text: req.polyglot.t('YOU-ARE-IN'),
            html: `Hi ${existingUser.name},<br>Your property has beed added successfully!<br> 
            <br>
            Let me know if you need anything.<br> 
            <br>
            Thanks.`,
        };
        sgMail.send(msg);
       
        
        return res.status(responseCode.CODES.SUCCESS.OK).send(property);    
        
    });



}

exports.updateProperty = async (req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { user_id, property_id } = req.body

    //checking unique email
    let existingUser = await User.findOne(
        {_id:user_id},
        { email: 1, name:1 }
    );   
 
	if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));  


    let existingProperty = await Property.findOne(
        {_id:property_id},
        { title: 1, city:1, type:1 }
    );   
 
    if (!existingProperty) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('NO-PROPERTY-FOUND')); 
    
    req.body['price'] = req.body['price']*100;
    req.body['area'] = req.body['area']*100;
    Property.findOneAndUpdate({ _id: req.body.property_id }, { $set: req.body }, { new: true }, function (err, doc) {

        if (err) return res.status(responseCode.CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).send(err);
        
        if(existingProperty.city != req.body.city){
            City.findOneAndUpdate({ _id: mongoose.Types.ObjectId(existingProperty.city) }, { $inc: { count: -1} }, { new: true, upsert: true },function(err, data){
                    
            })
            City.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.city) }, { $inc: { count: 1} }, { new: true, upsert: true },function(err, data){
                    
            })
        }
        
        if(existingProperty.type != req.body.type){
            PropertyType.findOneAndUpdate({ _id: mongoose.Types.ObjectId(existingProperty.type) }, { $inc: { count: -1} }, { new: true, upsert: true },function(err, data){
                        
            })
            PropertyType.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.type) }, { $inc: { count: 1} }, { new: true, upsert: true },function(err, data){
                        
            })
        }

        

       

        Activity.create({
            property_id:existingProperty._id,
            action:'property updated',           
        });
        
        res.status(responseCode.CODES.SUCCESS.OK).send(true);
  
    });

}

exports.listing = async (req, res) => {

    const { user_id, search, size, pageNumber, sort_dir } = req.body
    let condition = {};
    condition['is_featured'] =  'NO';
    condition['user_id'] =  user_id;
    
    let sortBy={}
    sortBy['created_at'] =  (sort_dir=='asc')?-1:1
   

    if((search).length>0){     
        condition['title'] =  { $regex: search, $options: 'i' }   
    }
    
    
    let totalRecords = await Property.count(condition);
    console.log('totalRecords',totalRecords);
    //calculating the limit and skip attributes to paginate records
    let totalPages = totalRecords / size;
    console.log('totalPages',totalPages);
    let start = pageNumber * size;
  
    let skip = (parseInt(pageNumber) * parseInt(size)) - parseInt(size);
    let limit = parseInt(size);
  
    
    let properties = await Property.find(condition).skip(skip).limit(limit).sort(sortBy);
    let data = {
      records:properties,
      total_records:totalRecords
    }
    return res.status(responseCode.CODES.SUCCESS.OK).send(data);  
}

exports.featuredListing = async (req, res) => {

    const { user_id, search, size, pageNumber, sort_dir } = req.body
    let condition = {};
    condition['is_featured'] =  'YES';
    condition['user_id'] =  user_id;

    let sortBy={}
    sortBy['created_at'] =  (sort_dir=='asc')?-1:1
   

    if((search).length>0){     
        condition['title'] =  { $regex: search, $options: 'i' }   
    }
    
    
    let totalRecords = await Property.count(condition);
    console.log('totalRecords',totalRecords);
    //calculating the limit and skip attributes to paginate records
    let totalPages = totalRecords / size;
    console.log('totalPages',totalPages);
    let start = pageNumber * size;
  
    let skip = (parseInt(pageNumber) * parseInt(size)) - parseInt(size);
    let limit = parseInt(size);
  
    
    let properties = await Property.find(condition).skip(skip).limit(limit).sort(sortBy);
    let data = {
      records:properties,
      total_records:totalRecords
    }
    return res.status(responseCode.CODES.SUCCESS.OK).send(data);  
}
exports.homePageFeaturedListing = async (req, res) => {

    Property.aggregate([
        {
            $match: {is_featured:'YES',}
        },
        { 
            
            "$lookup": {
                from: "propertytypes",
                localField: "type",
                foreignField: "_id",
                as: "propertyType",            
                }
        }, 
        { 
            
            "$lookup": {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user",            
            }
        },        
        {
            $project: {   
                'title':1,
                'description':1, 
                'status':1, 
                'price':1, 
                'area':1,
                'rooms':1,
                'loc':1,
                'address':1,
                'lat':1,
                'lng':1,
                'land_area':1,
                'bedrooms':1,
                'bathrooms':1,
                'garages':1,
                'garage_size':1,
                'year_built':1,
                'aminities':1,
                'images':1,
                'documents':1,
                'save_as':1,
                'user_id':1,
                'currency':1,
                'language':1,
                'created_at':1,
                'modified_at':1,
                'rooms':1,
                'parking_spots':1,
                'property_status':1,
                'lot_area':1,
                'floor_number':1,           
                'propertyType.type':1,
                'user.name':1,    
                'user.email':1,
                'user.profile_pic':1,
                'user.created_at':1                        
            },
        }, 
        { $sort: 
            { 
                created_at:-1
            }
        }

      ], function(err, properties){    
          
          let data = {
            records:properties,
            total_records:18
          }
        return res.status(responseCode.CODES.SUCCESS.OK).send(data);
      })
 
}

exports.deletePropertyImage = (req, res) => {
    let params = {
		Bucket: config.get('aws.bucket'),
		Key: req.body.fileKey
	};


	s3.headObject(params, function (err, data) {

		if (err) {
			return res.status(responseCode.CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).send(err.messege)
		} else {
			s3.deleteObject(params, function (err, data) {
				if (err) {
					return res.status(responseCode.CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).send(err.messege)
				} else {
					return res.status(responseCode.CODES.SUCCESS.OK).send(true);
				}
			});
		}
	});

}

exports.deleteProperty = async(req, res) => {

    let property = await Property.findOne({ "_id": req.body.propertyID, "user_id": req.body.user_id }, { _id: 1 });

    if (!property) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('NO-RECORD-FOUND'));


    //remove Property
    Property.deleteOne({ _id: req.body.id }, function (err, result) {
        if (err) return res.status(responseCode.CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).send(err.messege)

        return res.status(responseCode.CODES.SUCCESS.OK).send(true);   
    });
}


exports.propertyInformation = async(req, res) => {

    var propertyID = mongoose.Types.ObjectId(req.body.propertyID);

    Property.aggregate([
        {
            $match: { "_id": propertyID}
        },
        { 
            
        "$lookup": {
            from: "propertytypes",
            localField: "type",
            foreignField: "_id",
            as: "propertyType",            
            }
        }, 
        { 
            
            "$lookup": {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user",            
            }
        },
        {
            $project: {   
                'title':1,
                'description':1, 
                'status':1, 
                'price':1, 
                'area':1,
                'rooms':1,               
                'address':1,
                'lat':1,
                'lng':1,
                'land_area':1,
                'bedrooms':1,
                'bathrooms':1,
                'garages':1,
                'garage_size':1,
                'year_built':1,               
                'images':1, 
                'user_id':1,
                'currency':1,            
                'created_at':1,            
                'rooms':1,
                'parking_spots':1,
                'property_status':1,
                'lot_area':1,
                'floor_number':1,           
                'propertyType.type':1,
                'user.name':1,    
                'user.email':1,
                'user.office_phone':1,
                'user.profile_pic':1                         
            },
        }, 

      ], function(err, data){     
          console.log(err); 
          console.log(data); 
        return res.status(responseCode.CODES.SUCCESS.OK).send(data);
      })





    /*let property = await Property.findOne({ "_id": req.body.propertyID});

    if (!property) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('NO-RECORD-FOUND'));


    return res.status(responseCode.CODES.SUCCESS.OK).send(property);*/
}

exports.editablePropertyInformation = async(req, res) => {

    var propertyID = mongoose.Types.ObjectId(req.body.propertyID);

    let property = await Property.findOne({ "_id": req.body.propertyID});

    if (!property) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('NO-RECORD-FOUND'));


    return res.status(responseCode.CODES.SUCCESS.OK).send(property);
}

exports.checkAndUpdateViewCount = async (req, res) => {
 
    var propertyID = mongoose.Types.ObjectId(req.body.property_id);
    let property = await Property.findOne({ "_id": propertyID},{_id:1,user_id:1});

    if (!property) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('NO-RECORD-FOUND'));

    //Pageview
    
    var ip = req.body.remote_address;
    let existingViewCount = await Pageview.findOne(
        {property_id: property._id, ip: ip},
        { _id: 1, user_id:1 }
    ); 
    if (!existingViewCount){
       // console.log('in');
        Dashboard.findOneAndUpdate({ user_id: property.user_id }, { $inc: { property_view_count: 1 } }, { new: true, upsert: true },function(err, data){
                    
        })        

        Property.findOneAndUpdate({ _id: propertyID }, { $inc: { page_view_count: 1 } }, { new: true, upsert: true },function(err, data){
                    
        })

        Activity.create({
            property_id:propertyID,
            action:'property view',           
        });
        Pageview.create({
            property_id:propertyID,
            ip:ip,  
            created_at:new Date()         
        },function (err, viewcount) {
            if (err) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(err);
            // saved!       
        });

        return res.status(responseCode.CODES.SUCCESS.OK).send(true);

    }else{
        return res.status(responseCode.CODES.SUCCESS.OK).send(true);
    }    
    
    
}

exports.dashboardChart = async (req, res) => {
    const { user_id } = req.body
    let TODAY = new Date()
    let YEAR_BEFORE = addMonths(new Date(), -6)   
  

    Property.aggregate([
            { 
                $match: { 
                   user_id: mongoose.Types.ObjectId(user_id), 
                   created_at: { $gte: YEAR_BEFORE, $lte: TODAY }
                }
            },
            { 
                $group: {
                    _id: { "year_month": { $substrCP: [ "$created_at", 0, 7 ] } },           
                    count: { $sum: "$page_view_count" }
                } 
            },
            {
                $sort: { "_id.year_month": 1 }
            },
            { 
                $project: { 
                    _id: 0, 
                    count: 1, 
                    month: { $substrCP: [ "$_id.year_month", 0, 7  ] }                   
                } 
            }
            
        ],function(err, data){
            
            return res.status(responseCode.CODES.SUCCESS.OK).send(data);
        });
}

exports.recentActivities = async (req, res) => {
    const { user_id } = req.body;

    Activity.aggregate([
       
        { 
            
        "$lookup": {
            from: "properties",
            localField: "property_id",
            foreignField: "_id",
            as: "property",
            

            
            }
        },
        {
            "$addFields": {
                "property": {
                    "$arrayElemAt": [
                        {
                            "$filter": {
                                "input": "$property",
                                "as": "comp",
                                "cond": {
                                    "$eq": [ "$$comp.user_id", mongoose.Types.ObjectId(user_id) ]
                                }
                            }
                        }, 0
                    ]
                }
            }
        },
        {
            $project: {              
              action: 1,
              property_id: 1,
              created_at: 1,
              'property.title':1                            
            },
        },
        {
            $sort: {created_at : -1}
        },        
        {
            $limit: 10
        },

      ], function(err, data){
       // console.log(data)
        return res.status(responseCode.CODES.SUCCESS.OK).send(data);
      })
}

exports.dashboard = async(req, res) => {
    const { user_id } = req.body
    let dashboard = await Dashboard.findOne({ "user_id": mongoose.Types.ObjectId(user_id)});

    if (!dashboard) return res.status(responseCode.CODES.SUCCESS.OK).send({
        property_count:0,
        property_view_count:0,
        contact_request_count:0,
        neighborhoods_count:0,
    })


    return res.status(responseCode.CODES.SUCCESS.OK).send(dashboard);
}

exports.searchProperty = async (req, res) => {

    const { userId, property_status, search, size, pageNumber, sort_dir } = req.body
    let condition = {};   
    let sortBy={}
    sortBy['created_at'] =  (sort_dir=='asc')?-1:1
   

    if (!_.isEmpty(req.body, true)) {
        condition = filters(req, condition)
    }

 
    
    
   
   
    if (_.has(req.body, ['lat'])   &&  req.body['lat']){    
        searchWithAddress(req,res,condition, sortBy)
    }else{
        searchWithoutAddress(req, res,condition, sortBy)
    }

    


    
 
}

async function searchWithAddress(req,res, condition, sortBy){
    console.log('searchWithAddress')
    const { userId, property_status, search, size, pageNumber, sort_dir } = req.body
    let allRecords = await Property.aggregate([
        {
            "$geoNear": {
                "near": {
                    "type": "Point",
                    "coordinates": [ req.body.lng, req.body.lat]
                },
                "spherical": true,
                "distanceField": "distance",
               // "distanceMultiplier": 0.000621371,//distance in miles
                "maxDistance": 20000,
            }
        },
        {
            $match: condition
        },
        {
            $count: "total_records"
        }
    ])

    let totalRecords = (allRecords.length)?allRecords[0].total_records:0;

    
    //calculating the limit and skip attributes to paginate records
    let totalPages = totalRecords / size;
  
    let start = pageNumber * size;
  
    let skip = (parseInt(pageNumber) * parseInt(size)) - parseInt(size);
    let limit = parseInt(size);
    Property.aggregate([
        {
            "$geoNear": {
                "near": {
                    "type": "Point",
                    "coordinates": [ req.body.lng, req.body.lat]
                },
                "spherical": true,
                "distanceField": "distance",
               // "distanceMultiplier": 0.000621371,//distance in miles
                "maxDistance": 20000,
            }
        },

        {
            $match: condition
        },
        { 
            
            "$lookup": {
                from: "propertytypes",
                localField: "type",
                foreignField: "_id",
                as: "propertyType",            
                }
        }, 
        { 
            
            "$lookup": {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user",            
            }
        },        
        {
            $project: {   
                'title':1,
                'description':1, 
                'status':1, 
                'price':1, 
                'area':1,
                'rooms':1,
                'loc':1,
                'address':1,
                'lat':1,
                'lng':1,
                'land_area':1,
                'bedrooms':1,
                'bathrooms':1,
                'garages':1,
                'garage_size':1,
                'year_built':1,            
                'images':1,               
                'save_as':1,
                'user_id':1,
                'currency':1,
                'language':1,
                'created_at':1,
                'modified_at':1,
                'rooms':1,
                'parking_spots':1,
                'property_status':1,
                'lot_area':1,
                'floor_number':1,           
                'propertyType.type':1,
                'user._id':1,  
                'user.name':1,    
                'user.email':1,
                'user.profile_pic':1,
                'user.created_at':1                        
            },
        }, 
        { $sort:sortBy },
        { $skip: skip },
        { $limit: limit }

      ], function(err, properties){    
          
          let data = {
            records:properties,
            total_records:totalRecords
          }
        return res.status(responseCode.CODES.SUCCESS.OK).send(data);
      })
}

async function searchWithoutAddress(req, res, condition,sortBy ){
    console.log('searchWithoutAddress')
    const { userId, property_status, search, size, pageNumber, sort_dir } = req.body
    let totalRecords = await Property.count(condition);
    //calculating the limit and skip attributes to paginate records
    let totalPages = totalRecords / size;
  
    let start = pageNumber * size;
  
    let skip = (parseInt(pageNumber) * parseInt(size)) - parseInt(size);
    let limit = parseInt(size);
    Property.aggregate([
      

        {
            $match: condition
        },
        { 
            
            "$lookup": {
                from: "propertytypes",
                localField: "type",
                foreignField: "_id",
                as: "propertyType",            
                }
        }, 
        { 
            
            "$lookup": {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user",            
            }
        },        
        {
            $project: {   
                'title':1,
                'description':1, 
                'status':1, 
                'price':1, 
                'area':1,
                'rooms':1,
                'loc':1,
                'address':1,
                'lat':1,
                'lng':1,
                'land_area':1,
                'bedrooms':1,
                'bathrooms':1,
                'garages':1,
                'garage_size':1,
                'year_built':1,            
                'images':1,               
                'save_as':1,
                'user_id':1,
                'currency':1,
                'language':1,
                'created_at':1,
                'modified_at':1,
                'rooms':1,
                'parking_spots':1,
                'property_status':1,
                'lot_area':1,
                'floor_number':1,           
                'propertyType.type':1,
                'user.name':1,    
                'user.email':1,
                'user.profile_pic':1,
                'user.created_at':1                        
            },
        }, 
        { $sort:sortBy },
        { $skip: skip },
        { $limit: limit }

      ], function(err, properties){    
          
          let data = {
            records:properties,
            total_records:totalRecords
          }
        return res.status(responseCode.CODES.SUCCESS.OK).send(data);
      })
}

function addMonths(date, months) {
    date.setMonth(date.getMonth() + months);
    return date;
}

function filters(req, condition) {
   
    //if filters contains the 'condition' filter
    if (_.has(req.body, ['user_id']) && req.body['user_id'] && req.body['user_id'].length > 0)
        condition['user_id'] = mongoose.Types.ObjectId(req.body['user_id'])

    //if filters contains the 'year' filter
    if (_.has(req.body, ['property_status']) && req.body['property_status'] && req.body['property_status'].length > 0)
        condition['property_status'] = { $in: req.body['property_status'] }

    //if filters contains the 'state' filter
    if (_.has(req.body, ['keyword']) && req.body['keyword'] && req.body['keyword'].length > 0){
        condition['title'] = { $regex: req.body['keyword'], $options: 'i' }
        condition['description'] = { $regex: req.body['keyword'], $options: 'i' }
    }
       
    if (_.has(req.body, ['status']) && req.body['status'] && req.body['status'].length > 0)
        condition['status'] = { $regex: req.body['status'], $options: 'i' } 

    if (_.has(req.body, ['type']) && req.body['type'] && req.body['type'].length > 0)
        condition['type'] = { $regex: req.body['type'], $options: 'i' }

    if (_.has(req.body, ['rooms']) && req.body['rooms'] && req.body['rooms'].length > 0)
        condition['rooms'] = req.body['rooms']

    if (_.has(req.body, ['bathrooms']) && req.body['bathrooms'] && req.body['bathrooms'].length > 0)
        condition['bathrooms'] = req.body['bathrooms']

    
        
    if (_.has(req.body, ['year_built']) && req.body['year_built'] && req.body['year_built'].length > 0)
        condition['year_built'] = req.body['year_built']


    if (_.has(req.body, ['city']) && req.body['city'] && req.body['city'].length > 0)
        condition['city'] = mongoose.Types.ObjectId(req.body['city'])



    if (_.has(req.body, ['aminities']) && req.body['aminities'] && req.body['aminities'].length > 0)
        condition['aminities'] = { $in: req.body['aminities'] }
    

    return condition
}




