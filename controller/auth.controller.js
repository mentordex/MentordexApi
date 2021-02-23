const _ = require('lodash');
const config = require('config');
const { User } = require('../schema/user');
const { Dashboard } = require('../schema/dashboard');
const { Contact } = require('../schema/contact');
const { Office } = require('../schema/office');
const { Team } = require('../schema/team');
const responseCode = require('../utilities/responseCode');
const userObject = new User();
const nodemailer = require("nodemailer");
var mongoose = require('mongoose');

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(config.get('sendgrid.key'));

const upload = require("../utilities/upload");
const singleUpload = upload.single("file");

templates = {
    mentor_signup: "d-a17aa33d0e4045aea26bd661787db861",
    mentor_verify_email: "d-7740a854506f4289926f78de2ced3951",
    forgot_password: "d-ed1b699311b046358f8946a6a253d19e"
};


exports.emailExist = async(req, res) => {


    // If no validation errors, get the req.body objects that were validated and are needed
    const { email } = req.body

    //checking unique email
    let existingUser = await User.findOne({ email: email }, { _id: 1 });
    //console.log('existingUser', existingUser)
    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('EMAIL-NOT-EXIST'));

    return res.status(responseCode.CODES.SUCCESS.OK).send(existingUser);

}

/*
 * Here we would probably call the DB to confirm the user exists
 * Then validate if they're authorized to login
 * Then confirm their password
 * Create a JWT or a cookie
 * And finally send it back if all's good
 */
exports.login = async(req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { email, password } = req.body

    user = await User.findOne({ "email": email }, { email: 1, role: 1, salt_key: 1, created_at: 1, password: 1, is_active: 1, is_email_verified: 1, is_phone_verified: 1, admin_status: 1 });

    if (!user) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('EMAIL-NOT-EXIST'));

    //checking password match
    const isValidPassword = await userObject.passwordCompare(user.salt_key, user.password, req.body.password);

    if (!isValidPassword) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('PASSWORD-INVALID'));


    const token = await userObject.generateToken(user.salt_key); //generate token

    //console.log(user)

    if (user.role == 'MENTOR') {
        // If Email Address not verified for mentor
        if (user.is_email_verified == 'NOT-VERIFIED') {

            const email_token = await userObject.generateToken(user.salt_key); //generate token
            const verify_link = `${config.get('webEndPoint')}/mentor/verify-email/${user._id}/${email_token}`

            await User.findOneAndUpdate({ _id: user._id }, { $set: { email_token: email_token } }, { new: true })

            const msg = {
                to: user.email,
                from: config.get('sendgrid.from'),
                templateId: templates['mentor_verify_email'],
                dynamic_template_data: {
                    name: user.first_name + ' ' + user.last_name,
                    verify_link: verify_link,
                    email: user.email
                }
            };
            sgMail.send(msg, (error, result) => {
                if (error) {
                    console.log(error);
                } else {
                    console.log("That's wassup!");
                }
            });

            return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('VERIFY-EMAIL'));

        }
        // If Email Address not verified for mentor

        // If Phone not verified for mentor
        else if (user.is_phone_verified == 'NOT-VERIFIED') {
            const phone_token = '0000';

            await User.findOneAndUpdate({ _id: user._id }, { $set: { phone_token: phone_token } }, { new: true })

            return res.status(responseCode.CODES.SUCCESS.OK).send({ message: req.polyglot.t('VERIFY-PHONE'), verify_phone: false, _id: user._id });

            //return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('VERIFY-PHONE'));
        }
        // If Phone not verified for mentor
        else {

            await User.findOneAndUpdate({ _id: user._id }, { $set: { auth_token: token } }, { new: true })

            res.setHeader('x-mentordex-auth-token', token);
            res.header('Access-Control-Expose-Headers', 'x-mentordex-auth-token')

            if (user['is_active'] == 'IN-ACTIVE') {

                return res.status(responseCode.CODES.SUCCESS.OK).send({ message: req.polyglot.t('USER-NOT-ACTIVE'), is_active: false, _id: user._id, first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role, admin_status: user.admin_status });

            } else {

                return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(user, ['_id', 'first_name', 'last_name', 'email', 'role', 'admin_status']));
            }
        }


    } else {
        // IF ROLE = PARENT

        if (user['is_active'] == 'IN-ACTIVE') return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('USER-NOT-ACTIVE'));

        await User.findOneAndUpdate({ _id: user._id }, { $set: { auth_token: token } }, { new: true })

        res.setHeader('x-mentordex-auth-token', token);
        res.header('Access-Control-Expose-Headers', 'x-mentordex-auth-token')

        return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(user, ['_id', 'first_name', 'last_name', 'email', 'role']));

    }

}

