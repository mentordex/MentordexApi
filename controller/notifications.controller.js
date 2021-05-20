const _ = require('lodash');
const { Jobs } = require('../schema/jobs');
const { Notifications } = require('../schema/notifications');
const { User } = require('../schema/user');
const responseCode = require('../utilities/responseCode');
var mongoose = require('mongoose');

/*exports.getNotifications = async(req, res) => {

    const { userID } = req.body

    Notifications.find({ user_id: userID }, function(err, result) {
        if (err) return res.status(500).send(req.polyglot.t('SYSTEM-ERROR'));
        return res.status(responseCode.CODES.SUCCESS.OK).send(result);
    }).sort({ created_at: -1 });
}
*/



exports.getNotifications = async(req, res) => {
    //console.log(req.body);
    let condition = {};
    const { userID } = req.body

    // Check Valid User
    let existingUser = await User.findOne({ _id: userID });

    if (!existingUser) return res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send(req.polyglot.t('ACCOUNT-NOT-REGISTERD'));

    condition['user_id'] = mongoose.Types.ObjectId(userID);
    //condition['is_archived'] = false;
    Notifications.aggregate([{
            $match: condition
        },
        { $sort: { created_at: -1 } },
        {
            "$lookup": {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user",
            }
        },
        {
            $project: {
                'notification_type': 1,
                'notification': 1,
                'job_id': 1,
                'user_id': 1,
                'user_type': 1,
                'is_read': 1,
                'created_at': 1,
                'user.first_name': 1,
                'user.last_name': 1,
                'user.profile_image': 1,
            },
        },
        { $unwind: "$user" }
    ], function(err, notificationDetails) {
        if (err) { console.log(err) }

        return res.status(responseCode.CODES.SUCCESS.OK).send(notificationDetails);
    })

}