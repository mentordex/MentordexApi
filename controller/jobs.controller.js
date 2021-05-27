const _ = require('lodash');
const config = require('config');
const { Jobs } = require('../schema/jobs');
const { Transactions } = require('../schema/transactions');
const { Notifications } = require('../schema/notifications');
const { Messages } = require('../schema/messages');
const { User } = require('../schema/user');
const responseCode = require('../utilities/responseCode');
var mongoose = require('mongoose');
const stripe = require('stripe')(config.get('stripeConfig.sandboxSecretKey'));

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
    //console.log('totalPages', totalPages);
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
        notificationArray['user_id'] = mentor_id
        notificationArray['user_type'] = 'MENTOR'

        let newNotification = new Notifications(_.pick(notificationArray, ['notification_type', 'notification', 'job_id', 'user_id', 'user_type', 'created_at', 'modified_at']));

        newNotification.save(async function(err, record) {});


        return res.status(responseCode.CODES.SUCCESS.OK).send(newJob);

    });



}

exports.getMentorJobs = async(req, res) => {
    //console.log(req.body);
    const { size, pageNumber, sort_dir, sort_by, userID } = req.body
    let condition = {};
    let acceptedCondition = {};
    let cancelledCondition = {};
    let completedCondition = {};
    let andcondition = []
    let sortBy = {}
    sortBy[sort_by] = (sort_dir == 'desc') ? -1 : 1

    // Check Valid User
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    condition['mentor_id'] = mongoose.Types.ObjectId(userID);

    if (_.has(req.body.filters, ['job_status']) && req.body.filters['job_status'] != 'ALL') {
        condition['job_status'] = req.body.filters['job_status'];
    }

    if (_.has(req.body.filters, ['search']) && (req.body.filters['search']) != '') {
        andcondition.push({
            $or: [
                { job_title: { $regex: req.body.filters['search'], $options: 'i' } },
                { job_description: { $regex: req.body.filters['search'], $options: 'i' } }
            ]
        })
    }

    if (andcondition.length > 0) {
        condition['$and'] = andcondition
    }



    acceptedCondition['job_status'] = 'ACCEPTED';
    cancelledCondition['job_status'] = 'CANCELLED';
    completedCondition['job_status'] = 'COMPLETED';
    acceptedCondition = {...condition, ...acceptedCondition }
    cancelledCondition = {...condition, ...cancelledCondition }
    completedCondition = {...condition, ...completedCondition }

    //console.log(cancelledCondition);

    let totalRecords = await Jobs.count(condition);
    let totalAcceptedRecords = await Jobs.count(acceptedCondition);
    let totalCancelledRecords = await Jobs.count(cancelledCondition);
    let totalCompletedRecords = await Jobs.count(completedCondition);


    let skip = (parseInt(pageNumber) * parseInt(size)) - parseInt(size);
    let limit = parseInt(size);

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
                'parent_review': 1,
                'mentor_review': 1,
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
        { $sort: sortBy },
        { $skip: skip },
        { $limit: limit },

        { $unwind: "$category" },
        { $unwind: "$subcategory" },
        { $unwind: "$parent" }
    ], function(err, jobs) {
        if (err) { console.log(err) }
        let data = {
            records: jobs,
            total_records: totalRecords,
            total_accepted_records: totalAcceptedRecords,
            total_cancelled_records: totalCancelledRecords,
            total_completed_records: totalCompletedRecords,
            condition: condition,
            sortBy: sortBy,
            err: err
        }
        return res.status(responseCode.CODES.SUCCESS.OK).send(data);
    })

}

