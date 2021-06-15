const _ = require('lodash');
const config = require('config');
const { Transactions } = require('../schema/transactions');
const { Jobs } = require('../schema/jobs');
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


exports.getTransactions = async(req, res) => {
    const { size, pageNumber, sort_dir, sort_by, userID } = req.body
    let condition = {};
    let andcondition = []
    let sortBy = {}
    sortBy[sort_by] = (sort_dir == 'asc') ? -1 : 1
    condition['user_id'] = mongoose.Types.ObjectId(userID);



    let totalRecords = await Transactions.count(condition);


    let skip = (parseInt(pageNumber) * parseInt(size)) - parseInt(size);
    let limit = parseInt(size);


    Transactions.aggregate([{
            $match: condition
        },

        {
            $project: {
                transaction_type: 1,
                transaction_status: 1,
                user_id: 1,
                user_type: 1,
                invoice_id: 1,
                receipt_url: 1,
                price: 1,
                payment_details: 1,
                created_at: 1,
                rating: 1
            },
        },
        { $sort: sortBy },
        { $skip: skip },
        { $limit: limit }




    ], function(err, trasnactions) {

        let data = {
            records: trasnactions,
            total_records: totalRecords,
            condition: condition,
            sortBy: sortBy,
            err: err
        }
        return res.status(responseCode.CODES.SUCCESS.OK).send(data);
    })

}

exports.fetchInvoicesById = async(req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID } = req.body
    let data = {};

    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    userData = { 'invoice_id': req.body.invoice_id }

    let invoice = await getInvoiceDetails(userData);

    if (invoice.id) {
        data = {
            invoice_pdf: invoice.invoice_pdf,
            invoice_url: invoice.hosted_invoice_url,
            invoice_number: invoice.number,
        }
        return res.status(responseCode.CODES.SUCCESS.OK).send(data);
    } else {
        return res.status(responseCode.CODES.SUCCESS.OK).send({});
    }

    //console.log(invoice);

}


exports.fetchJobsById = async(req, res) => {

    // If no validation errors, get the req.body objects that were validated and are needed
    const { userID, job_id } = req.body
    let data = {};

    //checking unique email
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    let existingJobs = await Jobs.findOne({ _id: mongoose.Types.ObjectId(job_id) });

    if (!existingJobs) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('NO-RECORD-FOUND'));

    data = {
        job_title: existingJobs.job_title
    }
    return res.status(responseCode.CODES.SUCCESS.OK).send(data);
    //console.log(invoice);

}


function getInvoiceDetails(userData, res) {
    // update a subscription 
    return new Promise(function(resolve, reject) {

        return stripe.invoices.retrieve(
            userData.invoice_id,
            function(err, invoice) {
                // asynchronously called
                if (err) {
                    //console.log(err);
                    reject(handleStripeError(err, res))
                } // Handle Customer Error

                resolve(invoice); // If Customer Successfully created

            });
    });

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