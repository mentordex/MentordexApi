const _ = require('lodash');
const config = require('config');
const { Messages } = require('../schema/messages');
const { Jobs } = require('../schema/jobs');
const { User } = require('../schema/user');
const { Notifications } = require('../schema/notifications');
const responseCode = require('../utilities/responseCode');
var mongoose = require('mongoose');


exports.getMentorMessages = async(req, res) => {
    //console.log(req.body);
    let jobCondition = {};
    let msgCondition = {};
    let sortBy = {};
    sortBy['created_at'] = -1

    const { userID } = req.body

    // Check Valid User
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    jobCondition['mentor_id'] = mongoose.Types.ObjectId(userID);

    let fetchJobs = Jobs.find(jobCondition, async function(err, jobs) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
        //console.log(jobs);
        if (jobs.length > 0) {

            const promises = [];

            await jobs.forEach(async function(job, index, sourceArr) {

                msgCondition['job_id'] = mongoose.Types.ObjectId(job._id);

                //promises.push(getMessagesByJobId(msgCondition, res));
                //console.log(msgCondition);
                let fetchMessages = await getMessagesByJobId(msgCondition, res)
                    //console.log(fetchMessages);
                jobs[index].push({ 'messages': fetchMessages });
                console.log(jobs[index]);
            })

            //const outputs = await Promise.all(promises);
            //console.log(outputs);
            //return res.status(responseCode.CODES.SUCCESS.OK).send(jobs);
        } else {
            return res.status(responseCode.CODES.SUCCESS.OK).send(jobs);
        }


    }).sort(sortBy);






}

exports.getMentorJobs = async(req, res) => {
    //console.log(req.body);
    let jobCondition = {};

    let sortBy = {};
    sortBy['created_at'] = -1

    const { userID } = req.body

    // Check Valid User
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    jobCondition['mentor_id'] = mongoose.Types.ObjectId(userID);

    Jobs.aggregate([{
            $match: jobCondition
        },
        { $sort: { created_at: -1 } },
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
                from: "users",
                localField: "mentor_id",
                foreignField: "_id",
                as: "mentor",
            }
        },
        {
            $project: {
                'job_title': 1,
                'job_description': 1,
                'parent_id': 1,
                'mentor_id': 1,
                'booking_time': 1,
                'hourly_rate': 1,
                'booking_date': 1,
                'job_active': 1,
                'created_at': 1,
                'modified_at': 1,
                'job_status': 1,
                'mentor.first_name': 1,
                'mentor.last_name': 1,
                'mentor.profile_image': 1,
                'parent.first_name': 1,
                'parent.last_name': 1,
                'parent.profile_image': 1,
            },
        },
        { $unwind: "$mentor" },
        { $unwind: "$parent" }
    ], function(err, jobDetails) {
        if (err) { console.log(err); }
        return res.status(responseCode.CODES.SUCCESS.OK).send(jobDetails);
    })


    /* let fetchJobs = Jobs.find(jobCondition, async function(err, jobs) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
        //console.log(jobs);
        return res.status(responseCode.CODES.SUCCESS.OK).send(jobs);
    }).sort(sortBy);
    */
}


exports.getMentorJobsById = async(req, res) => {
    //console.log(req.body);
    let jobCondition = {};

    let sortBy = {};
    sortBy['created_at'] = -1

    const { userID, job_id } = req.body

    // Check Valid User
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    jobCondition['mentor_id'] = mongoose.Types.ObjectId(userID);
    jobCondition['_id'] = mongoose.Types.ObjectId(job_id);

    Jobs.aggregate([{
            $match: jobCondition
        },
        { $sort: { created_at: -1 } },
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
                from: "users",
                localField: "mentor_id",
                foreignField: "_id",
                as: "mentor",
            }
        },
        {
            $project: {
                'job_title': 1,
                'job_description': 1,
                'parent_id': 1,
                'mentor_id': 1,
                'booking_time': 1,
                'hourly_rate': 1,
                'booking_date': 1,
                'job_active': 1,
                'created_at': 1,
                'modified_at': 1,
                'job_status': 1,
                'mentor.first_name': 1,
                'mentor.last_name': 1,
                'mentor.profile_image': 1,
                'parent.first_name': 1,
                'parent.last_name': 1,
                'parent.profile_image': 1,
            },
        },
        { $unwind: "$mentor" },
        { $unwind: "$parent" }
    ], function(err, jobDetails) {
        if (err) { console.log(err); }
        return res.status(responseCode.CODES.SUCCESS.OK).send(jobDetails);
    })
}


