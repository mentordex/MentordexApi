const _ = require('lodash');
const config = require('config');
const { Transactions } = require('../schema/transactions');
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