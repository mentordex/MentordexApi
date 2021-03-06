const _ = require('lodash'); 
const config = require('config');
const sgMail = require('@sendgrid/mail');
const { Admin } = require('../../schema/admin/admin');
const { User } = require('../../schema/user');
const { City } = require('../../schema/city');
const { Neighbourhood } = require('../../schema/neighbourhood');
const { PropertyType } = require('../../schema/propertyType');
const { Property } = require('../../schema/property');
const { Amenity } = require('../../schema/amenity');
const { Activity } = require('../../schema/activity');
const { Pageview } = require('../../schema/pageview');
const responseCode = require('../../utilities/responseCode');
var mongoose = require('mongoose');
const adminObject = new Admin();
sgMail.setApiKey(config.get('sendgrid.key'));
/*
* Here we would probably call the DB to confirm the user exists
* Then validate if they're authorized to login
* Then confirm their password
* Create a JWT or a cookie
* And finally send it back if all's good
*/
exports.login = async (req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { email, password } = req.body

    admin = await Admin.findOne({ "email": email  },{ email: 1, role:1, salt_key:1, created_at: 1, password:1 });
    if (!admin) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));  

    //checking password match
    const isValidPassword = await adminObject.passwordCompare(admin.salt_key, admin.password, req.body.password);

    if (!isValidPassword) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('PASSWORD-MISMATCH'));

   
    const token = await adminObject.generateToken(admin.salt_key);//generate token
    console.log('token',token);

    await Admin.findOneAndUpdate({ _id: admin._id }, { $set: { auth_token: token } }, { new: true })

    

    res.setHeader('x-mentordex-auth-token', token);
    res.header('Access-Control-Expose-Headers', 'x-mentordex-auth-token')   
    
    return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(admin, ['_id','name','email', 'role']));    
   
}

exports.adminListing = async (req, res) => {

  

    const {  size, pageNumber } = req.body
    let condition = {};
    let sortBy = {};
    sortBy['created_at'] =  -1     
    
    if (_.has(req.body, ['search'])   &&  (req.body['search']).length>0){    
        condition['title'] =  { $regex: req.body['search'], $options: 'i' }   
        condition['email'] =  { $regex: req.body['search'], $options: 'i' }   
    }
    
    let totalRecords = await Admin.count(condition);   
    //calculating the limit and skip attributes to paginate records
    let totalPages = totalRecords / size;
    console.log('totalPages',totalPages);
    let start = pageNumber * size;
  
    let skip = (parseInt(pageNumber) * parseInt(size)) - parseInt(size);
    let limit = parseInt(size);  
    
  
    let admins = await Admin.find(condition).skip(skip).limit(limit).sort(sortBy);
    let data = {
        records:admins,
        total_records:totalRecords
    }

    return res.status(responseCode.CODES.SUCCESS.OK).send(data);
   
}

exports.userListing = async (req, res) => {

  

    const {  size, pageNumber } = req.body
    let condition = {};
    let sortBy = {};
    sortBy['created_at'] =  -1     
    
    if (_.has(req.body, ['search'])   &&  (req.body['search']).length>0){    
        condition['title'] =  { $regex: req.body['search'], $options: 'i' }   
        condition['email'] =  { $regex: req.body['search'], $options: 'i' }   
    }
    if (_.has(req.body, ['user_type'])   &&  (req.body['user_type']).length>0){    
        condition['role'] =  req.body['user_type'];
    }
    
 
    let totalRecords = await User.count(condition);   
    //calculating the limit and skip attributes to paginate records
    let totalPages = totalRecords / size;
    console.log('totalPages',totalPages);
    let start = pageNumber * size;
  
    let skip = (parseInt(pageNumber) * parseInt(size)) - parseInt(size);
    let limit = parseInt(size);  
    
  
    User.aggregate([
        {
            $match: condition
        },
        { 
            
        "$lookup": {
            from: "dashboards",
            localField: "_id",
            foreignField: "user_id",
            as: "dashboard",            
            }
        },         
        {
            $project: {   
                'name':1,
                is_active:1,
                'email':1, 
                'fax':1, 
                'mobile':1, 
                'created_at':1, 
                'office_phone':1,
                'profile_pic':1,
                'facebook':1,
                'twitter':1,
                'instagram':1,
                'google_plus':1,
                'pinterest':1,
                'role':1,                
                'dashboard.property_count':1, 
                'dashboard.property_view_count':1, 
                
            },
        },
        
        { $skip: skip },
        { $limit: limit },
        { $sort:sortBy }

 

      ], function(err, members){    
          
          let data = {
            records:members,
            total_records:totalRecords
          }
        return res.status(responseCode.CODES.SUCCESS.OK).send(data);
      })

   /* let users = await User.find(condition).skip(skip).limit(limit).sort(sortBy);
    let data = {
        records:users,
        total_records:totalRecords
    }

    return res.status(responseCode.CODES.SUCCESS.OK).send(data);*/
   
}