exports.getMentorJobDetails = async(req, res) => {
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
                'parent_review': 1,
                'mentor_review': 1,
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
    const { userID, job_id, job_status, job_message, parent_id } = req.body

    // Check Valid User
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    // Check Job Exist
    let existingRecord = await Jobs.findOne({ _id: mongoose.Types.ObjectId(job_id) }, { _id: 1 });

    if (!existingRecord) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));

    //save Jobs 
    Jobs.findOneAndUpdate({ _id: mongoose.Types.ObjectId(job_id) }, { $set: { job_status: job_status } }, { new: true }, function(err, data) {

        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

        // Send Message to Parent
        messagesArray['message'] = job_message
        messagesArray['sender_id'] = userID
        messagesArray['receiver_id'] = parent_id
        messagesArray['job_id'] = job_id
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
        notificationArray['job_id'] = job_id
        notificationArray['user_id'] = parent_id
        notificationArray['user_type'] = 'PARENT'

        let newNotification = new Notifications(_.pick(notificationArray, ['notification_type', 'notification', 'job_id', 'user_id', 'user_type', 'created_at', 'modified_at']));

        newNotification.save(async function(err, record) {});

        return res.status(responseCode.CODES.SUCCESS.OK).send(true);

    });



}

exports.saveParentReview = async(req, res) => {

    const { userID, job_id, parent_id, rating, review } = req.body

    // Check Valid User
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));


    let existingJob = await Jobs.findOne({ _id: mongoose.Types.ObjectId(job_id) });

    if (!existingJob) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));



    existingJob.parent_review.review = review;
    existingJob.parent_review.rating = rating;

    existingJob.save(function(err, job) {

        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR')); // todo: don't forget to handle err

        return res.status(responseCode.CODES.SUCCESS.OK).send(true);
    });
}

/* Parent Job Functions */

exports.getParentJobDetails = async(req, res) => {
    //console.log(req.body);
    let condition = {};
    const { userID, jobId } = req.body

    // Check Valid User
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));


    condition['_id'] = mongoose.Types.ObjectId(jobId);
    condition['parent_id'] = mongoose.Types.ObjectId(userID);
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
                localField: "mentor_id",
                foreignField: "_id",
                as: "mentor",
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
                'parent_review': 1,
                'mentor_review': 1,
                'hourly_rate': 1,
                'booking_time': 1,
                'booking_date': 1,
                'mentor.first_name': 1,
                'mentor.last_name': 1,
                'mentor.state': 1,
                'mentor.city': 1,
                'mentor.ratings': 1,
                'category_id': 1,
                'category.title': 1,
                'subcategory_id': 1,
                'subcategory.title': 1
            },
        },
        { $unwind: "$category" },
        { $unwind: "$subcategory" },
        { $unwind: "$mentor" }
    ], function(err, jobDetails) {
        if (err) { console.log(err) }
        //console.log(jobDetails)
        //let data = {records: profileDetails}
        return res.status(responseCode.CODES.SUCCESS.OK).send(jobDetails[0]);
    })

}