exports.updateParentInfo = async(req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const user_id = mongoose.Types.ObjectId(req.body['user_id']);

    //checking unique email
    let existingUser = await User.findOne({ _id: user_id });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    var userInfo = {}
    userInfo['modified_at'] = new Date()
    if ('state_id' in req.body && (req.body.state_id).length > 0) {
        userInfo['state_id'] = req.body.state_id
    }
    if ('city_id' in req.body && (req.body.city_id).length > 0) {
        userInfo['city_id'] = req.body.city_id
    }
    if ('zipcode' in req.body && (req.body.zipcode).length > 0) {
        userInfo['zipcode'] = req.body.zipcode
    }
    if ('category_id1' in req.body && (req.body.category_id1).length > 0) {
        userInfo['category_id1'] = req.body.category_id1
    }
    if ('subcategory_id1' in req.body && (req.body.subcategory_id1).length > 0) {
        userInfo['subcategory_id1'] = req.body.subcategory_id1
    }
    if ('category_id2' in req.body && (req.body.category_id2).length > 0) {
        userInfo['category_id2'] = req.body.category_id2
    }
    if ('subcategory_id2' in req.body && (req.body.subcategory_id2).length > 0) {
        userInfo['subcategory_id2'] = req.body.subcategory_id2
    }
    if ('category_id3' in req.body && (req.body.category_id3).length > 0) {
        userInfo['category_id3'] = req.body.category_id3
    }
    if ('subcategory_id3' in req.body && (req.body.subcategory_id3).length > 0) {
        userInfo['subcategory_id3'] = req.body.subcategory_id3
    }


    await User.findOneAndUpdate({ _id: user_id }, { $set: userInfo }, { new: true })
    return res.status(responseCode.CODES.SUCCESS.OK).send(true);
}

/*
 * Here we would probably call the DB to confirm the user exists
 * Then validate if they're authorized to login
 * Create a JWT or a cookie
 * Send an email to that address with the URL to login directly to change their password
 * And finally let the user know their email is waiting for them at their inbox
 */
