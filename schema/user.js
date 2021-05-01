'use strict';
var mongoose = require('mongoose');
var sha1 = require('sha1');
var md5 = require('md5');
var config = require('config');
var Schema = mongoose.Schema

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
    profile_image: [{
        file_path: {
            type: String,
            trim: true
        },
        file_name: {
            type: String,
            trim: true
        },
        file_key: {
            type: String,
            trim: true
        },
        file_mimetype: {
            type: String,
            trim: true
        },
        file_category: {
            type: String,
            trim: true
        }
    }],
    introduction_video: [{
        file_path: {
            type: String,
            trim: true
        },
        file_name: {
            type: String,
            trim: true
        },
        file_key: {
            type: String,
            trim: true
        },
        file_mimetype: {
            type: String,
            trim: true
        },
        file_category: {
            type: String,
            trim: true
        }
    }],
    address: {
        type: String,
    },
    tagline: {
        type: String,
    },
    bio: {
        type: String,
    },
    servicable_zipcodes: [],
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
    social_links: {
        instagram_url: {
            type: String,
        },
        linkedin_url: {
            type: String,
        },
        twitter_url: {
            type: String,
        }
    },
    dob: {
        year: {
            type: String,
        },
        month: {
            type: String,
        },
        day: {
            type: String,
        }
    },
    gender: {
        type: String,
        enum: ['MALE', 'FEMALE'],
        default: 'MALE'
    },
    subcategories: [],
    appointment_time: {
        type: String,
    },
    hourly_rate: {
        type: Number,
        default: 0
    },
    appointment_date: {
        type: String,
    },
    references: [{
        name: {
            type: String,
            trim: true
        },
        relation: {
            type: String,
            trim: true
        },
        job_title: {
            type: String,
            trim: true
        },
        workplace_name: {
            type: String,
            trim: true
        },
        contact_number: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            trim: true
        },
    }],
    academics: [{
        institution_name: {
            type: String,
            trim: true
        },
        grade: {
            type: String,
            trim: true
        },
        area_of_study: {
            type: String,
            trim: true
        },
        degree: {
            type: String,
            trim: true
        },
        start_year: {
            type: String,
            trim: true
        },
        end_year: {
            type: String,
            trim: true
        },
    }],
    achievements: [{
        title: {
            type: String,
            trim: true
        },
        years_of_learning: {
            type: String,
            trim: true
        },
        associated_with: {
            type: String,
            trim: true
        },
        issuer: {
            type: String,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        start_year: {
            type: String,
            trim: true
        },
        end_year: {
            type: String,
            trim: true
        },
    }],
    employments: [{
        company: {
            type: String,
            trim: true
        },
        city: {
            type: String,
            trim: true
        },
        state: {
            type: String,
            trim: true
        },
        title: {
            type: String,
            trim: true
        },
        start_year: {
            type: String,
            trim: true
        },
        end_year: {
            type: String,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
    }],
    letter_of_recommendation: [{
        file_path: {
            type: String,
            trim: true
        },
        file_name: {
            type: String,
            trim: true
        },
        file_key: {
            type: String,
            trim: true
        },
        file_mimetype: {
            type: String,
            trim: true
        },
        file_category: {
            type: String,
            trim: true
        }
    }],
    availability: [{
        date: {
            type: String,
            trim: true
        },
        slots: [{
            value: {
                type: String,
                trim: true
            },
            isChecked: {
                type: Boolean,
                default: false
            }
        }]
    }],
    category_id: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
    },
    primary_language: [],
    address1: {
        type: String,
    },
    address2: {
        type: String,
    },
    country: {
        country_id: {
            type: Schema.Types.ObjectId,
            ref: 'Country',
        },
        value: {
            type: String,
            trim: true
        }
    },
    state: {
        state_id: {
            type: Schema.Types.ObjectId,
            ref: 'State',
        },
        value: {
            type: String,
            trim: true
        }
    },
    city: {
        city_id: {
            type: Schema.Types.ObjectId,
            ref: 'City',
        },
        value: {
            type: String,
            trim: true
        }
    },
    country_id: {
        type: Schema.Types.ObjectId,
        ref: 'Country',
    },
    state_id: {
        type: Schema.Types.ObjectId,
        ref: 'State',
    },
    city_id: {
        type: Schema.Types.ObjectId,
        ref: 'City',
    },
    zipcode: {
        type: String
    },
    rating: {
        type: Number,
        default: 0
    },
    country_value: {
        type: String
    },
    state_value: {
        type: String
    },
    city_value: {
        type: String
    },
    category1: {
        category_id: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
        },
        value: {
            type: String,
            trim: true
        }
    },
    category2: {
        category_id: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
        },
        value: {
            type: String,
            trim: true
        }
    },
    category3: {
        category_id: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
        },
        value: {
            type: String,
            trim: true
        }
    },
    subcategory1: {
        subcategory_id: {
            type: Schema.Types.ObjectId,
            ref: 'Subcategory',
        },
        value: {
            type: String,
            trim: true
        }
    },
    subcategory2: {
        subcategory_id: {
            type: Schema.Types.ObjectId,
            ref: 'Subcategory',
        },
        value: {
            type: String,
            trim: true
        }
    },
    subcategory3: {
        subcategory_id: {
            type: Schema.Types.ObjectId,
            ref: 'Subcategory',
        },
        value: {
            type: String,
            trim: true
        }
    },
    category_id1: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
    },
    category_id2: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
    },
    category_id3: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
    },
    subcategory_id1: {
        type: Schema.Types.ObjectId,
        ref: 'Subcategory',
    },
    subcategory_id2: {
        type: Schema.Types.ObjectId,
        ref: 'Subcategory',
    },
    subcategory_id3: {
        type: Schema.Types.ObjectId,
        ref: 'Subcategory'
    },
    payment_details: [{
        stripe_card_id: {
            type: String,
            trim: true
        },
        credit_card_number: {
            type: Number,
            trim: true
        },
        card_holder_name: {
            type: String,
            trim: true

        },
        card_type: {
            type: String,
            trim: true
        },
        exp_month: {
            type: String,
            trim: true
        },
        exp_year: {
            type: String,
            trim: true
        },
        default: {
            type: Boolean,
            //required: true,               
            default: false
        }
    }],
    billing_details: [{
        address1: {
            type: String,
            trim: true
        },
        address2: {
            type: String,
            trim: true
        },
        country: {
            type: String,
            trim: true
        },
        state: {
            type: String,
            trim: true
        },
        city: {
            type: String,
            trim: true
        },
        zipcode: {
            type: String,
            trim: true
        }
    }],
    stripe_customer_id: {
        type: String,
        //unique: true,
        trim: true
    },
    subscription_id: {
        type: String,
        //unique: true,
        trim: true
    },
    subscription_status: {
        type: String,
        enum: ['ACTIVE', 'CANCELLED', 'FAILED', 'IN-ACTIVE'],
        default: 'IN-ACTIVE'
    },
    price_id: {
        type: String,
        //unique: true,
        trim: true
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
    },
    admin_status: {
        type: String,
        enum: ['NEW', 'APPROVED', 'RESCHEDULED', 'IN-PROCESS', 'REJECTED', 'PENDING'],
        default: 'PENDING'
    },
    newsletter: {
        type: Boolean,
        default: false
    },
    notes: [],


}, { validateBeforeSave: false });

//pre save hook on mongodb
userSchema.pre('save', async function save(next) {
    if (!this.isModified('password')) return next();
    try {
        //console.log('yes');
        const salt = await sha1(`${this.email}${this.created_at}`)
        const epassword = await md5(`${this.password}`)
        this.password = await md5(`${epassword}${salt}`)
        this.salt_key = salt;
        return next();
    } catch (err) {
        return next(err);
    }
});

userSchema.methods.passwordCompare = async function(saltKey, savedPassword, requestedPassword) {
    console.log('saltKey', saltKey)

    const password = await md5(`${requestedPassword}`)
    const encryptedPassword = await md5(`${password}${saltKey}`)
    console.log('encryptedPassword', encryptedPassword)
    console.log('savedPassword', savedPassword)
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
    return { encryptedPassword, salt };
}

module.exports.User = mongoose.model('User', userSchema);