exports.cityListing = async (req, res) => {

    const {  size, pageNumber } = req.body
    let condition = {};
    let sortBy = {};
    sortBy['created_at'] =  -1     
    
    if (_.has(req.body, ['search'])   &&  (req.body['search']).length>0){ 
        condition['title'] =  { $regex: req.body['search'], $options: 'i' }   
    }
    

    let totalRecords = await City.count(condition);   
    //calculating the limit and skip attributes to paginate records
    let totalPages = totalRecords / size;
    console.log('totalPages',totalPages);
    let start = pageNumber * size;
  
    let skip = (parseInt(pageNumber) * parseInt(size)) - parseInt(size);
    let limit = parseInt(size);

    let records = await City.aggregate([   
        {
            $match:condition
        },

        {
            $lookup: {
                from: "neighbourhoods",
                localField: "_id",
                foreignField: "city_id",
                as: "neighbourhood"
            }
        },       
        {
            $project: {
                title: 1,    
                count: 1,    
                image:1,      
                created_at:1,        
                "neighbourhood.title": 1               

            }
        },
        { 
            $skip: skip
        },
        { 
            $limit: limit
        },
        { 
            $sort: sortBy
        }      
    ]) 
    let data = {
        records:records,
        total_records:totalRecords
    }
    return res.status(responseCode.CODES.SUCCESS.OK).send(data);    
}

exports.neighbourhoodListing = async (req, res) => {
   
    const {  size, pageNumber } = req.body
    let condition = {};
    let sortBy = {};
    sortBy['created_at'] =  -1     
    
    if (_.has(req.body, ['search'])   &&  (req.body['search']).length>0){ 
        condition['title'] =  { $regex: req.body['search'], $options: 'i' }   
    }
    if (_.has(req.body, ['city_id'])   &&  (req.body['city_id']).length>0){ 
        condition['city_id'] =  mongoose.Types.ObjectId(req.body['city_id'])  
    }
    
   
    let totalRecords = await Neighbourhood.count(condition);   
    //calculating the limit and skip attributes to paginate records
    let totalPages = totalRecords / size;
    console.log('totalPages',totalPages);
    let start = pageNumber * size;
  
    let skip = (parseInt(pageNumber) * parseInt(size)) - parseInt(size);
    let limit = parseInt(size);  
    
  
    Neighbourhood.aggregate([
        {
            $match: condition
        },
        { 
            
            "$lookup": {
                from: "cities",
                localField: "city_id",
                foreignField: "_id",
                as: "city"
            }
        },                
        {
            $project: {   
                'title':1,     
                'created_at':1,              
                'city.title':1,           
                                                        
            },
        }, 
        {
         
            $skip: skip
        },
        { 
            $limit: limit
        },
        { 
            $sort: sortBy
        } 

      ], function(err, records){    
          
          let data = {
            records:records,
            total_records:totalRecords
          }
        return res.status(responseCode.CODES.SUCCESS.OK).send(data);
      })

    /*let records = await Neighbourhood.find(condition).skip(skip).limit(limit).sort(sortBy);
    let data = {
        records:records,
        total_records:totalRecords
    }

    return res.status(responseCode.CODES.SUCCESS.OK).send(data);*/

            
       
}

