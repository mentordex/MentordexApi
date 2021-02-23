const _ = require('lodash');
const config = require('config');
const { DayTimeslot } = require('../schema/day_timeslot');
const responseCode = require('../utilities/responseCode');
var mongoose = require('mongoose');

exports.addDayTimeslot = async(req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { day, is_active } = req.body


    if (_.has(req.body, ['id']) && (req.body.id) != null) {

        let dayRecord = await DayTimeslot.findOne({ day: day }, { _id: 1 });
        if (dayRecord && (dayRecord['_id'] != req.body.id)) {
            return res.status(400).send(req.polyglot.t('DAY-ALREADY-EXIST'));
        }

        //checking unique Country
        let existingRecord = await DayTimeslot.findOne({ _id: mongoose.Types.ObjectId(req.body.id) }, { _id: 1 });

        if (!existingRecord) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));

        req.body['modified_at'] = new Date()
            //save Day timeslot 
        DayTimeslot.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.id) }, { $set: req.body }, { new: true }, function(err, type) {

            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

            return res.status(responseCode.CODES.SUCCESS.OK).send(type);

        });
    } else {
        let dayRecord = await DayTimeslot.findOne({ day: day }, { _id: 1 });
        if (dayRecord) return res.status(400).send(req.polyglot.t('DAY-ALREADY-EXIST'));

        //save day with time slots 
        newRecord = new DayTimeslot(_.pick(req.body, ['day', 'slots', 'is_active', 'created_at', 'modified_at']));

        newRecord.save(async function(err, data) {

            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

            return res.status(responseCode.CODES.SUCCESS.OK).send(data);

        });
    }

}


exports.changeDayStatus = async(req, res) => {
    let existingRecord = await DayTimeslot.findOne({ _id: mongoose.Types.ObjectId(req.body.id) }, { _id: 1 });

    if (!existingRecord) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));

    req.body['modified_at'] = new Date()
        //save city 
    DayTimeslot.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.id) }, { $set: { is_active: req.body.is_active } }, { new: true }, function(err, data) {

        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

        return res.status(responseCode.CODES.SUCCESS.OK).send(data);

    });
}

exports.getAvailableSlots = async(req, res) => {

    let existingRecord = await DayTimeslot.findOne({ day: req.body.day, is_active: true }, { slots: 1, });

    if (!existingRecord) return res.status(responseCode.CODES.SUCCESS.OK).send({ slots: false });
    //if (!existingRecord) return res.status(400).send(req.polyglot.t('NO-SLOTS-FOUND'));

    return res.status(responseCode.CODES.SUCCESS.OK).send(existingRecord);

}