exports.forgotPassword = async(req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { email } = req.body

    //checking unique email
    let existingUser = await User.findOne({ email: email });
    //console.log('salt_key',existingUser.salt_key);
    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('EMAIL-NOT-EXIST'));

    const resetPasswordToken = await userObject.generateRandomToken(existingUser.salt_key); //generate reset password token 

    await User.findOneAndUpdate({ email: existingUser.email }, { $set: { reset_password_token: resetPasswordToken, modified_at: new Date() } }, { new: true })

    const link = `${config.get('webEndPoint')}/authorization/reset-password/${resetPasswordToken}`



    const msg = {
        to: existingUser.email,
        from: config.get('sendgrid.from'),
        templateId: templates['forgot_password'],
        dynamic_template_data: {
            name: existingUser.first_name + ' ' + existingUser.last_name,
            reset_password_link: link
        }
    };
    sgMail.send(msg, (error, result) => {
        if (error) {
            console.log(error);
        } else {
            console.log("That's wassup!");
        }
    });


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
exports.signup = async(req, res) => {


    //console.log(req.body);

    // If no validation errors, get the req.body objects that were validated and are needed
    const { email } = req.body

    //checking unique email
    let existingUser = await User.findOne({ email: email }, { _id: 1 });

    if (existingUser) return res.status(400).send(req.polyglot.t('EMAIL-EXIST'));


    //save user 
    newUser = new User(_.pick(req.body, ['first_name', 'last_name', 'email', 'password', 'phone', 'phone_token', 'email_token', 'country_id', 'state_id', 'city_id', 'zipcode', 'role', 'account_type', 'is_active', 'is_email_verified', 'is_phone_verified', 'salt_key', 'device_data', 'created_at', 'modified_at', 'admin_status']));



    newUser.save(async function(err, user) {

        if (err) {
            console.log(err);
            return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
        }

        const token = await userObject.generateToken(user.salt_key); //generate AUTH token

        if (user.role == 'MENTOR') {

            const email_token = await userObject.generateToken(user.salt_key); //generate token
            const phone_token = '0000';

            const verify_link = `${config.get('webEndPoint')}/mentor/verify-email/${user._id}/${email_token}`
                //console.log('token',token);

            await User.findOneAndUpdate({ _id: user._id }, { $set: { auth_token: token, email_token: email_token, phone_token: phone_token } }, { new: true })

            const msg = {
                to: user.email,
                from: config.get('sendgrid.from'),
                templateId: templates['mentor_signup'],
                dynamic_template_data: {
                    name: user.first_name + ' ' + user.last_name,
                    verify_link: verify_link,
                    email: user.email
                }
            };
            sgMail.send(msg, (error, result) => {
                if (error) {
                    console.log(error);
                } else {
                    console.log("That's wassup!");
                }
            });

            return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(user, ['_id', 'first_name', 'last_name', 'email', 'role']));


        } else {
            // IF Role = PARENT
            await User.findOneAndUpdate({ _id: user._id }, { $set: { auth_token: token, is_active: 'ACTIVE' } }, { new: true })

            res.setHeader('x-mentordex-auth-token', token);
            res.header('Access-Control-Expose-Headers', 'x-mentordex-auth-token')

            //return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(user, ['_id', 'first_name', 'last_name', 'email', 'role']));
            return res.status(responseCode.CODES.SUCCESS.OK).send(user);
        }

    });

}

/*
 * Here we would probably call the DB to confirm the user exists
 * Then validate if they're authorized to login
 * Create a JWT or a cookie
 * Send an email to that address with the URL to login directly to change their password
 * And finally let the user know their email is waiting for them at their inbox
 */
exports.checkEmailExists = async(req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { email } = req.body

    //checking unique email
    let existingUser = await User.findOne({ email: email }, { _id: 1 });

    if (existingUser) {
        return res.status(400).send(req.polyglot.t('EMAIL-EXIST'))
    } else {
        return res.status(responseCode.CODES.SUCCESS.OK).send(existingUser);
    }
}

exports.userProfileData = async(req, res) => {


    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));


    return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(existingUser, ['_id', 'name', 'email', 'office_phone', 'fax', 'profile_pic', 'mobile', 'address', 'about_me', 'skype', 'website', 'facebook', 'twitter', 'linkedin', 'instagram', 'google_plus', 'youtube', 'pinterest', 'vimeo', 'role', 'created_at']));



}

exports.verifyToken = async(req, res) => {

    //console.log('req', req.body);
    // If no validation errors, get the req.body objects that were validated and are needed
    const { token } = req.body

    //checking unique email
    let existingUser = await User.findOne({ reset_password_token: token }, { _id: 1 });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('VERIFICATION-FAILED'));

    await User.findOneAndUpdate({ _id: existingUser._id }, { $set: { reset_password_token: '' } }, { new: true })

    return res.status(responseCode.CODES.SUCCESS.OK).send(existingUser);

}