exports.propertyTypeListing = async (req, res) => {
   
    const {  size, pageNumber } = req.body
    let condition = {};
    let sortBy = {};
    sortBy['created_at'] =  -1     
    
    if (_.has(req.body, ['search'])   &&  (req.body['search']).length>0){ 
        condition['type'] =  { $regex: req.body['search'], $options: 'i' }   
    }
   

    let totalRecords = await PropertyType.count(condition);   
    //calculating the limit and skip attributes to paginate records
    let totalPages = totalRecords / size;
    console.log('totalPages',totalPages);
    let start = pageNumber * size;
  
    let skip = (parseInt(pageNumber) * parseInt(size)) - parseInt(size);
    let limit = parseInt(size);  
    
  
    let records = await PropertyType.find(condition).skip(skip).limit(limit).sort(sortBy);
    let data = {
        records:records,
        total_records:totalRecords
    }

    return res.status(responseCode.CODES.SUCCESS.OK).send(data);

            
       
}

exports.propertyListing = async (req, res) => {
    const {  size, pageNumber } = req.body
    let condition = {};
    

    let sortBy={}
    sortBy['created_at'] =  -1
   
    if (_.has(req.body, ['search'])   &&  (req.body['search']).length>0){ 
        condition['title'] =  { $regex: req.body['search'], $options: 'i' }   
        condition['description'] =  { $regex: req.body['search'], $options: 'i' }   
    }

    if (_.has(req.body, ['status'])   &&  (req.body['status']).length>0){ 
        condition['save_as'] =  req.body['status'];
    }

    if (_.has(req.body, ['user_id'])   &&  (req.body['user_id']).length>0){ 
        condition['user_id'] =  mongoose.Types.ObjectId(req.body['user_id'])  
    }
  
    
    
    let totalRecords = await Property.count(condition);
    console.log('totalRecords',totalRecords);
    //calculating the limit and skip attributes to paginate records
    let totalPages = totalRecords / size;
    console.log('totalPages',totalPages);
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
        {
         
            $skip: skip
        },
        { 
            $limit: limit
        },
        { 
            $sort: sortBy
        } 

      ], function(err, properties){    
          
          let data = {
            records:properties,
            total_records:totalRecords
          }
        return res.status(responseCode.CODES.SUCCESS.OK).send(data);
      })
 
}

exports.amenityListing = async (req, res) => {
   
    const {   size, pageNumber } = req.body
    let condition = {};
    let sortBy = {};
    sortBy['created_at'] =  -1     
    
    
    if (_.has(req.body, ['search'])   &&  (req.body['search']).length>0){ 
        condition['type'] =  { $regex: req.body['search'], $options: 'i' }   
    }

    let totalRecords = await Amenity.count(condition);   
    //calculating the limit and skip attributes to paginate records
    let totalPages = totalRecords / size;
    console.log('totalPages',totalPages);
    let start = pageNumber * size;
  
    let skip = (parseInt(pageNumber) * parseInt(size)) - parseInt(size);
    let limit = parseInt(size);  
    
  
    let records = await Amenity.find(condition).skip(skip).limit(limit).sort(sortBy);
    let data = {
        records:records,
        total_records:totalRecords
    }

    return res.status(responseCode.CODES.SUCCESS.OK).send(data);

            
       
}


exports.changeUserStatus = async (req, res) => {

    console.log('req',req.body);
    // If no validation errors, get the req.body objects that were validated and are needed
    const { id, is_active } = req.body

    //checking unique email
    let existingUser = await User.findOne(
        {_id:id}
    );
    
    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));    
   

    await User.findOneAndUpdate({ _id: existingUser._id }, { $set: { is_active: is_active } }, { new: true })

    return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(existingUser, ['_id','name','email', 'role']));    
    



}

exports.changeAdminStatus = async (req, res) => {

    console.log('req',req.body);
    // If no validation errors, get the req.body objects that were validated and are needed
    const { id, is_active } = req.body

    //checking unique email
    let existingUser = await Admin.findOne(
        {_id:id}
    );
    
    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));    
   

    await Admin.findOneAndUpdate({ _id: existingUser._id }, { $set: { is_active: is_active } }, { new: true })

    return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(existingUser, ['_id','name','email', 'role']));    
    



}


exports.deleteUser = async (req, res) => {

    let condition = {}
    condition['user_id'] = { $in: req.body['id'] }  

    let property = await Property.findOne(condition, { _id: 1 } );
    
    if (property) return res.status(responseCode.CODES.SUCCESS.OK).send(false); 

    if (!property){
        User.deleteOne({ _id:mongoose.Types.ObjectId(req.body.id) }, function (err, doc) {
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
            return res.status(responseCode.CODES.SUCCESS.OK).send(true);
        });
    }  
   
}

