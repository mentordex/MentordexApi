const _ = require('lodash');
const config = require('config');
const { Membership } = require('../schema/membership');
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
    const { title, description, price, type, price_id, product_id, is_active } = req.body

    if (_.has(req.body, ['id']) && (req.body.id)) {
        //checking unique Office
        let existingRecord = await Membership.findOne({ _id: mongoose.Types.ObjectId(req.body.id) }, { _id: 1 });

        if (!existingRecord) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));

        //update membership 
        const product = stripe.products.update(product_id, {
                name: title,
                description: description,
                active: is_active
            },
            async function(err, product) {
                if (err) {
                    console.log('err1', err)
                    handleStripeError(err, res)
                } // Car Token Error
                if (product) {
                    Membership.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.id) }, { $set: req.body }, { new: true }, function(err, type) {

                        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

                        return res.status(responseCode.CODES.SUCCESS.OK).send(type);

                    });
                }
            })


    } else {
        //checking unique membership
        let existingRecord = await Membership.findOne({ title: title }, { _id: 1 });

        if (existingRecord) return res.status(400).send(req.polyglot.t('TYPE-ALREADY-EXIST'));

        stripe.products.create({
                name: title,
                description: description,
                active: is_active
            },
            async function(err, product) {
                if (err) {
                    console.log('error', err)
                    handleStripeError(err, res)
                } // Car Token Error
                if (product) {
                    productData = { 'price': price, 'type': type, 'id': product.id }

                    savePrice = await saveNewPrice(productData, res); // Save New price
                    if (savePrice.id) {
                        //save membership 
                        req.body['price_id'] = savePrice.id
                        req.body['product_id'] = product.id
                        console.log('body', req.body)
                        let newRecord = new Membership(_.pick(req.body, ['title', 'description', 'price', 'type', 'product_id', 'price_id', 'is_active', 'created_at', 'modified_at']));

                        newRecord.save(async function(err, record) {

                            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

                            return res.status(responseCode.CODES.SUCCESS.OK).send(record);

                        });
                    }
                }
            }


        )
    }


}

exports.changeStatus = async(req, res) => {
    const { price_id, product_id, is_active } = req.body
    let existingRecord = await Membership.findOne({ _id: mongoose.Types.ObjectId(req.body.id) }, { _id: 1 });

    if (!existingRecord) return res.status(400).send(req.polyglot.t('NO-RECORD-FOUND'));

    stripe.products.update(product_id, {
            active: is_active
        },
        async function(err, product) {
            if (err) {
                console.log('err2', err)
                handleStripeError(err, res)
            } // Car Token Error
            if (product) {
                stripe.prices.update(
                    price_id, {
                        active: is_active
                    },
                    async function(err, price) {
                        if (err) {
                            console.log('err2', err)
                            handleStripeError(err, res)
                        } // Car Token Error
                        if (price) {
                            req.body['modified_at'] = new Date()
                                //update Office 
                            Membership.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.id) }, { $set: { is_active: req.body.is_active, modified_at: new Date() } }, { new: true }, function(err, data) {

                                if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

                                return res.status(responseCode.CODES.SUCCESS.OK).send(data);
                            })
                        }
                    }
                )
            }

        })
}

exports.listing = async(req, res) => {

    const { size, pageNumber } = req.body
    let condition = {};
    let sortBy = {};
    sortBy['created_at'] = 1

    if (_.has(req.body, ['search']) && (req.body['search']).length > 0) {
        condition['title'] = { $regex: req.body['search'], $options: 'i' }
            //condition['email'] =  { $regex: req.body['search'], $options: 'i' }   
    }

    let totalRecords = await Membership.count(condition);
    //calculating the limit and skip attributes to paginate records
    let totalPages = totalRecords / size;
    console.log('totalPages', totalPages);
    let start = pageNumber * size;

    let skip = (parseInt(pageNumber) * parseInt(size)) - parseInt(size);
    let limit = parseInt(size);


    let records = await Membership.find(condition).sort(sortBy).skip(skip).limit(limit);
    let data = {
        records: records,
        total_records: totalRecords
    }

    return res.status(responseCode.CODES.SUCCESS.OK).send(data);

}

exports.getMembershipPlans = async(req, res) => {
    let condition = {};
    condition['is_active'] = true;
    let fetchPlans = await Membership.find(condition);
    return res.status(responseCode.CODES.SUCCESS.OK).send(fetchPlans);
}

function saveNewPrice(productData, res) {
    // create a customer 
    return new Promise(function(resolve, reject) {
        return stripe.prices.create({
                unit_amount: productData.price,
                currency: 'usd',
                recurring: { interval: productData.type },
                product: productData.id,
            },
            function(err, price) {
                // asynchronously called
                if (err) {
                    //console.log('HEllo World 1');
                    reject(handleStripeError(err, res))
                } // Handle Customer Error

                resolve(price); // If Customer Successfully created

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