exports.updatePassword = async(req, res) => {

    //console.log('req', req.body);
    // If no validation errors, get the req.body objects that were validated and are needed
    const { id, password } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: id }, { _id: 1, email: 1, salt_key: 1, created_at: 1 });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    const { encryptedPassword, salt } = await userObject.encryptPassword(existingUser, password); //encrypted password



    await User.findOneAndUpdate({ email: existingUser.email }, { $set: { salt_key: salt, password: encryptedPassword, modified_at: new Date(), reset_password_token: '' } }, { new: true })

    return res.status(responseCode.CODES.SUCCESS.OK).send(existingUser);

}

exports.updateProfileInformation = async(req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { user_id, name, office_phone, fax, mobile, address, about_me, profile_pic } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: user_id });
    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));


    existingUser.name = name;
    existingUser.fax = fax;
    existingUser.mobile = mobile;
    existingUser.office_phone = office_phone
    existingUser.profile_pic = profile_pic
    existingUser.address = address
    existingUser.about_me = about_me
    existingUser.save(function(err, user) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
        // todo: don't forget to handle err

        return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(user, ['_id']));
    });

}

exports.updateMedia = async(req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { user_id, skype, website, facebook, twitter, linkedin, instagram, google_plus, youtube, pinterest, vimeo } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: user_id });
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
    existingUser.save(function(err, user) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
        // todo: don't forget to handle err

        return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(user, ['_id']));
    });

}

exports.changePassword = async(req, res) => {

    const { user_id, old_password, password } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: user_id });
    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    const encryptedOldPassword = await userObject.encryptPassword(existingUser, old_password); //encrypted password
    const encryptedPassword = await userObject.encryptPassword(existingUser, password); //encrypted password


    if (encryptedOldPassword != existingUser.password) {
        return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('OLD-NEW-PASSWORD-MISMATCH'));
    }

    if (encryptedPassword == existingUser.password) {
        return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('USE-ANOTHER-PASSWORD'));
    }



    await User.findOneAndUpdate({ email: existingUser.email }, { $set: { password: encryptedPassword, modified_at: new Date() } }, { new: true })
    return res.status(responseCode.CODES.SUCCESS.OK).send(true);

}

exports.contact = async(req, res) => {

    const { user_id } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: user_id });
    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    newContact = new Contact(_.pick(req.body, ['user_id', 'email', 'name', 'phone', 'message', 'created_at']));

    newContact.save(function(err, contact) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
        // todo: don't forget to handle err

        Dashboard.findOneAndUpdate({ user_id: user_id }, { $inc: { contact_request_count: 1 } }, { new: true, upsert: true }, function(err, data) {

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

exports.contactToAdmin = async(req, res) => {


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

exports.officeListing = async(req, res) => {


    Office.find({}, function(err, result) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

        return res.status(responseCode.CODES.SUCCESS.OK).send(result);
    });

}


exports.teamListing = async(req, res) => {


    Team.find({}, function(err, result) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

        return res.status(responseCode.CODES.SUCCESS.OK).send(result);
    });

}


exports.memberListing = async(req, res) => {



    const { search, size, pageNumber, sort_dir } = req.body
    let condition = {};
    condition['is_active'] = 'ACTIVE';
    condition['is_verified'] = 'VERIFIED';
    let sortBy = {}
    sortBy['created_at'] = (sort_dir == 'asc') ? -1 : 1


    if ((search).length > 0) {
        condition['name'] = { $regex: search, $options: 'i' }
    }


    let totalRecords = await User.count(condition);
    console.log('totalRecords', totalRecords);
    //calculating the limit and skip attributes to paginate records
    let totalPages = totalRecords / size;
    console.log('totalPages', totalPages);
    let start = pageNumber * size;

    let skip = (parseInt(pageNumber) * parseInt(size)) - parseInt(size);
    let limit = parseInt(size);


    //  let members = await User.find(condition).skip(skip).limit(limit).sort(sortBy);

    User.aggregate([{
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
                'name': 1,
                'email': 1,
                'fax': 1,
                'mobile': 1,
                'office_phone': 1,
                'profile_pic': 1,
                'facebook': 1,
                'twitter': 1,
                'instagram': 1,
                'google_plus': 1,
                'pinterest': 1,
                'role': 1,
                'dashboard.property_count': 1,
            },
        },
        { $skip: skip },
        { $limit: limit }



    ], function(err, members) {

        let data = {
            records: members,
            total_records: totalRecords
        }
        return res.status(responseCode.CODES.SUCCESS.OK).send(data);
    })




}

/* Mentor Functions */

exports.getMentorDetails = async(req, res) => {


    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    return res.status(responseCode.CODES.SUCCESS.OK).send(existingUser);

}

exports.resendMentorPhoneVerification = async(req, res) => {
    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID, phoneToken } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    await User.findOneAndUpdate({ _id: existingUser._id }, { $set: { phone_token: '0000' } }, { new: true })

    return res.status(responseCode.CODES.SUCCESS.OK).send(existingUser);
}

