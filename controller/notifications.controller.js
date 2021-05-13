const _ = require('lodash');
const { Jobs } = require('../schema/jobs');
const { Notifications } = require('../schema/notifications');
const { User } = require('../schema/user');
const responseCode = require('../utilities/responseCode');
var mongoose = require('mongoose');

exports.getNotifications = async(req, res) => {

    const { userID } = req.body

    Notifications.find({ user_id: userID }, function(err, result) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
        return res.status(responseCode.CODES.SUCCESS.OK).send(result);
    }).sort({ created_at: -1 });
}