exports.getMentorJobMessages = async(req, res) => {
    //console.log(req.body);
    let msgCondition = {};

    let sortBy = {};
    sortBy['created_at'] = -1

    const { userID, job_id } = req.body

    // Check Valid User
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    msgCondition['job_id'] = mongoose.Types.ObjectId(job_id);

    Messages.aggregate([{
            $match: msgCondition
        },
        { $sort: { created_at: 1 } },
        {
            "$lookup": {
                from: "users",
                localField: "sender_id",
                foreignField: "_id",
                as: "sender",
            }
        },
        {
            "$lookup": {
                from: "users",
                localField: "receiver_id",
                foreignField: "_id",
                as: "receiver",
            }
        },
        {
            $project: {
                'sender_id': 1,
                'receiver_id': 1,
                'job_id': 1,
                'message_file': 1,
                'is_read': 1,
                'message': 1,
                'created_at': 1,
                'sender.first_name': 1,
                'sender.last_name': 1,
                'sender.profile_image': 1,
                'receiver.first_name': 1,
                'receiver.last_name': 1,
                'receiver.profile_image': 1,
            },
        },
        { $unwind: "$sender" },
        { $unwind: "$receiver" }
    ], function(err, messagesDetails) {
        if (err) { console.log(err); }
        return res.status(responseCode.CODES.SUCCESS.OK).send(messagesDetails);
    })
}

exports.saveMentorMessage = async(req, res) => {
    let messagesArray = [];
    let notificationArray = [];
    const { userID, message, job_id, message_file, parent_id } = req.body

    // Check Valid User
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    // Add New Messages
    messagesArray['message'] = message
    messagesArray['sender_id'] = userID
    messagesArray['receiver_id'] = parent_id
    messagesArray['job_id'] = job_id
    messagesArray['message_file'] = message_file

    let newMessage = new Messages(_.pick(messagesArray, ['message', 'sender_id', 'receiver_id', 'job_id', 'message_file', 'is_read', 'created_at', 'modified_at']));

    newMessage.save(async function(err, response) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
        //console.log(response);
        // Add New Notification
        notificationArray['notification_type'] = 'MESSAGE'
        notificationArray['notification'] = req.polyglot.t('NEW-MESSAGE-RECEIVED')
        notificationArray['job_id'] = job_id
        notificationArray['user_id'] = parent_id
        notificationArray['message_id'] = response._id;
        notificationArray['user_type'] = 'PARENT'

        //console.log(notificationArray);

        let newNotification = new Notifications(_.pick(notificationArray, ['notification_type', 'notification', 'job_id', 'message_id', 'user_id', 'user_type', 'created_at', 'modified_at']));

        newNotification.save(async function(err, record) {});

        return res.status(responseCode.CODES.SUCCESS.OK).send(true);

    });

}


exports.getParentJobs = async(req, res) => {
    //console.log(req.body);
    let jobCondition = {};

    let sortBy = {};
    sortBy['created_at'] = -1

    const { userID } = req.body

    // Check Valid User
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    jobCondition['parent_id'] = mongoose.Types.ObjectId(userID);

    Jobs.aggregate([{
            $match: jobCondition
        },
        { $sort: { created_at: -1 } },
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
                from: "users",
                localField: "mentor_id",
                foreignField: "_id",
                as: "mentor",
            }
        },
        {
            $project: {
                'job_title': 1,
                'job_description': 1,
                'parent_id': 1,
                'mentor_id': 1,
                'booking_time': 1,
                'hourly_rate': 1,
                'booking_date': 1,
                'job_active': 1,
                'created_at': 1,
                'modified_at': 1,
                'job_status': 1,
                'mentor.first_name': 1,
                'mentor.last_name': 1,
                'mentor.profile_image': 1,
                'parent.first_name': 1,
                'parent.last_name': 1,
                'parent.profile_image': 1,
            },
        },
        { $unwind: "$mentor" },
        { $unwind: "$parent" }
    ], function(err, jobDetails) {
        if (err) { console.log(err); }
        return res.status(responseCode.CODES.SUCCESS.OK).send(jobDetails);
    })

}


exports.getParentJobsById = async(req, res) => {
    //console.log(req.body);
    let jobCondition = {};

    let sortBy = {};
    sortBy['created_at'] = -1

    const { userID, job_id } = req.body

    // Check Valid User
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    jobCondition['parent_id'] = mongoose.Types.ObjectId(userID);
    jobCondition['_id'] = mongoose.Types.ObjectId(job_id);

    Jobs.aggregate([{
            $match: jobCondition
        },
        { $sort: { created_at: -1 } },
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
                from: "users",
                localField: "mentor_id",
                foreignField: "_id",
                as: "mentor",
            }
        },
        {
            $project: {
                'job_title': 1,
                'job_description': 1,
                'parent_id': 1,
                'mentor_id': 1,
                'booking_time': 1,
                'hourly_rate': 1,
                'booking_date': 1,
                'job_active': 1,
                'created_at': 1,
                'modified_at': 1,
                'job_status': 1,
                'mentor.first_name': 1,
                'mentor.last_name': 1,
                'mentor.profile_image': 1,
                'parent.first_name': 1,
                'parent.last_name': 1,
                'parent.profile_image': 1,
            },
        },
        { $unwind: "$mentor" },
        { $unwind: "$parent" }
    ], function(err, jobDetails) {
        if (err) { console.log(err); }
        return res.status(responseCode.CODES.SUCCESS.OK).send(jobDetails);
    })
}


