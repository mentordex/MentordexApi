'use strict';
var mongoose = require('mongoose');
var sha1 = require('sha1');
var md5 = require('md5');
var config = require('config');

var adminSchema = new mongoose.Schema({
    name: { type: String, trim:true },
    email: { type: String, trim:true },
    password: { type: String },    
    salt_key: { type: String },  
    fax:   { type: String },  
    mobile:   { type: String },
    office_phone:   { type: String },
    profile_pic:{
        type: String,
    },
    address:{
        type: String,
    },
    about_me:{
        type: String,
    },    
    role: {
        type: String,
        enum : ['SUPERADMIN', 'ADMIN'],
        default: 'SUPERADMIN'       
    },    
    is_active:{
        type: String,
        enum : ['ACTIVE', 'IN-ACTIVE'],
        default: 'ACTIVE'
    },
    is_verified:{
        type: String,
        enum : ['VERIFIED', 'NOT-VERIFIED'],
        default: 'VERIFIED'
    },    
    auth_token:{ type: String },
    reset_password_token:{ type: String },
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
adminSchema.pre('save', async function save(next) {
    if (!this.isModified('password')) return next();
    try {
        console.log('yes');
        const salt = await sha1(`${this.email}${this.created_at}`) 
        const password = await md5(`${this.password}`) 
        this.password = await md5(`${password}${salt}`) 
        this.salt_key = salt;
        return next();
    } catch (err) {
        return next(err);
    }
});

adminSchema.methods.passwordCompare = async function (saltKey, savedPassword, requestedPassword) {

  
    const password = await md5(`${requestedPassword}`)
    const encryptedPassword = await md5(`${password}${saltKey}`)   
    return (encryptedPassword == savedPassword)?true:false    
}

adminSchema.methods.generateToken = async function (saltKey) {

  
    return md5(saltKey);  
}

adminSchema.methods.generateResetPasswordToken = async function (saltKey) {

  
    return md5(`${saltKey}-${new Date()}`);  
}

adminSchema.methods.encryptPassword = async function (userData, password) {

    const salt = await sha1(`${userData.email}${userData.created_at}`) 
    const MD5Password = await md5(`${password}`) 
    const encryptedPassword = await md5(`${MD5Password}${salt}`)    
    return encryptedPassword;  
}

module.exports.Admin =  mongoose.model('Admin', adminSchema);