exports.chargePayment = async(req, res) => {
    let condition = {};
    let paymentDetailsArray = [];
    let transactionArray = [];
    let notificationArray = [];
    let messagesArray = [];
    let notificationMsg = '';


    const { userID, job_id, job_status, job_message, mentor_id } = req.body

    // Check Valid User
    let parent = await User.findOne({ _id: userID });

    if (!parent) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    if (isEmpty(parent.stripe_customer_id) || isEmpty(parent.payment_details)) {
        return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('NO-PAYMENT-METHOD-FOUND'));
    }

    let mentor = await User.findOne({ _id: mongoose.Types.ObjectId(mentor_id) });

    if (!mentor) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    if (isEmpty(mentor.stripe_customer_id) || isEmpty(mentor.payment_details)) {
        return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('NO-PAYMENT-METHOD-FOUND'));
    }

    // Check Job Exist
    let existingJob = await Jobs.findOne({ _id: mongoose.Types.ObjectId(job_id) });

    if (!existingJob) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('NO-RECORD-FOUND'));

    let calculateMentorPrice;
    let mentorServiceFeeData = {};
    // Charge Seller Service Fee	

    let parentChargeAmount = existingJob.hourly_rate * 100;


    const charge = await stripe.charges.create({
        amount: parentChargeAmount,
        currency: 'usd',
        customer: parent.stripe_customer_id,
        description: 'Job:' + existingJob.job_title + '.',
    }, function(err, chargeItem) {
        if (err) {
            //console.log(err);
            handleStripeError(err, res)
        } // Handle Invoice Item Error

        // get default payment method details
        paymentDetailsArray = parent.payment_details.filter(function(item) {
            return item.default === true;
        });

        //console.log('paymentDetailsArray', paymentDetailsArray);
        //console.log('aymentDetailsArray.stripe_card_id', paymentDetailsArray['stripe_card_id']);
        console.log('invoice', chargeItem);

        if (chargeItem.status == 'succeeded' && chargeItem.paid == true) {

            Jobs.findOneAndUpdate({ _id: mongoose.Types.ObjectId(job_id) }, { $set: { job_status: job_status } }, { new: true }, function(err, data) {});

            // Send Message to Parent
            messagesArray['message'] = job_message
            messagesArray['sender_id'] = userID
            messagesArray['receiver_id'] = mentor_id
            messagesArray['job_id'] = job_id
                //messagesArray['message_file'] = job_file

            let newMessage = new Messages(_.pick(messagesArray, ['message', 'sender_id', 'receiver_id', 'job_id', 'is_read', 'created_at', 'modified_at']));
            newMessage.save(async function(err, record) {});


            // Save New Transaction
            transactionArray['transaction_type'] = 'Job Completed'
            transactionArray['user_id'] = req.body.userID
            transactionArray['job_id'] = req.body.job_id
            transactionArray['receipt_url'] = chargeItem.receipt_url
            transactionArray['price'] = existingJob.hourly_rate
            transactionArray['invoice_id'] = chargeItem.invoice;
            transactionArray['payment_details'] = { 'stripe_card_id': paymentDetailsArray[0].stripe_card_id, 'credit_card_number': paymentDetailsArray[0].credit_card_number, 'card_type': paymentDetailsArray[0].card_type, 'card_holder_name': paymentDetailsArray[0].card_holder_name, 'exp_year': paymentDetailsArray[0].exp_year, 'exp_month': paymentDetailsArray[0].exp_month };
            transactionArray['user_type'] = 'PARENT'

            let newTransaction = new Transactions(_.pick(transactionArray, ['transaction_type', 'user_id', 'user_type', 'job_id', 'invoice_id', 'payment_details', 'receipt_url', 'created_at', 'modified_at']));

            newTransaction.save(async function(err, record) {});

            // Send Notification To Mentor
            notificationMsg = parent.first_name + ' has marked the job as completed.';
            notificationArray['notification_type'] = 'BOOKING'
            notificationArray['notification'] = notificationMsg
            notificationArray['job_id'] = job_id
            notificationArray['user_id'] = mentor_id
            notificationArray['user_type'] = 'MENTOR'

            let newNotification = new Notifications(_.pick(notificationArray, ['notification_type', 'notification', 'job_id', 'user_id', 'user_type', 'created_at', 'modified_at']));
            newNotification.save(async function(err, record) {});

            return res.status(responseCode.CODES.SUCCESS.OK).send(true);
        } else {
            return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('PAYMENT-FAILED'));
        }


    });

    /*stripe.invoiceItems.create({
        customer: parent.stripe_customer_id,
        amount: parentChargeAmount,
        currency: 'usd',
        description: 'Job:' + existingJob.job_title + '.',
    }, function(err, invoiceItem) {
        if (err) {
            console.log(err);
            handleStripeError(err, res)
        } // Handle Invoice Item Error

        console.log('invoice', invoiceItem);

        stripe.invoices.create({
            customer: parent.stripe_customer_id,
            collection_method: 'charge_automatically',
            auto_advance: true,
            custom_fields: [{ 'name': 'job_id', 'value': req.body.job_id }]
        }, function(err, invoice) {
            // asynchronously called
            if (err) {
                console.log(err);
                handleStripeError(err, res)
            } // Handle Seller Invoice Error
            console.log('invoice', invoice);

        });

    });

    */


}

