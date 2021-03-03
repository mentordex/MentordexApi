const _ = require('lodash');
const config = require('config');
const { Country } = require('../schema/country');
const { State } = require('../schema/state');
const { City } = require('../schema/city');
const responseCode = require('../utilities/responseCode');
var mongoose = require('mongoose');


exports.addCountry = async(req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { title, is_active } = req.body

    if (_.has(req.body, ['id']) && (req.body.id) != null) {
        //checking unique Country
        let existingRecord = await Country.findOne({ _id: mongoose.Types.ObjectId(req.body.id) }, { _id: 1 });

        if (!existingRecord) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));

        req.body['modified_at'] = new Date()
            //save Country 
        Country.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.id) }, { $set: req.body }, { new: true }, function(err, type) {

            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

            return res.status(responseCode.CODES.SUCCESS.OK).send(type);

        });
    } else {
        //save Country 
        newRecord = new Country(_.pick(req.body, ['title', 'is_active', 'count', 'created_at', 'modified_at']));

        newRecord.save(async function(err, data) {

            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

            return res.status(responseCode.CODES.SUCCESS.OK).send(data);

        });
    }

}

exports.addState = async(req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { title, country_id, is_active } = req.body

    if (_.has(req.body, ['id']) && (req.body.id) != null) {
        //checking unique State
        let existingRecord = await State.findOne({ _id: mongoose.Types.ObjectId(req.body.id) }, { _id: 1 });

        if (!existingRecord) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));

        req.body['modified_at'] = new Date()
            //save State 
        State.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.id) }, { $set: req.body }, { new: true }, function(err, type) {

            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

            return res.status(responseCode.CODES.SUCCESS.OK).send(type);

        });
    } else {
        //save State 
        newRecord = new State(_.pick(req.body, ['title', 'country_id', 'count', 'is_active', 'created_at', 'modified_at']));

        newRecord.save(async function(err, data) {

            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

            return res.status(responseCode.CODES.SUCCESS.OK).send(data);

        });
    }

}
exports.addCity = async(req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { title, image, zipcodes, is_active, state_id, country_id } = req.body

    if (_.has(req.body, ['id']) && (req.body.id) != null) {
        //checking unique city
        let existingRecord = await City.findOne({ _id: mongoose.Types.ObjectId(req.body.id) }, { _id: 1 });

        if (!existingRecord) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));

        req.body['modified_at'] = new Date()
            //save city 
        City.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.id) }, { $set: req.body }, { new: true }, function(err, type) {

            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

            return res.status(responseCode.CODES.SUCCESS.OK).send(type);

        });
    } else {
        //checking unique city
        let existingRecord = await City.findOne({ title: title }, { _id: 1 });

        if (existingRecord) return res.status(400).send(req.polyglot.t('CITY-ALREADY-EXIST'));



        newRecord = new City(_.pick(req.body, ['title', 'image', 'is_active', 'zipcodes', 'country_id', 'state_id', 'count', 'created_at', 'modified_at']));
        console.log('newRecord', newRecord)
        newRecord.save(async function(err, data) {

            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

            return res.status(responseCode.CODES.SUCCESS.OK).send(data);

        });




    }

}


exports.countryListing = async(req, res) => {

    const condition = []

    Country.find({}, function(err, result) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

        return res.status(responseCode.CODES.SUCCESS.OK).send(result);
    });

}
exports.stateListing = async(req, res) => {

    const condition = {}

    if ('country_id' in req.body) {
        condition['country_id'] = mongoose.Types.ObjectId(req.body['country_id']);
    }
    State.find(condition, function(err, result) {
        if (err) return res.status(500).send(err);

        return res.status(responseCode.CODES.SUCCESS.OK).send(result);
    });

}

exports.cityListing = async(req, res) => {
    const condition = {}
    if ('state_id' in req.body) {
        condition['state_id'] = mongoose.Types.ObjectId(req.body['state_id']);
    }
    City.find(condition, function(err, result) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

        return res.status(responseCode.CODES.SUCCESS.OK).send(result);
    })

}

exports.cityInfo = async(req, res) => {
    const condition = {}
    if ('city_id' in req.body) {
        condition['_id'] = mongoose.Types.ObjectId(req.body['city_id']);
    }
    City.findOne(condition, function(err, result) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

        return res.status(responseCode.CODES.SUCCESS.OK).send(result);
    })

}


