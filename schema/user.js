'use strict';
var mongoose = require('mongoose');
var sha1 = require('sha1');
var md5 = require('md5');
var config = require('config');

var userSchema = new mongoose.Schema({
    first_name: { type: String, trim: true },
    last_name: { type: String, trim: true },
    email: { type: String, trim: true },
    password: { type: String },
    salt_key: { type: String },
    fax: { type: String },
    phone: { type: String },
    phone_token: { type: String },
    email_token: { type: String },
    profile_pic: {
        type: String,
    },
    address: {
        type: String,
    },
    about_me: {
        type: String,
    },
    skype: {
        type: String,
    },
    website: {
        type: String,
    },
    facebook: {
        type: String,
    },
    twitter: {
        type: String,
    },
    linkedin: {
        type: String,
    },
    instagram: {
        type: String,
    },
    google_plus: {
        type: String,
    },
    youtube: {
        type: String,
    },
    pinterest: {
        type: String,
    },
    vimeo: {
        type: String,
    },
    country_id: {
        type: Number,
    },
    state_id: {
        type: Number,
    },
    city_id: {
        type: Number,
    },
    zipcode: {
        type: String,
    },
    role: {
        type: String,
        enum: ['PARENT', 'MENTOR'],
        default: 'PARENT'
    },
    account_type: {
        type: String,
        enum: ['WEBSITE', 'FACEBOOK', 'APPLE'],
        default: 'WEBSITE'
    },
    is_active: {
        type: String,
        enum: ['ACTIVE', 'IN-ACTIVE'],
        default: 'IN-ACTIVE'
    },
    is_email_verified: {
        type: String,
        enum: ['VERIFIED', 'NOT-VERIFIED'],
        default: 'NOT-VERIFIED'
    },
    is_phone_verified: {
        type: String,
        enum: ['VERIFIED', 'NOT-VERIFIED'],
        default: 'NOT-VERIFIED'
    },
    device_data: {
        type: String,
    },
    auth_token: { type: String },
    reset_password_token: { type: String },
    created_at: {
        type: Date,
        default: new Date()
    },
    modified_at: {
        type: Date,
        default: new Date()
    }


});

//pre save hook on mongodb
userSchema.pre('save', async function save(next) {
    if (!this.isModified('password')) return next();
    try {
        //console.log('yes');
        const salt = await sha1(`${this.email}${this.created_at}`)
        const password = await md5(`${this.password}`)
        this.password = await md5(`${password}${salt}`)
        this.salt_key = salt;
        return next();
    } catch (err) {
        return next(err);
    }
});

userSchema.methods.passwordCompare = async function(saltKey, savedPassword, requestedPassword) {


    const password = await md5(`${requestedPassword}`)
    const encryptedPassword = await md5(`${password}${saltKey}`)
    return (encryptedPassword == savedPassword) ? true : false
}

userSchema.methods.generateToken = async function(saltKey) {


    return md5(saltKey);
}

userSchema.methods.generateRandomToken = async function(saltKey) {


    return md5(`${saltKey}-${new Date()}`);
}

userSchema.methods.encryptPassword = async function(userData, password) {

    const salt = await sha1(`${userData.email}${userData.created_at}`)
    const MD5Password = await md5(`${password}`)
    const encryptedPassword = await md5(`${MD5Password}${salt}`)
    return encryptedPassword;
}

module.exports.User = mongoose.model('User', userSchema);