exports.deleteAdmin= async (req, res) => {


    //checking unique email
    let existingUser = await Admin.findOne(
        {_id:req.body['id']}
    );
    
    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));   

    Admin.deleteOne({ _id:mongoose.Types.ObjectId(req.body.id) }, function (err, doc) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
        return res.status(responseCode.CODES.SUCCESS.OK).send(true);
    });    
   
}

exports.adminData = async (req, res) => {

    console.log('req',req.body);
    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID } = req.body

    //checking unique email
    let existingUser = await Admin.findOne(
        {_id:userID}
    );
    
    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));    
   

    return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(existingUser, ['_id','name','email','office_phone','fax','profile_pic','mobile','address','about_me','skype', 'website', 'facebook', 'twitter', 'linkedin', 'instagram', 'google_plus', 'youtube', 'pinterest', 'vimeo', 'role','created_at']));



}

exports.verifyToken = async (req, res) => {

    console.log('req',req.body);
    // If no validation errors, get the req.body objects that were validated and are needed
    const { token } = req.body

    //checking unique email
    let existingUser = await Admin.findOne(
        {reset_password_token:token},
        { _id: 1 }
    );
    
    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('PASSWORD-RESET-TOKEN'));    
   
    return res.status(responseCode.CODES.SUCCESS.OK).send(existingUser);

}

exports.changePassword = async (req, res) => {

    const { user_id, old_password, password } = req.body

   //checking unique email
   let existingUser = await Admin.findOne(
        {_id:user_id}
    );
    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));  

    const encryptedOldPassword = await adminObject.encryptPassword(existingUser, old_password);//encrypted password
    const encryptedPassword = await adminObject.encryptPassword(existingUser, password);//encrypted password


    if(encryptedOldPassword != existingUser.password){
        return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('OLD-NEW-PASSWORD-MISMATCH'));
    }

    if(encryptedPassword == existingUser.password){
        return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('USE-ANOTHER-PASSWORD'));
    }

    

    await Admin.findOneAndUpdate({ email: existingUser.email }, { $set: { password: encryptedPassword, modified_at:new Date() } }, { new: true })
    return res.status(responseCode.CODES.SUCCESS.OK).send(true);

}

exports.forgotPassword = async (req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { email } = req.body

   //checking unique email
   let existingUser = await Admin.findOne(
        {email:email},
        { name:1, email:1, salt_key: 1 }
    );
    //console.log('salt_key',existingUser.salt_key);
    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    const resetPasswordToken = await adminObject.generateResetPasswordToken(existingUser.salt_key);//generate reset password token 

    await Admin.findOneAndUpdate({ email: existingUser.email }, { $set: { reset_password_token: resetPasswordToken, modified_at:new Date() } }, { new: true })

    const link = `${config.get('webEndPointAdmin')}/reset-password/${resetPasswordToken}`

    const msg = {
        to: existingUser.email,
        from: config.get('sendgrid.from'),
        subject: req.polyglot.t('FORGOT-PASSWORD'),
       // text: req.polyglot.t('YOU-ARE-IN'),
        html: `Hi ${existingUser.name},<br>Here’s your forgot password <a href="${link}">link</a>.<br> 
        <br>
        Let me know if you need anything.<br> 
        <br>
        Thanks.`,
    };
    sgMail.send(msg);
    
    // Since all the validations passed, we send the emailSent message
    return res.status(responseCode.CODES.SUCCESS.OK).send(existingUser); 
}

exports.updatePassword = async (req, res) => {

    console.log('req',req.body);
    // If no validation errors, get the req.body objects that were validated and are needed
    const { token, password } = req.body

    //checking unique email
    let existingUser = await Admin.findOne(
        {reset_password_token:token},
        { _id: 1, email:1, salt_key:1, created_at:1 }
    );
    
    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));    
   
    const encryptedPassword = await adminObject.encryptPassword(existingUser, password);//encrypted password

    if(encryptedPassword == existingUser.password){
        return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('USE-ANOTHER-PASSWORD'));
    }
    
    await Admin.findOneAndUpdate({ email: existingUser.email }, { $set: { password: encryptedPassword, modified_at:new Date(), reset_password_token:'' } }, { new: true })

    return res.status(responseCode.CODES.SUCCESS.OK).send(existingUser);

}