exports.submitMentorPhoneVerification = async(req, res) => {
    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID, phoneToken } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    if (phoneToken != existingUser.phone_token) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('OTP-INVALID'));

    await User.findOneAndUpdate({ _id: existingUser._id }, { $set: { phone_token: '', is_phone_verified: 'VERIFIED' } }, { new: true })

    return res.status(responseCode.CODES.SUCCESS.OK).send(existingUser);
}

exports.verifyMentorEmail = async(req, res) => {
    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID, emailToken } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    if (emailToken != existingUser.email_token) return res.status(responseCode.CODES.SUCCESS.OK).send({ message: req.polyglot.t('EMAIL-VERIFY-FAILED'), email_verify: false });

    await User.findOneAndUpdate({ _id: existingUser._id }, { $set: { email_token: '', is_email_verified: 'VERIFIED' } }, { new: true })

    return res.status(responseCode.CODES.SUCCESS.OK).send(existingUser);
}

exports.resendMentorEmailVerification = async(req, res) => {
    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    const email_token = await userObject.generateRandomToken(existingUser.salt_key); //generate token

    const verify_link = `${config.get('webEndPoint')}/mentor/verify-email/${existingUser._id}/${email_token}`;

    await User.findOneAndUpdate({ _id: existingUser._id }, { $set: { email_token: email_token } }, { new: true })

    const msg = {
        to: existingUser.email,
        from: config.get('sendgrid.from'),
        templateId: templates['mentor_verify_email'],
        dynamic_template_data: {
            name: existingUser.first_name + ' ' + existingUser.last_name,
            verify_link: verify_link,
            email: existingUser.email
        }
    };
    sgMail.send(msg, (error, result) => {
        if (error) {
            console.log(error);
        } else {
            console.log("That's wassup!");
        }
    });

    return res.status(responseCode.CODES.SUCCESS.OK).send(existingUser);
}

