const _ = require('lodash'); 
const config = require('config');
const { User } = require('../schema/user');
const { Dashboard } = require('../schema/dashboard');
const { Contact } = require('../schema/contact');
const { Office } = require('../schema/office');
const responseCode = require('../utilities/responseCode');
const userObject = new User();
const nodemailer = require("nodemailer");

exports.emailExist = async (req, res) => {

    
    // If no validation errors, get the req.body objects that were validated and are needed
    const { email } = req.body

    //checking unique email
    let existingUser = await User.findOne(
        {email:email},
        { _id: 1 }
    );
    console.log('existingUser',existingUser)
    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));    
   
    return res.status(responseCode.CODES.SUCCESS.OK).send(existingUser);

}

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

    user = await User.findOne({ "email": email  },{ email: 1, role:1, salt_key:1, created_at: 1, password:1, is_active:1 });
    if (!user) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));  

    //checking password match
    const isValidPassword = await userObject.passwordCompare(user.salt_key, user.password, req.body.password);

    if (!isValidPassword) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('PASSWORD-MISMATCH'));

    if (user['is_active']!='ACTIVE') return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('USER-NOT-ACTIVE'));
    

   
    const token = await userObject.generateToken(user.salt_key);//generate token
    console.log('token',token);

    await User.findOneAndUpdate({ _id: user._id }, { $set: { auth_token: token } }, { new: true })

    

    res.setHeader('x-mentordex-auth-token', token);
    res.header('Access-Control-Expose-Headers', 'x-mentordex-auth-token')   
    
    return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(user, ['_id','name','email', 'role']));    
   
}


/*
* Here we would probably call the DB to confirm the user exists
* Then validate if they're authorized to login
* Create a JWT or a cookie
* Send an email to that address with the URL to login directly to change their password
* And finally let the user know their email is waiting for them at their inbox
*/
exports.forgotPassword = async (req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { email } = req.body

   //checking unique email
   let existingUser = await User.findOne(
        {email:email},
        { name:1, email:1, salt_key: 1 }
    );
    //console.log('salt_key',existingUser.salt_key);
    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    const resetPasswordToken = await userObject.generateResetPasswordToken(existingUser.salt_key);//generate reset password token 

    await User.findOneAndUpdate({ email: existingUser.email }, { $set: { reset_password_token: resetPasswordToken, modified_at:new Date() } }, { new: true })

    const link = `${config.get('webEndPoint')}/authorization/reset-password/${resetPasswordToken}`

    const msg = {
        to: existingUser.email,        
        subject: req.polyglot.t('FORGOT-PASSWORD'),
       // text: req.polyglot.t('YOU-ARE-IN'),
        html: `Hi ,<br>Here’s your forgot password <a href="${link}">link</a>.<br> 
        <br>
        Let me know if you need anything.<br> 
        <br>
        Thanks.`,
    };
    sendEmail(msg.to, msg.subject, msg.html);
    
    // Since all the validations passed, we send the emailSent message
    return res.status(responseCode.CODES.SUCCESS.OK).send(existingUser); 
}



