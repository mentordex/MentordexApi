const { check } = require('express-validator');
/*
* Function to validate the user's input before passing it to the controller's functions
* Receives the function to validate for
* Validates the input using express-validator
* Returns the actual validations in the req, to be used later in the chain of functions
*/
exports.validator = functionName => {

    switch (functionName) {

        
        case 'emailExist': {
            return [
                check('email')
                    .exists().withMessage('emailRequiredField')                   
            ]
        }
        
        case 'login': {
            return [
                check('email')
                    .exists().withMessage('emailRequiredField')
                    .isEmail().withMessage('emailIsEmail'),
            
                check('password')
                    .exists().withMessage('passwordRequiredField')
            ]
        }

        case 'signup': {
            return [
                check('email')
                    .exists().withMessage('emailRequiredField')
                    .isEmail().withMessage('emailIsEmail'),
            
                check('password')
                    .exists().withMessage('passwordRequiredField')
            ]
        }

        case 'forgotPassword': {
            return [
                check('email')
                    .exists().withMessage('emailRequiredField')
                    .isEmail().withMessage('emailIsEmail')
            ]
        }

        case 'userProfileData': {
            return [
                check('userID')
                    .exists().withMessage('USER-ID-REQUIRED')
            ]
        }

        case 'verifyToken': {
            return [
                check('token')
                    .exists().withMessage('TOKEN-ID-REQUIRED')
            ]
        }

        case 'updatePassword': {
            return [
                check('token')
                    .exists().withMessage('TOKEN-ID-REQUIRED'),
                
                check('password')
                    .exists().withMessage('passwordRequiredField')
            ]
        }
    }

}