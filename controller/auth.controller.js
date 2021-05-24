const _ = require('lodash');
const config = require('config');
const { User } = require('../schema/user');
const { Dashboard } = require('../schema/dashboard');
const { Contact } = require('../schema/contact');
const { Office } = require('../schema/office');
const { Team } = require('../schema/team');
const { Category } = require('../schema/category');
const { Subcategory } = require('../schema/subcategory');
const { Transactions } = require('../schema/transactions');
const { Notifications } = require('../schema/notifications');
const { Review } = require('../schema/review');
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
    forgot_password: "d-ed1b699311b046358f8946a6a253d19e",
    appointment_reschedule: "d-0a29a6c2ba154b71b0bc1b961ec2719b",
    appointment_rejected: "d-c4c785901b23428bb7a62ca445195a0a",
    appointment_approved: "d-a257325a49104382b15fd6400eeb9b2c"
};

const aws = require('aws-sdk');
//console.log(config.get('aws.accessKey')+':'+config.get('aws.secretKey')+':'+config.get('aws.region')+':'+config.get('aws.bucket'))
aws.config.update({
    // Your SECRET ACCESS KEY from AWS should go here,
    // Never share it!
    // Setup Env Variable, e.g: process.env.SECRET_ACCESS_KEY
    secretAccessKey: config.get('aws.secretKey'),
    // Not working key, Your ACCESS KEY ID from AWS should go here,
    // Never share it!
    // Setup Env Variable, e.g: process.env.ACCESS_KEY_ID
    accessKeyId: config.get('aws.accessKey'),
    //region: config.get('aws.region'), // region of your bucket
});

const s3 = new aws.S3();

const stripe = require('stripe')(config.get('stripeConfig.sandboxSecretKey'));


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

    user = await User.findOne({ "email": email }, { email: 1, role: 1, salt_key: 1, created_at: 1, password: 1, first_name: 1, last_name: 1, is_active: 1, is_email_verified: 1, is_phone_verified: 1, admin_status: 1, subscription_status: 1 });

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
                //console.log(user);

                return res.status(responseCode.CODES.SUCCESS.OK).send({ message: req.polyglot.t('USER-NOT-ACTIVE'), is_active: false, _id: user._id, first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role, admin_status: user.admin_status, subscription_status: user.subscription_status });

            } else {

                return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(user, ['_id', 'first_name', 'last_name', 'email', 'role', 'admin_status', 'subscription_status']));
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
    if ('category1' in req.body && (req.body.category1).length > 0) {
        userInfo['category1'] = req.body.category1
    }
    if ('category2' in req.body && (req.body.category2).length > 0) {
        userInfo['category2'] = req.body.category2
    }
    if ('category3' in req.body && (req.body.category3).length > 0) {
        userInfo['category3'] = req.body.category3
    }
    if ('subcategory1' in req.body && (req.body.subcategory1).length > 0) {
        userInfo['subcategory1'] = req.body.subcategory1
    }
    if ('subcategory2' in req.body && (req.body.subcategory2).length > 0) {
        userInfo['subcategory2'] = req.body.subcategory2
    }
    if ('subcategory3' in req.body && (req.body.subcategory3).length > 0) {
        userInfo['subcategory3'] = req.body.subcategory3
    }
    if ('state' in req.body && (req.body.state).length > 0) {
        userInfo['state'] = req.body.state
    }
    if ('city' in req.body && (req.body.city).length > 0) {
        userInfo['city'] = req.body.city
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
    newUser = new User(_.pick(req.body, ['first_name', 'last_name', 'email', 'password', 'googleLoginId', 'phone', 'phone_token', 'email_token', 'country', 'state', 'city', 'country_id', 'state_id', 'city_id', 'zipcode', 'role', 'account_type', 'is_active', 'is_email_verified', 'is_phone_verified', 'salt_key', 'device_data', 'newsletter', 'created_at', 'modified_at', 'admin_status']));



    newUser.save(async function(err, user) {

        if (err) {
            //console.log(err);
            return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
        }

        const token = await userObject.generateToken(user.salt_key); //generate AUTH token

        if (user.role == 'MENTOR') {
            const phone_token = '0000';

            if (user.googleLoginId == '') {
                const email_token = await userObject.generateToken(user.salt_key); //generate token


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


            } else {

                await User.findOneAndUpdate({ _id: user._id }, { $set: { is_email_verified: 'VERIFIED', phone_token: phone_token } }, { new: true })
            }

            return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(user, ['_id', 'first_name', 'last_name', 'email', 'role']));


        } else {
            // IF Role = PARENT
            if (user.googleLoginId == '') {
                await User.findOneAndUpdate({ _id: user._id }, { $set: { auth_token: token, is_active: 'ACTIVE', admin_status: 'APPROVED' } }, { new: true })
            } else {
                await User.findOneAndUpdate({ _id: user._id }, { $set: { auth_token: token, is_active: 'ACTIVE', admin_status: 'APPROVED', is_email_verified: 'VERIFIED' } }, { new: true })
            }


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
 * Then confirm their password
 * Create a JWT or a cookie
 * And finally send it back if all's good
 */
exports.checkGoogleLogin = async(req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { email } = req.body

    user = await User.findOne({ "email": email }, { email: 1, role: 1, salt_key: 1, created_at: 1, password: 1, first_name: 1, last_name: 1, is_active: 1, is_email_verified: 1, is_phone_verified: 1, admin_status: 1, subscription_status: 1 });

    if (user) {
        const token = await userObject.generateToken(user.salt_key); //generate token
        //console.log(user)
        if (user.role == 'MENTOR') {
            // If Phone not verified for mentor
            if (user.is_phone_verified == 'NOT-VERIFIED') {
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
                    //console.log(user);

                    return res.status(responseCode.CODES.SUCCESS.OK).send({ message: req.polyglot.t('USER-NOT-ACTIVE'), is_active: false, _id: user._id, first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role, admin_status: user.admin_status, subscription_status: user.subscription_status });

                } else {

                    return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(user, ['_id', 'first_name', 'last_name', 'email', 'role', 'admin_status', 'subscription_status']));
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
    } else {
        return res.status(responseCode.CODES.SUCCESS.OK).send({ email: false });

    }

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
        return res.status(responseCode.CODES.SUCCESS.OK).send(true);
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


    Office.find({ is_active: true }, function(err, result) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

        return res.status(responseCode.CODES.SUCCESS.OK).send(result);
    });

}


exports.teamListing = async(req, res) => {


    Team.find({ is_active: true }, function(err, result) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

        return res.status(responseCode.CODES.SUCCESS.OK).send(result);
    });

}

exports.reviewListing = async(req, res) => {

    const { size, pageNumber } = req.body
    let condition = {};
    let sortBy = {};
    sortBy['created_at'] = 1
    condition['is_active'] = true

    let limit = 10


    let records = await Review.find(condition).sort(sortBy).skip(0).limit(limit);


    return res.status(responseCode.CODES.SUCCESS.OK).send(records);



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
    //console.log('totalPages', totalPages);
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

exports.getUserDetails = async(req, res) => {


    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(existingUser, ['_id', 'first_name', 'last_name', 'profile_image', 'subscription_status', 'admin_status']));

}

/* get Parent Function */
exports.getParentDetails = async(req, res) => {


    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(existingUser, ['_id', 'country', 'state', 'city', 'country_id', 'state_id', 'city_id', 'zipcode', 'subcategory_id1', 'subcategory_id2', 'subcategory_id3']));

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

exports.getMentorProfileDetails = async(req, res) => {


    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(existingUser, ['_id', 'country', 'state', 'city', 'category1', 'category2', 'category3', 'subcategory1', 'subcategory2', 'subcategory3', 'first_name', 'last_name', 'primary_language', 'rating', 'letter_of_recommendation', 'availability', 'academics', 'achievements', 'employments', 'profile_image', 'introduction_video', 'tagline', 'servicable_zipcodes', 'bio', 'hourly_rate', 'website', 'admin_status', 'subscription_status']));

}

exports.getMentorProfileDetailsById = async(req, res) => {

    let condition = {};
    let subcategoryArray = [];


    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID, mentorId } = req.body



    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));



    let getMentorDetails = await User.findOne({ _id: mentorId });

    return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(getMentorDetails, ['_id', 'academics', 'achievements', 'employments', 'profile_image', 'introduction_video', 'tagline', 'servicable_zipcodes', 'bio', 'hourly_rate', 'website', 'country', 'state', 'city', 'category1', 'category2', 'category3', 'subcategory1', 'subcategory2', 'subcategory3', 'first_name', 'last_name', 'primary_language', 'rating', 'letter_of_recommendation', 'availability']));



}

