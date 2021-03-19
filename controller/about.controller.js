const _ = require('lodash');
const { About } = require('../schema/about');
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
    if ('_id' in req.body && req.body._id) {
        //update About 
        About.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body._id) }, { $set: req.body }, { new: true }, function(err, type) {

            if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

            return res.status(responseCode.CODES.SUCCESS.OK).send(type);

        });
    } else {

        //save city 
        newType = new About(req.body);
        newType['page_name'] = 'about'
        console.log('newType', newType)
        newType.save(async function(err, type) {

            if (err) return res.status(500).send(err);

            return res.status(responseCode.CODES.SUCCESS.OK).send(type);

        });
    }


}

exports.getAboutPage = async(req, res) => {
    About.findOne({}, function(err, result) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));

        return res.status(responseCode.CODES.SUCCESS.OK).send(result);
    });
}