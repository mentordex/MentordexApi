const { check } = require('express-validator');
/*
* Function to validate the user's input before passing it to the controller's functions
* Receives the function to validate for
* Validates the input using express-validator
* Returns the actual validations in the req, to be used later in the chain of functions
*/
exports.validator = functionName => {

    switch (functionName) {

        case 'addCategory': {
            return [                
                check('title')
                    .exists().withMessage('TITLE-REQUIRED'),
                check('image')
                    .exists().withMessage('IMAGE-REQUIRED')
            ]
        }

        case 'addSubcategory': {
            return [
                check('title')
                    .exists().withMessage('TITLE-REQUIRED'),                
                check('category_id')
                    .exists().withMessage('CATEGORY-ID-REQUIRED'),
                check('image')
                    .exists().withMessage('IMAGE-REQUIRED')
            ]
        }

        case 'subcategoryListing': {
            return [    
                check('category_id')
                    .exists().withMessage('CATEGORY-ID-REQUIRED'),
                check('category_id')
                    .not().isEmpty().withMessage('CATEGORY-ID-SHOULD-NOT-EMPTY')
                                          
                
            ]
        }
        

        
    }

}