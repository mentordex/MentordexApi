const _ = require('lodash');
const { Jobs } = require('../schema/jobs');
const { Notifications } = require('../schema/notifications');
const { Messages } = require('../schema/messages');
const { User } = require('../schema/user');
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

    let notificationArray = [];
    let messagesArray = [];

    // If no validation errors, get the req.body objects that were validated and are needed
    const { job_title, job_description, job_file, category_id, subcategory_id, parent_id, mentor_id, booking_time, hourly_rate, booking_date } = req.body

    //save Jobs 
    newJobs = new Jobs(_.pick(req.body, ['job_title', 'job_description', 'category_id', 'subcategory_id', 'job_file', 'parent_id', 'mentor_id', 'booking_time', 'hourly_rate', 'booking_date', 'job_status', 'job_active', 'created_at', 'modified_at']));

    newJobs.save(async function(err, newJob) {

        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));


        // Add New Messages
        messagesArray['message'] = job_description
        messagesArray['sender_id'] = parent_id
        messagesArray['receiver_id'] = mentor_id
        messagesArray['job_id'] = newJob._id
        messagesArray['message_file'] = job_file

        let newMessage = new Messages(_.pick(messagesArray, ['message', 'sender_id', 'receiver_id', 'job_id', 'message_file', 'is_read', 'created_at', 'modified_at']));
        newMessage.save(async function(err, record) {});


        // Add New Notification
        notificationArray['notification_type'] = 'BOOKING'
        notificationArray['notification'] = req.polyglot.t('NEW-BOOKING-REQUEST')
        notificationArray['job_id'] = newJob._id
        notificationArray['user_id'] = req.body.userID
        notificationArray['user_type'] = 'MENTOR'

        let newNotification = new Notifications(_.pick(notificationArray, ['notification_type', 'notification', 'job_id', 'user_id', 'user_type', 'created_at', 'modified_at']));

        newNotification.save(async function(err, record) {});


        return res.status(responseCode.CODES.SUCCESS.OK).send(newJob);

    });



}


exports.getJobDetails = async(req, res) => {
    //console.log(req.body);
    let condition = {};
    const { userID, jobId } = req.body

    // Check Valid User
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));


    condition['_id'] = mongoose.Types.ObjectId(jobId);
    condition['mentor_id'] = mongoose.Types.ObjectId(userID);
    Jobs.aggregate([{
            $match: condition
        },
        {

            "$lookup": {
                from: "categories",
                localField: "category_id",
                foreignField: "_id",
                as: "category",
            }
        },
        {
            "$lookup": {
                from: "users",
                localField: "parent_id",
                foreignField: "_id",
                as: "parent",
            }
        },
        {
            "$lookup": {
                from: "subcategories",
                localField: "subcategory_id",
                foreignField: "_id",
                as: "subcategory",
            }
        },
        {
            $project: {
                'job_status': 1,
                'job_active': 1,
                'created_at': 1,
                'job_title': 1,
                'job_description': 1,
                'job_file': 1,
                'parent_id': 1,
                'mentor_id': 1,
                'hourly_rate': 1,
                'booking_time': 1,
                'booking_date': 1,
                'parent.first_name': 1,
                'parent.last_name': 1,
                'parent.state': 1,
                'parent.city': 1,
                'parent.ratings': 1,
                'category_id': 1,
                'category.title': 1,
                'subcategory_id': 1,
                'subcategory.title': 1
            },
        },
        { $unwind: "$category" },
        { $unwind: "$subcategory" },
        { $unwind: "$parent" }
    ], function(err, jobDetails) {
        if (err) { console.log(err) }
        //console.log(jobDetails)
        //let data = {records: profileDetails}
        return res.status(responseCode.CODES.SUCCESS.OK).send(jobDetails[0]);
    })

}

exports.upateBookingRequest = async(req, res) => {

    let notificationArray = [];
    let messagesArray = [];
    let notificationMsg = '';

    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID, jobId, job_status, job_message, parent_id } = req.body

    // Check Valid User
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    // Check Job Exist
    let existingRecord = await Jobs.findOne({ _id: mongoose.Types.ObjectId(jobId) }, { _id: 1 });

    if (!existingRecord) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));

    //save Jobs 
    Jobs.findOneAndUpdate({ _id: mongoose.Types.ObjectId(jobId) }, { $set: { job_status: job_status } }, { new: true }, function(err, data) {

        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

        // Send Message to Parent
        messagesArray['message'] = job_message
        messagesArray['sender_id'] = userID
        messagesArray['receiver_id'] = parent_id
        messagesArray['job_id'] = jobId
            //messagesArray['message_file'] = job_file

        let newMessage = new Messages(_.pick(messagesArray, ['message', 'sender_id', 'receiver_id', 'job_id', 'is_read', 'created_at', 'modified_at']));
        newMessage.save(async function(err, record) {});


        if (job_status == 'ACCEPTED') {
            notificationMsg = req.polyglot.t('BOOKING-ACCEPTED')
        } else {
            notificationMsg = req.polyglot.t('BOOKING-CANCELLED')
        }


        // Send New Notification To Parent
        notificationArray['notification_type'] = 'BOOKING'
        notificationArray['notification'] = notificationMsg
        notificationArray['job_id'] = jobId
        notificationArray['user_id'] = parent_id
        notificationArray['user_type'] = 'PARENT'

        let newNotification = new Notifications(_.pick(notificationArray, ['notification_type', 'notification', 'job_id', 'user_id', 'user_type', 'created_at', 'modified_at']));

        newNotification.save(async function(err, record) {});
        return res.status(responseCode.CODES.SUCCESS.OK).send(true);

    });



}