exports.getMentorSlotsByDate = async(req, res) => {

    let condition = {};
    let availableSlots = [];

    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID, mentorId, getSelectedDate } = req.body

    //console.log(req.body);


    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));


    condition['_id'] = mongoose.Types.ObjectId(mentorId);
    condition['availability.date'] = getSelectedDate;

    let getMentorSlots = await User.findOne(condition);

    //console.log(getMentorSlots);

    if (getMentorSlots != null) {
        //console.log(getMentorSlots.availability);


        availableSlots = getMentorSlots.availability.filter(function(el) {
            return el.date == getSelectedDate;
        });

        //console.log('availableSlots', availableSlots[0].slots)
        return res.status(responseCode.CODES.SUCCESS.OK).send({ availableSlots: availableSlots[0].slots });
    } else {
        return res.status(responseCode.CODES.SUCCESS.OK).send({ availableSlots: availableSlots });
    }





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
    const { userID, gender, primary_language, dob, address1, address2, country, state, city, country_id, state_id, city_id, zipcode, social_links } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    existingUser.gender = gender;
    existingUser.primary_language = primary_language;
    existingUser.dob = dob;
    existingUser.address1 = address1
    existingUser.address2 = address2
    existingUser.country = country
    existingUser.state = state
    existingUser.city = city
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
    const { userID, category1, category2, category3, subcategory1, subcategory2, subcategory3 } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    existingUser.category1 = category1;
    existingUser.category2 = category2;
    existingUser.category3 = category3;
    existingUser.subcategory1 = subcategory1;
    existingUser.subcategory2 = subcategory2;
    existingUser.subcategory3 = subcategory3;
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

exports.updateProfileBasicDetails = async(req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    //const user_id = mongoose.Types.ObjectId(req.body['user_id']);

    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID, profile_image, introduction_video, tagline, bio, servicable_zipcodes } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    existingUser.profile_image = profile_image;
    existingUser.introduction_video = introduction_video;
    existingUser.tagline = tagline;
    existingUser.bio = bio;
    existingUser.servicable_zipcodes = servicable_zipcodes;
    existingUser.save(function(err, user) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
        // todo: don't forget to handle err

        return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(user, ['_id']));
    });

}

exports.updateProfileAcademicHistoryDetails = async(req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    //const user_id = mongoose.Types.ObjectId(req.body['user_id']);

    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID, academics } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    existingUser.academics = academics;

    existingUser.save(function(err, user) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
        // todo: don't forget to handle err

        return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(existingUser, ['_id']));
    });

}