/*
* Here we would probably call the DB to confirm the user exists
* Then validate if they're authorized to login
* Create a JWT or a cookie
* Send an email to that address with the URL to login directly to change their password
* And finally let the user know their email is waiting for them at their inbox
*/
exports.signup = async (req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { email } = req.body

    //checking unique email
    let existingUser = await User.findOne(
        {email:email},
        { _id: 1 }
    );
    
    if (existingUser) return res.status(400).send(req.polyglot.t('EMAIL-EXIST'));    
   

    //save user 
    newUser = new User(_.pick(req.body, ['name','email', 'password','role', 'account_type', 'is_active', 'is_verified','salt_key', 'device_data', 'created_at','modified_at']));


    
    newUser.save(async function (err, user) {
        
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));   

        const token = await userObject.generateToken(user.salt_key);//generate token
        //console.log('token',token);

        await User.findOneAndUpdate({ _id: user._id }, { $set: { auth_token: token } }, { new: true })

        const msg = {
            to: user.email,
            from: config.get('sendgrid.from'),
            subject: req.polyglot.t('REGISTER-SUCCESSFULL'),
            text: req.polyglot.t('YOU-ARE-IN'),
            html: `Hi ${user.name},<br>You have joined a community of online property agent/agency just like you!<br> 
            <br>
            Let me know if you need anything.<br> 
            <br>
            Thanks.`,
        };
        sgMail.send(msg);

        res.setHeader('x-mentordex-auth-token', token);
        res.header('Access-Control-Expose-Headers', 'x-mentordex-auth-token')   
        
        return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(user, ['_id','name','email', 'role']));

        //return res.status(200).send(userInfo);
        
    });



}



exports.userProfileData = async (req, res) => {

    console.log('req',req.body);
    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID } = req.body

    //checking unique email
    let existingUser = await User.findOne(
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
    let existingUser = await User.findOne(
        {reset_password_token:token},
        { _id: 1 }
    );
    
    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('PASSWORD-RESET-TOKEN'));    
   
    return res.status(responseCode.CODES.SUCCESS.OK).send(existingUser);

}

exports.updatePassword = async (req, res) => {

    console.log('req',req.body);
    // If no validation errors, get the req.body objects that were validated and are needed
    const { token, password } = req.body

    //checking unique email
    let existingUser = await User.findOne(
        {reset_password_token:token},
        { _id: 1, email:1, salt_key:1, created_at:1 }
    );
    
    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));    
   
    const encryptedPassword = await userObject.encryptPassword(existingUser, password);//encrypted password

    
    
    await User.findOneAndUpdate({ email: existingUser.email }, { $set: { password: encryptedPassword, modified_at:new Date(), reset_password_token:'' } }, { new: true })

    return res.status(responseCode.CODES.SUCCESS.OK).send(existingUser);

}
exports.updateProfileInformation = async (req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { user_id, name, office_phone, fax, mobile, address, about_me, profile_pic } = req.body

   //checking unique email
   let existingUser = await User.findOne(
        {_id:user_id}
    );
    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));  


    existingUser.name = name;
    existingUser.fax = fax;
    existingUser.mobile = mobile;
    existingUser.office_phone = office_phone
    existingUser.profile_pic = profile_pic
    existingUser.address = address
    existingUser.about_me = about_me
    existingUser.save(function (err, user) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));   
        // todo: don't forget to handle err

        return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(user, ['_id']));
    });

}


exports.updateMedia = async (req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { user_id, skype, website, facebook, twitter, linkedin, instagram, google_plus, youtube, pinterest, vimeo } = req.body

   //checking unique email
   let existingUser = await User.findOne(
        {_id:user_id}
    );
    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));  


    existingUser.skype = skype;
    existingUser.website = website;
    existingUser.facebook = facebook;
    existingUser.twitter = twitter
    existingUser.linkedin = linkedin
    existingUser.instagram = instagram
    existingUser.google_plus = google_plus
    existingUser.youtube = youtube
    existingUser.pinterest = pinterest
    existingUser.vimeo = vimeo
    existingUser.save(function (err, user) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));   
        // todo: don't forget to handle err

        return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(user, ['_id']));
    });

}

exports.changePassword = async (req, res) => {

    const { user_id, old_password, password } = req.body

   //checking unique email
   let existingUser = await User.findOne(
        {_id:user_id}
    );
    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));  

    const encryptedOldPassword = await userObject.encryptPassword(existingUser, old_password);//encrypted password
    const encryptedPassword = await userObject.encryptPassword(existingUser, password);//encrypted password


    if(encryptedOldPassword != existingUser.password){
        return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('OLD-NEW-PASSWORD-MISMATCH'));
    }

    if(encryptedPassword == existingUser.password){
        return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('USE-ANOTHER-PASSWORD'));
    }

    

    await User.findOneAndUpdate({ email: existingUser.email }, { $set: { password: encryptedPassword, modified_at:new Date() } }, { new: true })
    return res.status(responseCode.CODES.SUCCESS.OK).send(true);

}


