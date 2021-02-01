const { check } = require('express-validator');
/*
* Function to validate the user's input before passing it to the controller's functions
* Receives the function to validate for
* Validates the input using express-validator
* Returns the actual validations in the req, to be used later in the chain of functions
*/
exports.validator = functionName => {

    switch (functionName) {

        case 'addCity': {
            return [                
                check('title')
                    .exists().withMessage('TITLE-REQUIRED'),
               
                check('country_id')
                    .exists().withMessage('COUNTRY-ID-REQUIRED'),
                check('country_id')
                    .not().isEmpty().withMessage('COUNTRY-ID-SHOULD-NOT-EMPTY'),
                check('state_id')
                    .exists().withMessage('STATE-ID-REQUIRED'),
                    
                check('is_active')
                    .exists().withMessage('STATUS-ID-REQUIRED')
            ]
        }

        case 'addState': {
            return [
                check('title')
                    .exists().withMessage('TITLE-REQUIRED'),                
                check('country_id')
                    .exists().withMessage('COUNTRY-ID-REQUIRED'),
                check('country_id')
                    .not().isEmpty().withMessage('COUNTRY-ID-SHOULD-NOT-EMPTY'),
                check('is_active')
                    .exists().withMessage('STATUS-ID-REQUIRED')
            ]
        }

        case 'addCountry': {
            return [
                check('title')
                    .exists().withMessage('TITLE-REQUIRED'),      
             
                check('is_active')
                    .exists().withMessage('STATUS-ID-REQUIRED')
            ]
        }  
        

        
    }

}