exports.updateProfileEmploymentHistoryDetails = async(req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    //const user_id = mongoose.Types.ObjectId(req.body['user_id']);

    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID, employments } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    existingUser.employments = employments;

    existingUser.save(function(err, user) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
        // todo: don't forget to handle err




        return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(existingUser, ['_id']));
    });

}

exports.updateProfileAchievementDetails = async(req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    //const user_id = mongoose.Types.ObjectId(req.body['user_id']);

    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID, achievements } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    existingUser.achievements = achievements;

    existingUser.save(function(err, user) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
        // todo: don't forget to handle err

        return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(existingUser, ['_id']));
    });

}

exports.updateProfileHourlyRateDetails = async(req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    //const user_id = mongoose.Types.ObjectId(req.body['user_id']);

    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID, hourly_rate, availability } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    existingUser.hourly_rate = hourly_rate;
    existingUser.availability = availability;
    existingUser.save(function(err, user) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
        // todo: don't forget to handle err

        return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(user, ['_id']));
    });

}

exports.updateProfileSocialLinksDetails = async(req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    //const user_id = mongoose.Types.ObjectId(req.body['user_id']);

    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID, website } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    existingUser.website = website;
    existingUser.save(function(err, user) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
        // todo: don't forget to handle err

        return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(user, ['_id']));
    });

}


exports.uploadFile = async(req, res) => {

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

exports.updateNotes = async(req, res) => {
    //checking unique email
    const { userID } = req.body
    let existingUser = await User.findOne({ _id: userID });
    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));
    existingUser.admin_status = req.body.status;
    if (req.body.status == 'RESCHEDULED') {
        existingUser.appointment_time = req.body.appointment_time
        existingUser.appointment_date = req.body.appointment_date
    }

    if (req.body.status == 'APPROVED') {
        existingUser.is_active = 'ACTIVE';
    }

    existingUser.notes.push({
        status: req.body.status,
        notes: req.body.notes,
        appointment_time: (req.body.status == 'RESCHEDULED') ? req.body.appointment_time : '',
        appointment_date: (req.body.status == 'RESCHEDULED') ? req.body.appointment_date : '',
        created_at: new Date()
    });

    existingUser.save(function(err, user) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
        // todo: don't forget to handle err
        //console.log('status', req.body.status)
        let msg = ''
        if (req.body.status == 'RESCHEDULED') {
            msg = {
                to: existingUser.email,
                from: config.get('sendgrid.from'),
                templateId: templates['appointment_reschedule'],
                dynamic_template_data: {
                    appointment_date: req.body.appointment_date,
                    appointment_time: req.body.appointment_time
                }
            };
        } else if (req.body.status == 'APPROVED') {
            msg = {
                to: existingUser.email,
                from: config.get('sendgrid.from'),
                templateId: templates['appointment_approved']

            };
        } else if (req.body.status == 'REJECTED') {
            msg = {
                to: existingUser.email,
                from: config.get('sendgrid.from'),
                templateId: templates['appointment_rejected']

            };
        }
        if (req.body.status == 'REJECTED' || req.body.status == 'APPROVED' || req.body.status == 'RESCHEDULED') {
            sgMail.send(msg, (error, result) => {
                if (error) {
                    console.log(error);
                } else {
                    console.log("That's wassup!");
                }
            });

        }

        return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(user, ['_id']));
    });
}


/**
 * Function to delete object from aws s3 bucket
 */
exports.deleteObject = async(req, res) => {

    let params = {
        Bucket: config.get('aws.bucket'),
        Key: req.body.fileKey
    };


    s3.headObject(params, function(err, data) {

        if (err) {
            return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('FILE-NOT-FOUND'));
        } else {
            s3.deleteObject(params, function(err, data) {
                if (err) {
                    return res.status(responseCode.CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).send(err.message);
                } else {
                    return res.status(responseCode.CODES.SUCCESS.OK).send({ response: req.polyglot.t('FILE-REMOVED') });
                }
            });
        }
    });
}

exports.testMail = async(req, res) => {
    const { email } = req.body
    const msg = {
        to: 'eeshansharma@hotmail.com',
        cc: 'sandeep.may86@gmail.com',
        from: config.get('sendgrid.from'),
        subject: 'New Subscriber',
        text: 'You have a new subscriber request.',
        html: `Hi,<br/> You have received a new contact request from ${email}`,
    };
    sgMail.send(msg, (error, result) => {
        return res.status(responseCode.CODES.SUCCESS.OK).send({ send: true })
    });

}