exports.addUpdateAdmin = async (req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { type } = req.body

    if (_.has(req.body, ['id']) && (req.body.id)){    
        //checking unique Admin
        let existingType = await Admin.findOne(
            {_id:mongoose.Types.ObjectId(req.body.id)},
            { _id: 1 }
        );
        
        if (!existingType) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));     

        //save Admin 
        Admin.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.id) }, { $set: req.body }, { new: true }, function (err, type) {
            
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));        
                
            return res.status(responseCode.CODES.SUCCESS.OK).send(type);        
            
        });
    }else{
        //checking unique Admin
        let existingType = await Admin.findOne(
            {email:req.body.email},
            { _id: 1 }
        );
        
        if (existingType) return res.status(400).send(req.polyglot.t('EMAIL-EXIST'));     

        //save Admin 
        newType = new Admin(_.pick(req.body, ['name','email', 'password','is_active', 'is_verified','salt_key', 'created_at','modified_at']));
        
        newType.save(async function (err, type) {
            
            if (err) return res.status(500).send(err);        
                
            const msg = {
                to: req.body.email,
                from: config.get('sendgrid.from'),
                subject: req.polyglot.t('REGISTER-SUCCESSFULL'),
                text: req.polyglot.t('YOU-ARE-IN'),
                html: `Hi ${req.body.name},<br>You have been added as a admin. So please login with below login details:!<br> 
               
                Email:${req.body.email}
                Password:${req.body.password}
                Link: ${config.get('webEndPointAdmin')}
                <br>
                Let me know if you need anything.<br> 
                <br>
                Thanks.`,
            };
            sgMail.send(msg);

            return res.status(responseCode.CODES.SUCCESS.OK).send(type);        
            
        });
    }

    
}
exports.changePropertyStatus = async(req, res) => {
    let property = await Property.findOne({ "_id": req.body.propertyID}, { _id: 1 });

    if (!property) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('NO-RECORD-FOUND'));

    await Property.findOneAndUpdate({ "_id": req.body.propertyID }, { $set: { save_as: req.body.status, modified_at:new Date()} }, { new: true })

    return res.status(responseCode.CODES.SUCCESS.OK).send(property);
}


exports.dashboard = async (req, res) => {
    const propertiesCount = await Property.countDocuments({});
    const userCount = await User.countDocuments({});
    const cityCount = await City.countDocuments({});
    const neighboursCount = await Neighbourhood.countDocuments({});
    const propertiesToActionCount = await Property.countDocuments({save_as:'IN-REVIEW'});
    return res.status(responseCode.CODES.SUCCESS.OK).send({
        data:{
            propertiesCount,
            userCount,cityCount,
            neighboursCount,
            propertiesToActionCount
        }
        
    });
    
}


exports.adminProfile = async (req, res) => {
    let admin = await Admin.findOne({ "_id": req.body.adminID});

    if (!admin) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('NO-RECORD-FOUND'));

    return res.status(responseCode.CODES.SUCCESS.OK).send(admin);

    
}

exports.updateProfile = async (req, res) => {
    
    // If no validation errors, get the req.body objects that were validated and are needed
    const { user_id, name, profile_pic } = req.body

   //checking unique email
   let existingUser = await Admin.findOne(
        {_id:user_id}
    );
    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));  


    existingUser.name = name;  
    existingUser.profile_pic = profile_pic 
    existingUser.modified_at = new Date()    
    existingUser.save(function (err, user) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));   
        // todo: don't forget to handle err

        return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(existingUser, ['_id']));
    });


    
}


/*exports.deleteProperty = async(req, res) => {

    let property = await Property.findOne({ "_id": req.body.propertyID}, { _id: 1 });

    if (!property) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('NO-RECORD-FOUND'));


    let propertyViewCount = await Pageview.findOne(
        {property_id: req.body.propertyID},
        { _id: 1 }
    );

    

    if (propertyViewCount ) return res.status(responseCode.CODES.SUCCESS.OK).send(false);

    if (!propertyViewCount){
        //remove Property
        Property.deleteOne({ _id: req.body.propertyID }, function (err, result) {
            if (err) return res.status(responseCode.CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).send(err.messege)

            Activity.create({
                property_id:req.body.propertyID,
                action:'property added by admin',           
            });

            return res.status(responseCode.CODES.SUCCESS.OK).send(true);   
        });
    }
    
}*/