exports.onCompleteMentorApplication = async(req, res) => {
    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    // If Email Address not verified for mentor
    if (existingUser.is_email_verified == 'NOT-VERIFIED') {

        const email_token = await userObject.generateToken(existingUser.salt_key); //generate token
        const verify_link = `${config.get('webEndPoint')}/mentor/verify-email/${existingUser._id}/${email_token}`

        await User.findOneAndUpdate({ _id: existingUser._id }, { $set: { email_token: email_token } }, { new: true })

        const msg = {
            to: existingUser.email,
            from: config.get('sendgrid.from'),
            templateId: templates['mentor_verify_email'],
            dynamic_template_data: {
                name: existingUser.first_name + ' ' + existingUser.last_name,
                verify_link: verify_link,
                email: existingUser.email
            }
        };
        sgMail.send(msg, (error, result) => {
            if (error) {
                console.log(error);
            } else {
                console.log("That's wassup!");
            }
        });

        return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('VERIFY-EMAIL'));

    }
    // If Email Address not verified for mentor

    // If Phone not verified for mentor
    else if (existingUser.is_phone_verified == 'NOT-VERIFIED') {
        const phone_token = '0000';

        await User.findOneAndUpdate({ _id: existingUser._id }, { $set: { phone_token: phone_token } }, { new: true })

        return res.status(responseCode.CODES.SUCCESS.OK).send({ message: req.polyglot.t('VERIFY-PHONE'), verify_phone: false, _id: existingUser._id });

        //return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('VERIFY-PHONE'));
    }
    // If Phone not verified for mentor
    else {

        const token = await userObject.generateToken(existingUser.salt_key); //generate token

        await User.findOneAndUpdate({ _id: existingUser._id }, { $set: { auth_token: token } }, { new: true })

        res.setHeader('x-mentordex-auth-token', token);
        res.header('Access-Control-Expose-Headers', 'x-mentordex-auth-token')

        return res.status(responseCode.CODES.SUCCESS.OK).send({ message: req.polyglot.t('USER-NOT-ACTIVE'), is_active: false, _id: existingUser._id, first_name: existingUser.first_name, last_name: existingUser.last_name, email: existingUser.email, role: existingUser.role });
    }
}

exports.updateBasicDetails = async(req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    //const user_id = mongoose.Types.ObjectId(req.body['user_id']);

    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID, gender, primary_language, dob, address1, address2, country_id, state_id, city_id, zipcode, social_links } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    existingUser.gender = gender;
    existingUser.primary_language = primary_language;
    existingUser.dob = dob;
    existingUser.address1 = address1
    existingUser.address2 = address2
    existingUser.country_id = country_id
    existingUser.state_id = state_id
    existingUser.city_id = city_id
    existingUser.zipcode = zipcode
    existingUser.social_links = social_links
    existingUser.save(function(err, user) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
        // todo: don't forget to handle err

        return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(user, ['_id']));
    });

}

exports.updateSkillsDetails = async(req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    //const user_id = mongoose.Types.ObjectId(req.body['user_id']);

    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID, category_id, subcategories } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    existingUser.category_id = category_id;
    existingUser.subcategories = subcategories;
    existingUser.save(function(err, user) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
        // todo: don't forget to handle err

        return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(user, ['_id']));
    });

}


exports.updateBookASlotDetails = async(req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    //const user_id = mongoose.Types.ObjectId(req.body['user_id']);

    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID, appointment_date, appointment_time, references, letter_of_recommendation } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    existingUser.appointment_date = appointment_date;
    existingUser.appointment_time = appointment_time;
    existingUser.references = references;
    existingUser.letter_of_recommendation = letter_of_recommendation;
    existingUser.admin_status = 'NEW';
    existingUser.save(function(err, user) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
        // todo: don't forget to handle err

        return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(user, ['_id']));
    });

}


exports.uploadPdf = async(req, res) => {

    singleUpload(req, res, function(err) {
        if (err) {
            //console.log('err', err)
            return res.status(responseCode.CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).send(err.message);
        }
        return res.status(responseCode.CODES.SUCCESS.OK).send({
            fileLocation: req.file.location,
            fileKey: req.file.key,
            fileName: req.file.originalname,
            fileMimeType: req.file.mimetype
        });
    });
}

async function sendEmail(to, subject, message) {
    const transporter = await nodemailer.createTransport({
        host: config.get('nodemailer.host'),
        port: config.get('nodemailer.port'),
        secure: config.get('nodemailer.secure'), // true for 465, false for other ports
        auth: {
            user: config.get('nodemailer.auth.user'), // generated ethereal user
            pass: config.get('nodemailer.auth.pass'), // generated ethereal password
        },
    });

    await transporter.sendMail({
        from: config.get('fromEmail'), // sender address
        to: to, // list of receivers
        subject: subject, // Subject line
        //text: "rererere world?", // plain text body
        html: message, // html body
    });
}