exports.buySubscription = async(req, res) => {

    let existingUser = await User.findOne({ _id: req.body.userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    let PaymentDetailsArray = [];
    let transactionArray = [];
    let userData = {};
    let cardData = {};
    let subscriptionData = {};
    let cardResponse, saveCustomer, saveSubscription;


    let CardDetails = {
            number: req.body.payment_details.credit_card_number,
            exp_month: parseInt(req.body.payment_details.expiry_month),
            exp_year: parseInt(req.body.payment_details.expiry_year),
            cvc: req.body.payment_details.cvc_number,
            name: req.body.payment_details.credit_card_first_name + ' ' + req.body.payment_details.credit_card_last_name,
        }
        //console.log(CardDetails);
        //return;

    // Create a Card Token	
    stripe.tokens.create({
            card: {
                number: req.body.payment_details.credit_card_number,
                exp_month: parseInt(req.body.payment_details.expiry_month),
                exp_year: parseInt(req.body.payment_details.expiry_year),
                cvc: req.body.payment_details.cvc_number,
                name: req.body.payment_details.credit_card_first_name + ' ' + req.body.payment_details.credit_card_last_name,
            },
        },
        async function(err, token) {
            if (err) {
                handleStripeError(err, res)
            } // Car Token Error
            if (token) {
                //console.log(token);
                if (isEmpty(existingUser.stripe_customer_id)) { // if new customer
                    userData = { 'first_name': existingUser.first_name, 'last_name': existingUser.last_name, 'email': existingUser.email, 'description': 'Adding Mentor as a Customer.', 'token': token.id, 'id': req.body.userID, 'user_type': 'mentor' }

                    saveCustomer = await saveNewCustomer(userData, res); // Save New Customer
                    //console.log(saveCustomer);

                    if (saveCustomer.id) {
                        cardData = { 'customer_id': saveCustomer.id, 'token': token.id };
                        cardResponse = await saveNewCard(cardData, res); // save New Card
                        if (cardResponse.id) {

                            subscriptionData = { 'customer_id': saveCustomer.id, 'price_id': req.body.priceId }

                            saveSubscription = await createSubscription(subscriptionData, res);
                            //console.log(saveSubscription);
                            if (saveSubscription.id) {

                                PaymentDetailsArray = [];
                                PaymentDetailsArray.push({ 'stripe_card_id': cardResponse.id, 'credit_card_number': cardResponse.last4, 'card_type': cardResponse.brand, 'default': true, 'card_holder_name': cardResponse.name, 'exp_year': cardResponse.exp_year, 'exp_month': cardResponse.exp_month }); // automcatically set default to true

                                // Update Mentor Customer Id and Payment Details
                                existingUser.stripe_customer_id = saveCustomer.id;
                                existingUser.subscription_id = saveSubscription.id;
                                existingUser.next_billing_date = saveSubscription.current_period_end;
                                existingUser.subscription_status = 'ACTIVE';
                                existingUser.price_id = req.body.priceId;
                                existingUser.membership_id = req.body.membershipId;
                                existingUser.payment_details = PaymentDetailsArray;
                                existingUser.billing_details = req.body.billing_details;
                                existingUser.save(function(err, user) {
                                    if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
                                    // todo: don't forget to handle err

                                    // Save New Transaction

                                    transactionArray['transaction_type'] = 'Subscription'
                                    transactionArray['user_id'] = req.body.userID
                                    transactionArray['price_id'] = req.body.priceId
                                    transactionArray['invoice_id'] = saveSubscription.latest_invoice;
                                    transactionArray['payment_details'] = { 'stripe_card_id': cardResponse.id, 'credit_card_number': cardResponse.last4, 'card_type': cardResponse.brand, 'default': true, 'card_holder_name': cardResponse.name, 'exp_year': cardResponse.exp_year, 'exp_month': cardResponse.exp_month };

                                    transactionArray['user_type'] = 'MENTOR'

                                    let newTransaction = new Transactions(_.pick(transactionArray, ['transaction_type', 'user_id', 'user_type', 'price_id', 'invoice_id', 'payment_details', 'created_at', 'modified_at']));

                                    newTransaction.save(async function(err, record) {});

                                    return res.status(responseCode.CODES.SUCCESS.OK).send({ success: 'Your Payment Method Added Successfully.' });
                                });

                            }

                        }
                    }



                } else {

                    cardData = { 'customer_id': existingUser.stripe_customer_id, 'token': token.id };

                    cardResponse = await saveNewCard(cardData, res); // Save New Card Details on Stripe
                    //console.log('cardResponse', cardResponse);
                    if (cardResponse.id) {

                        // Save Payment Details in DB
                        if (isEmpty(existingUser.payment_details)) {


                            PaymentDetailsArray = [];
                            PaymentDetailsArray.push({ 'stripe_card_id': cardResponse.id, 'credit_card_number': cardResponse.last4, 'card_type': cardResponse.brand, 'default': true, 'card_holder_name': cardResponse.name, 'exp_year': cardResponse.exp_year, 'exp_month': cardResponse.exp_month }); //automatically set default to true


                        } else {

                            PaymentDetailsArray = existingUser.payment_details;

                            // check new default card request recieved
                            if (req.body.payment_details.default_card) {

                                // check if there is any previous default card method available 
                                let getPreviousDefaultCard = PaymentDetailsArray.filter((l) => l.default).map((l) => l);

                                if (getPreviousDefaultCard) {
                                    // update All Previous Default Method to false				
                                    for (var x = 0; x < PaymentDetailsArray.length; x++) {
                                        PaymentDetailsArray[x].default = false;
                                    }

                                }


                                // Update Customer Stripe API to set New Default Payment Method
                                cardData = { 'customer_id': existingUser.stripe_customer_id, 'id': cardResponse.id };
                                await updateCustomerDefaultPaymentMethod(cardData, res);
                            }


                            PaymentDetailsArray.push({ 'stripe_card_id': cardResponse.id, 'credit_card_number': cardResponse.last4, 'card_type': cardResponse.brand, 'default': req.body.payment_details.default_card, 'card_holder_name': cardResponse.name, 'exp_year': cardResponse.exp_year, 'exp_month': cardResponse.exp_month });

                        }

                        subscriptionData = { 'customer_id': existingUser.stripe_customer_id, 'price_id': req.body.priceId }

                        saveSubscription = await createSubscription(subscriptionData, res);
                        //console.log(saveSubscription);
                        if (saveSubscription.id) {
                            // Update Payment Details Array
                            existingUser.payment_details = PaymentDetailsArray;
                            existingUser.subscription_id = saveSubscription.id;
                            existingUser.subscription_status = 'ACTIVE';
                            existingUser.next_billing_date = saveSubscription.current_period_end;
                            existingUser.membership_id = req.body.membershipId;
                            existingUser.price_id = req.body.priceId;
                            existingUser.billing_details = req.body.billing_details;
                            existingUser.save(function(err, user) {
                                if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
                                // todo: don't forget to handle err


                                // Save New Transaction
                                transactionArray['transaction_type'] = 'Subscription'
                                transactionArray['user_id'] = req.body.userID
                                transactionArray['price_id'] = req.body.priceId
                                transactionArray['invoice_id'] = saveSubscription.latest_invoice;
                                transactionArray['payment_details'] = { 'stripe_card_id': cardResponse.id, 'credit_card_number': cardResponse.last4, 'card_type': cardResponse.brand, 'card_holder_name': cardResponse.name, 'exp_year': cardResponse.exp_year, 'exp_month': cardResponse.exp_month };
                                transactionArray['user_type'] = 'MENTOR'

                                let newTransaction = new Transactions(_.pick(transactionArray, ['transaction_type', 'user_id', 'user_type', 'price_id', 'invoice_id', 'payment_details', 'created_at', 'modified_at']));

                                newTransaction.save(async function(err, record) {});

                                return res.status(responseCode.CODES.SUCCESS.OK).send({ success: 'Your Payment Method Added Successfully.' });
                            });

                        }



                    }


                }

            } //if Token

        }); // Create Card Token

}

exports.addYourPaymentMethod = async(req, res) => {

    //console.log(req.body);

    //checking unique email
    let existingUser = await User.findOne({ _id: req.body.userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    let PaymentDetailsArray = [];
    let userData = {};
    let cardData = {};
    let subscriptionData = {};
    let cardResponse, saveCustomer, saveSubscription;


    let CardDetails = {
            number: req.body.payment_details.credit_card_number,
            exp_month: parseInt(req.body.payment_details.expiry_month),
            exp_year: parseInt(req.body.payment_details.expiry_year),
            cvc: req.body.payment_details.cvc_number,
            name: req.body.payment_details.credit_card_first_name + ' ' + req.body.payment_details.credit_card_last_name,
        }
        //console.log(CardDetails);
        //return;

    // Create a Card Token	
    stripe.tokens.create({
            card: {
                number: req.body.payment_details.credit_card_number,
                exp_month: parseInt(req.body.payment_details.expiry_month),
                exp_year: parseInt(req.body.payment_details.expiry_year),
                cvc: req.body.payment_details.cvc_number,
                name: req.body.payment_details.credit_card_first_name + ' ' + req.body.payment_details.credit_card_last_name,
            },
        },
        async function(err, token) {
            if (err) {
                handleStripeError(err, res)
            } // Car Token Error
            if (token) {
                //console.log(token);
                if (isEmpty(existingUser.stripe_customer_id)) { // if new customer
                    userData = { 'first_name': existingUser.first_name, 'last_name': existingUser.last_name, 'email': existingUser.email, 'description': 'Adding Parent as a Customer.', 'token': token.id, 'id': req.body.userID, 'user_type': 'parent' }

                    saveCustomer = await saveNewCustomer(userData, res); // Save New Customer
                    //console.log(saveCustomer);

                    if (saveCustomer.id) {
                        cardData = { 'customer_id': saveCustomer.id, 'token': token.id };
                        cardResponse = await saveNewCard(cardData, res); // save New Card
                        if (cardResponse.id) {


                            PaymentDetailsArray = [];
                            PaymentDetailsArray.push({ 'stripe_card_id': cardResponse.id, 'credit_card_number': cardResponse.last4, 'card_type': cardResponse.brand, 'default': true, 'card_holder_name': cardResponse.name, 'exp_year': cardResponse.exp_year, 'exp_month': cardResponse.exp_month }); // automcatically set default to true

                            // Update Mentor Customer Id and Payment Details
                            existingUser.stripe_customer_id = saveCustomer.id;
                            existingUser.payment_details = PaymentDetailsArray;
                            existingUser.save(function(err, user) {
                                if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
                                // todo: don't forget to handle err

                                return res.status(responseCode.CODES.SUCCESS.OK).send({ success: 'Your Payment Method Added Successfully.' });
                            });



                        }
                    }



                } else {

                    cardData = { 'customer_id': existingUser.stripe_customer_id, 'token': token.id };

                    cardResponse = await saveNewCard(cardData, res); // Save New Card Details on Stripe
                    //console.log('cardResponse', cardResponse);
                    if (cardResponse.id) {

                        // Save Payment Details in DB
                        if (isEmpty(existingUser.payment_details)) {


                            PaymentDetailsArray = [];
                            PaymentDetailsArray.push({ 'stripe_card_id': cardResponse.id, 'credit_card_number': cardResponse.last4, 'card_type': cardResponse.brand, 'default': true, 'card_holder_name': cardResponse.name, 'exp_year': cardResponse.exp_year, 'exp_month': cardResponse.exp_month }); //automatically set default to true


                        } else {

                            PaymentDetailsArray = existingUser.payment_details;

                            // check new default card request recieved
                            if (req.body.payment_details.default_card) {

                                // check if there is any previous default card method available 
                                let getPreviousDefaultCard = PaymentDetailsArray.filter((l) => l.default).map((l) => l);

                                if (getPreviousDefaultCard) {
                                    // update All Previous Default Method to false				
                                    for (var x = 0; x < PaymentDetailsArray.length; x++) {
                                        PaymentDetailsArray[x].default = false;
                                    }

                                }


                                // Update Customer Stripe API to set New Default Payment Method
                                cardData = { 'customer_id': existingUser.stripe_customer_id, 'id': cardResponse.id };
                                await updateCustomerDefaultPaymentMethod(cardData, res);
                            }


                            PaymentDetailsArray.push({ 'stripe_card_id': cardResponse.id, 'credit_card_number': cardResponse.last4, 'card_type': cardResponse.brand, 'default': req.body.payment_details.default_card, 'card_holder_name': cardResponse.name, 'exp_year': cardResponse.exp_year, 'exp_month': cardResponse.exp_month });

                        }


                        // Update Payment Details Array
                        existingUser.payment_details = PaymentDetailsArray;
                        existingUser.save(function(err, user) {
                            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
                            // todo: don't forget to handle err

                            return res.status(responseCode.CODES.SUCCESS.OK).send({ success: 'Your Payment Method Added Successfully.' });
                        });
                    }


                }

            } //if Token

        }); // Create Card Token

}

exports.getSavedPaymentMethod = async(req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    return res.status(responseCode.CODES.SUCCESS.OK).send(_.pick(existingUser, ['payment_details']));

}

exports.getMentorMembershipDetails = async(req, res) => {


    let condition = {};


    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID } = req.body



    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    condition['_id'] = mongoose.Types.ObjectId(userID);
    User.aggregate([{
            $match: condition
        },
        {

            "$lookup": {
                from: "memberships",
                localField: "membership_id",
                foreignField: "_id",
                as: "membership",
            }
        },
        {
            $project: {
                'next_billing_date': 1,
                'subscription_status': 1,
                'membership.price': 1,
                'membership.type': 1,
                'membership.title': 1
            },
        },
        { $unwind: "$membership" }
    ], function(err, membershipDetails) {

        return res.status(responseCode.CODES.SUCCESS.OK).send(membershipDetails[0]);

    })

}

exports.cancelYourSubscription = async(req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    userData = { 'stripe_subscription_id': existingUser.subscription_id }

    cancelCustomerSubscription = await cancelSubscription(userData, res); // Save New Customer
    //console.log(cancelCustomerSubscription);

    if (cancelCustomerSubscription.status == 'canceled') {
        // Update Payment Details Array
        existingUser.subscription_status = 'CANCELLED';
        existingUser.save(function(err, user) {
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
            // todo: don't forget to handle err

            return res.status(responseCode.CODES.SUCCESS.OK).send(true);
        });
    } else {
        return res.status(responseCode.CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).send(req.polyglot.t('SUBSCRIPTION-CANCELLED-FAILED'));
    }

}


exports.upgradeYourSubscription = async(req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    let transactionArray = [];
    let paymentDetailsArray = [];
    let subscriptionData = {};
    let subscriptionUpdated;
    let subscription;

    const { userID } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    userData = { 'stripe_subscription_id': existingUser.subscription_id }

    subscription = await stripe.subscriptions.retrieve(existingUser.subscription_id);
    //console.log(cancelCustomerSubscription);

    if (subscription.id) {
        subscriptionData = { 'subscription_id': subscription.id, 'price_id': req.body.priceId, itemId: subscription.items.data[0].id }

        subscriptionUpdated = await updateSubscription(subscriptionData, res);

        if (subscriptionUpdated.id && (subscriptionUpdated.pending_update == null || subscriptionUpdated.pending_update == '')) {

            existingUser.subscription_id = subscriptionUpdated.id;
            existingUser.subscription_status = 'ACTIVE';
            existingUser.next_billing_date = subscriptionUpdated.current_period_end;
            existingUser.membership_id = req.body.membershipId;
            existingUser.price_id = req.body.priceId;

            existingUser.save(function(err, user) {
                if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
                // todo: don't forget to handle err

                // get default payment method details
                paymentDetailsArray = existingUser.payment_details.filter(function(item) {
                    return item.default === true;
                });


                // Save New Transaction
                transactionArray['transaction_type'] = 'Subscription'
                transactionArray['user_id'] = req.body.userID
                transactionArray['price_id'] = req.body.priceId
                transactionArray['invoice_id'] = subscriptionUpdated.latest_invoice;
                transactionArray['payment_details'] = { 'stripe_card_id': paymentDetailsArray.stripe_card_id, 'credit_card_number': paymentDetailsArray.credit_card_number, 'card_type': paymentDetailsArray.card_type, 'card_holder_name': paymentDetailsArray.card_holder_name, 'exp_year': paymentDetailsArray.exp_year, 'exp_month': paymentDetailsArray.exp_month };
                transactionArray['user_type'] = 'MENTOR'

                let newTransaction = new Transactions(_.pick(transactionArray, ['transaction_type', 'user_id', 'user_type', 'price_id', 'invoice_id', 'payment_details', 'created_at', 'modified_at']));

                newTransaction.save(async function(err, record) {});
                return res.status(responseCode.CODES.SUCCESS.OK).send({ success: req.polyglot.t('SUBSCRIPTION-UPGRADE-SUCCESS') });
            });

        } else {
            return res.status(responseCode.CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).send(req.polyglot.t('SUBSCRIPTION-UPGRADE-FAILED'));
        }

    } else {
        return res.status(responseCode.CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).send(req.polyglot.t('SUBSCRIPTION-UPGRADE-FAILED'));
    }

}

exports.defaultCard = async(req, res) => {
    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    let PaymentDetailsArray = existingUser.payment_details;


    stripe.customers.update(
        existingUser.stripe_customer_id, { invoice_settings: { default_payment_method: req.body.card_id } },
        function(err, customer) {
            // asynchronously called
            if (err) { handleStripeError(err, res) } // Create Card Error

            for (var x = 0; x < PaymentDetailsArray.length; x++) {
                if (PaymentDetailsArray[x].stripe_card_id === req.body.card_id) {
                    PaymentDetailsArray[x].default = true;
                } else {
                    PaymentDetailsArray[x].default = false;
                }

            }

            // set new card as default card in DB		

            User.findOneAndUpdate({ _id: userID }, { $set: { 'payment_details': PaymentDetailsArray } }, { new: true }, function(err, doc) {

                if (err) {
                    return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('CARD-UPDATE-FAILED'));
                }

                return res.status(responseCode.CODES.SUCCESS.OK).send(true);

            });

        }
    );

}

exports.removeCard = async(req, res) => {
    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    let PaymentDetailsArray = existingUser.payment_details;


    // delete Card From Stripe
    stripe.customers.deleteSource(
        existingUser.stripe_customer_id,
        req.body.card_id,
        function(err, confirmation) {
            // asynchronously called
            if (err) { handleStripeError(err, res) } // Create Card Error

            // Remove Card From DB
            _.remove(PaymentDetailsArray, function(e) {
                return e.stripe_card_id == req.body.card_id
            });

            User.findOneAndUpdate({ _id: userID }, { $set: { 'payment_details': PaymentDetailsArray } }, { new: true }, function(err, doc) {

                if (err) {
                    return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('CARD-UPDATE-FAILED'));
                }

                return res.status(responseCode.CODES.SUCCESS.OK).send(true);

            });

        }
    );


}

function handleStripeError(err, res) {
    switch (err.type) {
        case 'StripeCardError':
            // A declined card error => e.g. "Your card's expiration year is invalid."
            return res.status(responseCode.CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).send({ 'error': err.message });
            break;
        case 'StripeRateLimitError':
            // Too many requests made to the API too quickly
            return res.status(responseCode.CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).send({ 'error': "Too many requests hit the API too quickly." });
            break;
        case 'StripeInvalidRequestError':
            // Invalid parameters were supplied to Stripe's API
            return res.status(responseCode.CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).send({ 'error': "Invalid parameters were supplied to API" });
            break;
        case 'StripeAPIError':
            // An error occurred internally with Stripe's API
            return res.status(responseCode.CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).send({ 'error': "An error occurred internally with API" });
            break;
        case 'StripeConnectionError':
            // Some kind of error occurred during the HTTPS communication
            return res.status(responseCode.CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).send({ 'error': "Some kind of error occurred during the HTTPS communication" });
            break;
        case 'StripeAuthenticationError':
            // You probably used an incorrect API key
            return res.status(responseCode.CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).send({ 'error': "Unable to add your card for some unknown reason. Please try again later." });
            break;
        default:
            // Handle any other types of unexpected errors
            return res.status(responseCode.CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).send({ 'error': "Unable to process your request for some unknown reason. Please try again later." });
            break;
    }
    exit;
}

function updateCustomerDefaultPaymentMethod(cardData, res) {
    return new Promise(function(resolve, reject) {
        return stripe.customers.update(
            cardData.customer_id, { invoice_settings: { default_payment_method: cardData.id } },
            function(err, customer) {
                if (err) { reject(handleStripeError(err, res)) } // Create Card Error
                resolve(customer); // Customer Default Payment Method Successfully Updated.
            });
    });
}

function createSubscription(subscriptionData, res) {
    // create a subscription 
    return new Promise(function(resolve, reject) {
        return stripe.subscriptions.create({
                customer: subscriptionData.customer_id,
                items: [
                    { price: subscriptionData.price_id, },
                ]
            },
            function(err, subscription) {
                // asynchronously called
                if (err) {
                    //console.log(err);
                    reject(handleStripeError(err, res))
                } // Handle Customer Error

                resolve(subscription); // If Customer Successfully created

            });
    });

}

function updateSubscription(subscriptionData, res) {
    // update a subscription 
    return new Promise(function(resolve, reject) {

        return await stripe.subscriptions.update(
            subscriptionData.subscription_id, {
                payment_behavior: 'pending_if_incomplete',
                proration_behavior: 'always_invoice',
                items: [{
                    id: subscriptionData.itemId,
                    price: subscriptionData.price_id,
                }],
            },
            function(err, subscription) {
                // asynchronously called
                if (err) {
                    //console.log(err);
                    reject(handleStripeError(err, res))
                } // Handle Customer Error

                resolve(subscription); // If Customer Successfully created

            });
    });

}

function saveNewCustomer(userData, res) {
    // create a customer 
    return new Promise(function(resolve, reject) {
        return stripe.customers.create({
                description: userData.description,
                name: userData.first_name + ' ' + userData.last_name,
                email: userData.email
            },
            function(err, customer) {
                // asynchronously called
                if (err) {
                    //console.log('HEllo World 1');
                    reject(handleStripeError(err, res))
                } // Handle Customer Error

                resolve(customer); // If Customer Successfully created

            });
    });

}

function getCustomerDetails(userData, res) {
    // get a customer details 
    return new Promise(function(resolve, reject) {
        return stripe.subscriptions.retrieve(userData.stripe_subscription_id,
            function(err, customer) {
                // asynchronously called
                if (err) {
                    //console.log('HEllo World 1');
                    reject(handleStripeError(err, res))
                } // Handle Customer Error

                resolve(customer); // If Customer Details Fetched

            });
    });
}

function cancelSubscription(userData, res) {
    // cancel a subscription 
    return new Promise(function(resolve, reject) {
        return stripe.subscriptions.del(userData.stripe_subscription_id,
            function(err, subscription) {
                // asynchronously called
                if (err) {
                    reject(handleStripeError(err, res))
                } // Handle Subscription Error

                resolve(subscription); // If Subscription Successfully cancelled

            });
    });
}

function isEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

function saveNewCard(cardData, res) {
    return new Promise(function(resolve, reject) {
        // Create a Card Stripe API
        return stripe.customers.createSource(
            cardData.customer_id, {
                source: cardData.token,
            },
            function(err, card) {
                if (err) {
                    //console.log(err);
                    //console.log('HEllo World2');
                    reject(handleStripeError(err, res))
                } // Handle Card Error
                //console.log(card);
                // update default payment method using Stripe API					
                resolve(card);
            });


    });
}


exports.checkBillingMethodExists = async(req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID } = req.body

    //checking unique email
    let existingUser = await User.findOne({ _id: userID }, { stripe_customer_id: 1 });
    console.log(existingUser)

    if (existingUser.stripe_customer_id == '') {
        return res.status(400).send(req.polyglot.t('ADD-YOUR-BILLING-METHOD'))
    } else {
        return res.status(responseCode.CODES.SUCCESS.OK).send(true);
    }
}

