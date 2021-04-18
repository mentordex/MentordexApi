const _ = require('lodash');
const { Jobs } = require('../schema/jobs');
const responseCode = require('../utilities/responseCode');
var mongoose = require('mongoose');

/*
 * Here we would probably call the DB to confirm the user exists
 * Then validate if they're authorized to login
 * Create a JWT or a cookie
 * Send an email to that address with the URL to login directly to change their password
 * And finally let the user know their email is waiting for them at their inbox
 */
exports.add = async(req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { name, title, image, description } = req.body

    if (_.has(req.body, ['id']) && (req.body.id)) {
        //checking unique Office
        let existingJobs = await Jobs.findOne({ _id: mongoose.Types.ObjectId(req.body.id) }, { _id: 1 });

        if (!existingJobs) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));

        //update Jobs 
        Jobs.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.id) }, { $set: req.body }, { new: true }, function(err, type) {

            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

            return res.status(responseCode.CODES.SUCCESS.OK).send(type);

        });
    } else {


        //save Jobs 
        newJobs = new Jobs(_.pick(req.body, ['job_title', 'job_description', 'category_id', 'subcategory_id', 'parent_id', 'mentor_id', 'booking_time', 'hourly_rate', 'booking_date', 'job_status', 'job_active', 'created_at', 'modified_at']));

        newJobs.save(async function(err, type) {

            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

            return res.status(responseCode.CODES.SUCCESS.OK).send(type);

        });
    }


}



exports.listing = async(req, res) => {

    const { size, pageNumber } = req.body
    let condition = {};
    let sortBy = {};
    sortBy['created_at'] = -1

    if (_.has(req.body, ['search']) && (req.body['search']).length > 0) {
        condition['job_title'] = { $regex: req.body['search'], $options: 'i' }
        condition['job_description'] = { $regex: req.body['search'], $options: 'i' }
    }

    let totalRecords = await Jobs.count(condition);
    //calculating the limit and skip attributes to paginate records
    let totalPages = totalRecords / size;
    console.log('totalPages', totalPages);
    let start = pageNumber * size;

    let skip = (parseInt(pageNumber) * parseInt(size)) - parseInt(size);
    let limit = parseInt(size);


    let records = await Jobs.find(condition).skip(skip).limit(limit).sort(sortBy);
    let data = {
        records: records,
        total_records: totalRecords
    }

    return res.status(responseCode.CODES.SUCCESS.OK).send(data);



}

exports.deleteJobs = async(req, res) => {

    Jobs.deleteOne({ _id: mongoose.Types.ObjectId(req.body.id) }, function(err, doc) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
        return res.status(responseCode.CODES.SUCCESS.OK).send(true);
    });

}


exports.changeStatus = async(req, res) => {
    let existingRecord = await Jobs.findOne({ _id: mongoose.Types.ObjectId(req.body.id) }, { _id: 1 });

    if (!existingRecord) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));

    req.body['modified_at'] = new Date()
        //update Office 
    Jobs.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.id) }, { $set: { is_active: req.body.is_active } }, { new: true }, function(err, data) {

        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

        return res.status(responseCode.CODES.SUCCESS.OK).send(data);

    });
}

exports.newBookingRequest = async(req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { job_title, job_description, category_id, subcategory_id, parent_id, mentor_id, booking_time, hourly_rate, booking_date } = req.body

    //save Jobs 
    newJobs = new Jobs(_.pick(req.body, ['job_title', 'job_description', 'category_id', 'subcategory_id', 'job_file', 'parent_id', 'mentor_id', 'booking_time', 'hourly_rate', 'booking_date', 'job_status', 'job_active', 'created_at', 'modified_at']));

    newJobs.save(async function(err, newJob) {

        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

        return res.status(responseCode.CODES.SUCCESS.OK).send(newJob);

    });



}