var md5 = require('md5');
const { User } = require('../schema/user');
const userObject = new User();
const responseCode = require('../utilities/responseCode');



module.exports = function (req, res, next) {
    const token = req.header('x-mentordex-auth-token');

    if (!token) return res.status(responseCode.CODES.CLIENT_ERROR.UNAUTHORIZED).send('Access denied. No token provided.');  

    next();
    /*try {
        
        next();
    } catch (e) {
        winston.error(e.message, e);
        res.status(responseCode.CODES.CLIENT_ERROR.BAD_REQUEST).send('Invalid token');
    }*/
   
}