exports.search = async(req, res) => {



    const { size, pageNumber, sort_dir, sort_by } = req.body
    let condition = {};
    let andcondition = []
    let sortBy = {}
    sortBy[sort_by] = (sort_dir == 'asc') ? -1 : 1
    condition['role'] = 'MENTOR'
    condition['stripe_customer_id'] = { "$nin": [null, ""] }
    condition['admin_status'] = 'APPROVED'
    condition['is_active'] = 'ACTIVE'
    condition['subscription_status'] = 'ACTIVE'

    if (_.has(req.body.filters, ['date']) && (req.body.filters['date']).length > 0) {
        condition['availability.date'] = req.body.filters['date']
    }
    if (_.has(req.body.filters, ['slot']) && (req.body.filters['slot']).length > 0) {
        condition['availability.slots.value'] = req.body.filters['slot']
    }



    if (_.has(req.body.filters, ['hourly_rate'])) {
        condition['hourly_rate'] = { $gte: req.body.filters.hourly_rate['min'], $lte: req.body.filters.hourly_rate['max'] }
    }

    if (_.has(req.body.filters, ['rating']) && req.body.filters['rating'] != 'Any') {
        condition['rating'] = { $gte: req.body.filters['rating'] }
    }
    if (_.has(req.body.filters, ['subcategory']) && (req.body.filters['subcategory']).length > 0) {

        andcondition.push({
            $or: [
                { 'subcategory1.subcategory_id': mongoose.Types.ObjectId(req.body.filters['subcategory']) },
                { 'subcategory2.subcategory_id': mongoose.Types.ObjectId(req.body.filters['subcategory']) },
                { 'subcategory3.subcategory_id': mongoose.Types.ObjectId(req.body.filters['subcategory']) }
            ]
        })
    }

    if (_.has(req.body.filters, ['location']) && (req.body.filters['location']).length > 0) {


        andcondition.push({
            $or: [
                { servicable_zipcodes: { $elemMatch: { "value": { $regex: req.body.filters['location'], $options: 'i' }, "__isValid": true } } },
                { zipcode: { $regex: req.body.filters['location'], $options: 'i' } },
                { address1: { $regex: req.body.filters['location'], $options: 'i' } },
                { address2: { $regex: req.body.filters['location'], $options: 'i' } },
                { 'country.value': req.body.filters['location'] },
                { 'state.value': req.body.filters['location'] },
                { 'city.value': req.body.filters['location'] }
            ]
        })
    }

    if (_.has(req.body, ['search']) && (req.body['search']).length > 0) {
        andcondition.push({
            $or: [
                { first_name: { $regex: req.body['search'], $options: 'i' } },
                { last_name: { $regex: req.body['search'], $options: 'i' } },
                { tagline: { $regex: req.body['search'], $options: 'i' } },
                { bio: { $regex: req.body['search'], $options: 'i' } }
            ]
        })

    }

    if (_.has(req.body.filters, ['category']) && (req.body.filters['category']).length > 0) {
        andcondition.push({
            $or: [
                { 'category1.category_id': mongoose.Types.ObjectId(req.body.filters['category']) },
                { 'category2.category_id': mongoose.Types.ObjectId(req.body.filters['category']) },
                { 'category3.category_id': mongoose.Types.ObjectId(req.body.filters['category']) }
            ]
        })
    }


    if (andcondition.length > 0) {
        //andcondition['$and'] = andcondition
        condition['$and'] = andcondition
    }
    let totalRecords = await User.count(condition);


    let skip = (parseInt(pageNumber) * parseInt(size)) - parseInt(size);
    let limit = parseInt(size);


    User.aggregate([{
            $match: condition
        },

        {
            $project: {
                first_name: 1,
                last_name: 1,
                bio: 1,
                tagline: 1,
                profile_image: 1,
                hourly_rate: 1,
                created_at: 1,
                rating: 1,
                servicable_zipcodes: 1,
                city: 1,
                country: 1,
                state: 1,
                subcategory1: 1,
                subcategory2: 1,
                subcategory3: 1,
                category1: 1,
                category2: 1,
                category3: 1,
            },
        },
        { $sort: sortBy },
        { $skip: skip },
        { $limit: limit }




    ], function(err, members) {

        let data = {
            records: members,
            total_records: totalRecords,
            condition: condition,
            andcondition: andcondition,
            sortBy: sortBy,
            err: err

        }
        return res.status(responseCode.CODES.SUCCESS.OK).send(data);
    })

}

exports.subcategoryListing = async(req, res) => {
    let condition = {}
    if (_.has(req.body, ['category_id']) && (req.body['category_id']).length > 0) {
        condition['category_id'] = mongoose.Types.ObjectId(req.body['category_id'])
    }
    return res.status(responseCode.CODES.SUCCESS.OK).send(await Subcategory.find(condition));

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