exports.getParentJobMessages = async(req, res) => {
    //console.log(req.body);
    let msgCondition = {};

    let sortBy = {};
    sortBy['created_at'] = -1

    const { userID, job_id } = req.body

    // Check Valid User
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    msgCondition['job_id'] = mongoose.Types.ObjectId(job_id);

    Messages.aggregate([{
            $match: msgCondition
        },
        { $sort: { created_at: 1 } },
        {
            "$lookup": {
                from: "users",
                localField: "sender_id",
                foreignField: "_id",
                as: "sender",
            }
        },
        {
            "$lookup": {
                from: "users",
                localField: "receiver_id",
                foreignField: "_id",
                as: "receiver",
            }
        },
        {
            $project: {
                'sender_id': 1,
                'receiver_id': 1,
                'job_id': 1,
                'message_file': 1,
                'is_read': 1,
                'message': 1,
                'created_at': 1,
                'sender.first_name': 1,
                'sender.last_name': 1,
                'sender.profile_image': 1,
                'receiver.first_name': 1,
                'receiver.last_name': 1,
                'receiver.profile_image': 1,
            },
        },
        { $unwind: "$sender" },
        { $unwind: "$receiver" }
    ], function(err, messagesDetails) {
        if (err) { console.log(err); }
        return res.status(responseCode.CODES.SUCCESS.OK).send(messagesDetails);
    })
}

exports.saveParentMessage = async(req, res) => {
    let messagesArray = [];
    let notificationArray = [];
    const { userID, message, job_id, message_file, mentor_id } = req.body

    // Check Valid User
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    // Add New Messages
    messagesArray['message'] = message
    messagesArray['sender_id'] = userID
    messagesArray['receiver_id'] = mentor_id
    messagesArray['job_id'] = job_id
    messagesArray['message_file'] = message_file

    let newMessage = new Messages(_.pick(messagesArray, ['message', 'sender_id', 'receiver_id', 'job_id', 'message_file', 'is_read', 'created_at', 'modified_at']));

    newMessage.save(async function(err, response) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
        //console.log(response);
        // Add New Notification
        notificationArray['notification_type'] = 'MESSAGE'
        notificationArray['notification'] = req.polyglot.t('NEW-MESSAGE-RECEIVED')
        notificationArray['job_id'] = job_id
        notificationArray['message_id'] = response._id;
        notificationArray['user_id'] = mentor_id
        notificationArray['user_type'] = 'PARENT'

        //console.log(notificationArray);

        let newNotification = new Notifications(_.pick(notificationArray, ['notification_type', 'notification', 'job_id', 'message_id', 'user_id', 'user_type', 'created_at', 'modified_at']));

        newNotification.save(async function(err, record) {});

        return res.status(responseCode.CODES.SUCCESS.OK).send(true);

    });

}



function getMessagesByJobId(msgCondition, res) {
    // create a customer 
    return new Promise(function(resolve, reject) {

        return Messages.aggregate([{
                $match: msgCondition
            },
            { $sort: { created_at: -1 } },
            {
                "$lookup": {
                    from: "users",
                    localField: "sender_id",
                    foreignField: "_id",
                    as: "sender",
                }
            },
            {
                "$lookup": {
                    from: "users",
                    localField: "receiver_id",
                    foreignField: "_id",
                    as: "receiver",
                }
            },
            {
                $project: {
                    'sender_id': 1,
                    'receiver_id': 1,
                    'job_id': 1,
                    'message_file': 1,
                    'is_read': 1,
                    'message': 1,
                    'created_at': 1,
                    'sender.first_name': 1,
                    'sender.last_name': 1,
                    'sender.profile_image': 1,
                    'receiver.first_name': 1,
                    'receiver.last_name': 1,
                    'receiver.profile_image': 1,
                },
            },
            { $unwind: "$sender" },
            { $unwind: "$receiver" }
        ], function(err, notificationDetails) {
            if (err) {
                console.log(err);
                reject(err);
            }
            resolve(notificationDetails);
        })



    });

}