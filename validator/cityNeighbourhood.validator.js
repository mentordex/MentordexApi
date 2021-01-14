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
                    .exists().withMessage('TITLE-REQUIRED')
            ]
        }

        case 'addNeighbourhood': {
            return [
                check('title')
                    .exists().withMessage('TITLE-REQUIRED'),                
                check('city_id')
                    .exists().withMessage('CITY-ID-REQUIRED')
            ]
        }

        case 'neighbourhoodListing': {
            return [    
                check('city_id')
                    .exists().withMessage('CITY-ID-REQUIRED'),
                check('city_id')
                    .not().isEmpty().withMessage('CITY-ID-SHOULD-NOT-EMPTY')
                                          
                
            ]
        }
        

        
    }

}