function chargeMentorServiceAmount(dealerServiceFeeData, res) {
    //console.log('dealerServiceFeeData',dealerServiceFeeData);
    let serviceFee = dealerServiceFeeData.dealer_service_fee * 100;
    let sellerServiceFeeInvoiceData = {};
    let dealerServiceFeeInvoiceData = {};
    stripe.invoiceItems.create({
        customer: dealerServiceFeeData.dealer_customer_id,
        amount: serviceFee,
        currency: 'usd',
        description: 'Dealer Service Fee for VIN:' + dealerServiceFeeData.vin_number + '.',
    }, function(err, invoiceItem) {
        // Handle Invoice Item Error 
        if (err) {
            //console.log('dsfsdf');
            // Delete Seller Invoice and show Error
            removeInvoice(dealerServiceFeeData.seller_invoice_id);

            handleStripeError(err, res)
        }

        stripe.invoices.create({
            customer: dealerServiceFeeData.dealer_customer_id,
            collection_method: 'charge_automatically',
            auto_advance: true,
            custom_fields: [{ 'name': 'car_id', 'value': dealerServiceFeeData.car_id }, { 'name': 'vin_number', 'value': dealerServiceFeeData.vin_number }]
        }, function(err, invoice) {
            // asynchronously called
            if (err) {
                removeInvoice(dealerServiceFeeData.seller_invoice_id);
                handleStripeError(err, res); // Handle Invoice Error
            }
            //console.log('invoice',invoice);
            // Save Seller Invoice
            sellerServiceFeeInvoiceData = { 'vin_number': dealerServiceFeeData.vin_number, 'car_id': dealerServiceFeeData.car_id, 'transaction_id': dealerServiceFeeData.seller_invoice_id, 'transaction_status': dealerServiceFeeData.seller_invoice_status, 'transaction_type': 'service_fee', 'user_type': 'seller', 'user_id': dealerServiceFeeData.seller_id };
            payment = new Payment(_.pick(sellerServiceFeeInvoiceData, ['vin_number', 'car_id', 'user_type', 'user_id', 'transaction_id', 'transaction_status', 'transaction_type']));

            payment.save(async(err, seller) => {
                if (err) {
                    console.log('err is', err);
                    return res.status(def.API_STATUS.SERVER_ERROR.INTERNAL_SERVER_ERROR).send(err);
                }

                // Save Dealer Invoice
                dealerServiceFeeInvoiceData = { 'vin_number': dealerServiceFeeData.vin_number, 'car_id': dealerServiceFeeData.car_id, 'transaction_id': invoice.id, 'transaction_status': invoice.status, 'transaction_type': 'service_fee', 'user_type': 'dealer', 'user_id': dealerServiceFeeData.dealer_id };

                payment = new Payment(_.pick(dealerServiceFeeInvoiceData, ['vin_number', 'car_id', 'user_type', 'user_id', 'transaction_id', 'transaction_status', 'transaction_type']));
                payment.save(async(err, dealer) => {
                    if (err) {
                        console.log('errr is', err);
                        return res.status(def.API_STATUS.SERVER_ERROR.INTERNAL_SERVER_ERROR).send(err);
                    }

                    return res.status(def.API_STATUS.SUCCESS.OK).send({ success: 'Payment has been processed successfully.' });
                });
            });
        });
    });
}

function removeInvoice(invoiceId) {
    stripe.invoices.del(
        invoiceId,
        function(err, confirmation) {
            if (err) { handleStripeError(err, res); } // Handle Delete Invoice Error
            // asynchronously called
            console.log('confirmation', confirmation)
        }
    );
}

function calculateMentorAmount(mentorPrice) {
    let chargeAmount;
    if (mentorPrice >= 1) {
        var num = parseFloat(mentorPrice);
        chargeAmount = num - (num * .10); // 10 percent deduction
    } else {
        chargeAmount = 0;
    }

    return chargeAmount;
}

function isEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            return false;
    }
    return true;
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