exports.deleteCity = async(req, res) => {

    let condition = {}
    condition['_id'] = mongoose.Types.ObjectId(req.body['id']);

    let record = await City.findOne(condition, { _id: 1 });

    if (!record) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));

    if (record) {
        City.deleteOne({ _id: mongoose.Types.ObjectId(req.body.id) }, function(err, doc) {
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
            return res.status(responseCode.CODES.SUCCESS.OK).send({ deleted: true });
        });
    }

}

exports.deleteState = async(req, res) => {

    let condition = {}
    condition['_id'] = mongoose.Types.ObjectId(req.body['id']);

    let record = await State.findOne(condition, { _id: 1 });

    if (!record) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));

    if (record) {
        State.deleteOne({ _id: mongoose.Types.ObjectId(req.body.id) }, function(err, doc) {
            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
            City.deleteMany({ state_id: mongoose.Types.ObjectId(req.body.id) }, function(err, doc) {
                if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
                return res.status(responseCode.CODES.SUCCESS.OK).send(true);
            });
        });

    }

}

exports.deleteCountry = async(req, res) => {

    let condition = {}
    condition['_id'] = mongoose.Types.ObjectId(req.body['id']);

    let record = await Country.findOne(condition, { _id: 1 });

    if (!record) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));

    if (record) {
        let stateRecord = await State.findOne({ country_id: mongoose.Types.ObjectId(record['id']) }, { _id: 1 });
        Country.deleteOne({ _id: mongoose.Types.ObjectId(req.body.id) }, function(err, doc) {
            if (err) return res.status(500).send({ error: 1 });
            State.deleteMany({ country_id: mongoose.Types.ObjectId(req.body.id) }, function(err, doc) {
                if (err) return res.status(500).send({ error: 2 });
                if (stateRecord == null) {
                    return res.status(responseCode.CODES.SUCCESS.OK).send(true);
                } else {
                    City.deleteMany({ state_id: mongoose.Types.ObjectId(stateRecord._id) }, function(err, doc) {
                        if (err) return res.status(500).send({ error: 3 });
                        return res.status(responseCode.CODES.SUCCESS.OK).send(true);
                    });
                }



            });
        });

    }

}
exports.changeStateStatus = async(req, res) => {
    let existingRecord = await State.findOne({ _id: mongoose.Types.ObjectId(req.body.id) }, { _id: 1 });

    if (!existingRecord) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));

    req.body['modified_at'] = new Date()
        //save city 
    State.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.id) }, { $set: { is_active: req.body.is_active } }, { new: true }, function(err, data) {

        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

        return res.status(responseCode.CODES.SUCCESS.OK).send(data);

    });
}
exports.changeCityStatus = async(req, res) => {
    let existingRecord = await City.findOne({ _id: mongoose.Types.ObjectId(req.body.id) }, { _id: 1 });

    if (!existingRecord) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));

    req.body['modified_at'] = new Date()
        //save city 
    City.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.id) }, { $set: { is_active: req.body.is_active } }, { new: true }, function(err, data) {

        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

        return res.status(responseCode.CODES.SUCCESS.OK).send(data);

    });
}

exports.changeCountryStatus = async(req, res) => {
    let existingRecord = await Country.findOne({ _id: mongoose.Types.ObjectId(req.body.id) }, { _id: 1 });

    if (!existingRecord) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));

    req.body['modified_at'] = new Date()
        //save city 
    Country.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.id) }, { $set: { is_active: req.body.is_active } }, { new: true }, function(err, data) {

        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

        return res.status(responseCode.CODES.SUCCESS.OK).send(data);

    });
}

exports.getActiveCities = async(req, res) => {
    const condition = {};
    condition['is_active'] = true;

    let limit = parseInt(7);
    let skip = parseInt(0);

    City.aggregate([{
            $match: condition
        },
        {

            "$lookup": {
                from: "countries",
                localField: "country_id",
                foreignField: "_id",
                as: "country"
            }
        },
        {

            "$lookup": {
                from: "states",
                localField: "state_id",
                foreignField: "_id",
                as: "state"
            }
        },
        {
            $project: {
                'title': 1,
                'is_active': 1,
                'zipcodes': 1,
                'image': 1,
                'state_id': 1,
                'country_id': 1,
                'modified_at': 1,
                'created_at': 1,
                'country.title': 1,
                'state.title': 1,

            },
        },
        {

            $skip: skip
        },
        {
            $limit: limit
        }

    ], function(err, records) {


        return res.status(responseCode.CODES.SUCCESS.OK).send(records);
    })

    /*
    City.find(condition, function(err, result) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

        return res.status(responseCode.CODES.SUCCESS.OK).send(result);
    }) */

}