exports.contact = async (req, res) => {

    const { user_id } = req.body

   //checking unique email
   let existingUser = await User.findOne(
        {_id:user_id}
    );
    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));  

    newContact = new Contact(_.pick(req.body, ['user_id','email', 'name','phone', 'message',  'created_at']));
    
    newContact.save(function (err, contact) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));   
        // todo: don't forget to handle err

        Dashboard.findOneAndUpdate({ user_id: user_id }, { $inc: { contact_request_count: 1 } }, { new: true, upsert: true },function(err, data){
                    
        })

        const msg = {
            to: existingUser.email,
            from: config.get('sendgrid.from'),
            subject: req.polyglot.t('CONTACT-REQUEST'),          
            html: `Hi ${existingUser.name},<br>You have received a new contact request.<br> 
            <br>
            
            Let me know if you need anything.<br> 
            <br>
            Thanks.`,
        };
        sgMail.send(msg);



        return res.status(responseCode.CODES.SUCCESS.OK).send(true);
    });

}

exports.contactToAdmin = async (req, res) => {

    
    const msg = {
        to: config.get('webAdminEmail'),
        from: config.get('sendgrid.from'),
        subject: req.polyglot.t('CONTACT-REQUEST'),          
        html: `Hi Admin,<br>You have received a new contact request.<br> 
        <br>
        
        Let me know if you need anything.<br> 
        <br>
        Thanks.`,
    };
    sgMail.send(msg);



    return res.status(responseCode.CODES.SUCCESS.OK).send(true);

}

exports.officeListing = async (req, res) => {

    
    Office.find({}, function(err, result) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR')); 

        return res.status(responseCode.CODES.SUCCESS.OK).send(result);  
    });
   
}

exports.memberListing = async (req, res) => {

  

    const { search, size, pageNumber, sort_dir } = req.body
    let condition = {};
    condition['is_active'] =  'ACTIVE';
    condition['is_verified'] =  'VERIFIED';
    let sortBy={}
    sortBy['created_at'] =  (sort_dir=='asc')?-1:1
   

    if((search).length>0){     
        condition['name'] =  { $regex: search, $options: 'i' }   
    }
    
    
    let totalRecords = await User.count(condition);
    console.log('totalRecords',totalRecords);
    //calculating the limit and skip attributes to paginate records
    let totalPages = totalRecords / size;
    console.log('totalPages',totalPages);
    let start = pageNumber * size;
  
    let skip = (parseInt(pageNumber) * parseInt(size)) - parseInt(size);
    let limit = parseInt(size);
  
    
  //  let members = await User.find(condition).skip(skip).limit(limit).sort(sortBy);

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
                'email':1, 
                'fax':1, 
                'mobile':1, 
                'office_phone':1,
                'profile_pic':1,
                'facebook':1,
                'twitter':1,
                'instagram':1,
                'google_plus':1,
                'pinterest':1,
                'role':1,                
                'dashboard.property_count':1, 
            },
        },
        { $skip: skip },
        { $limit: limit }

 

      ], function(err, members){    
          
          let data = {
            records:members,
            total_records:totalRecords
          }
        return res.status(responseCode.CODES.SUCCESS.OK).send(data);
      })

   

   
}


async function sendEmail(to,subject,message){
    const transporter =  await nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
          user: '', // generated ethereal user
          pass: '', // generated ethereal password
        },
    });
   
    await transporter.sendMail({
        from: 'dexmentor@gmail.com', // sender address
        to: to, // list of receivers
        subject: subject, // Subject line
        //text: "rererere world?", // plain text body
        html: message, // html body
    });
}

