const { check } = require('express-validator');
/*
 * Function to validate the user's input before passing it to the controller's functions
 * Receives the function to validate for
 * Validates the input using express-validator
 * Returns the actual validations in the req, to be used later in the chain of functions
 */
exports.validator = functionName => {

    switch (functionName) {


        case 'emailExist':
            {
                return [
                    check('email')
                    .exists().withMessage('emailRequiredField')
                ]
            }

        case 'login':
            {
                return [
                    check('email')
                    .exists().withMessage('emailRequiredField')
                    .isEmail().withMessage('emailIsEmail'),

                    check('password')
                    .exists().withMessage('passwordRequiredField')
                ]
            }

        case 'signup':
            {
                return [
                    check('email')
                    .exists().withMessage('emailRequiredField')
                    .isEmail().withMessage('emailIsEmail'),

                    check('password')
                    .exists().withMessage('passwordRequiredField')
                ]
            }

        case 'checkEmailExists':
            {
                return [
                    check('email')
                    .exists().withMessage('emailRequiredField')
                    .isEmail().withMessage('emailIsEmail'),
                ]
            }

        case 'forgotPassword':
            {
                return [
                    check('email')
                    .exists().withMessage('emailRequiredField')
                    .isEmail().withMessage('emailIsEmail')
                ]
            }

        case 'userProfileData':
            {
                return [
                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }

        case 'verifyToken':
            {
                return [
                    check('token')
                    .exists().withMessage('TOKEN-ID-REQUIRED')
                ]
            }

        case 'updatePassword':
            {
                return [
                    check('id')
                    .exists().withMessage('USER-ID-REQUIRED'),

                    check('password')
                    .exists().withMessage('passwordRequiredField')
                ]
            }
            // Mentor Functions        
        case 'getMentorDetails':
            {
                return [
                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }

        case 'getMentorProfileDetails':
            {
                return [
                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }

        case 'resendMentorEmailVerification':
            {
                return [
                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }
        case 'resendMentorPhoneVerification':
            {
                return [
                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }

        case 'onCompleteMentorApplication':
            {
                return [
                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }
        case 'updateBasicDetails':
            {
                return [
                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }

        case 'updateSkillsDetails':
            {
                return [
                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }

        case 'updateBookASlotDetails':
            {
                return [
                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }

        case 'updateProfileAcademicHistoryDetails':
            {
                return [
                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }
        case 'updateProfileBasicDetails':
            {
                return [
                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }
        case 'updateProfileEmploymentHistoryDetails':
            {
                return [
                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }
        case 'updateProfileAchievementDetails':
            {
                return [
                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }

        case 'updateProfileHourlyRateDetails':
            {
                return [
                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }
        case 'updateProfileSocialLinksDetails':
            {
                return [
                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }

        case 'buySubscription':
            {
                return [
                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }

        case 'addYourPaymentMethod':
            {
                return [
                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }
        case 'getSavedPaymentMethod':
            {
                return [
                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }

        case 'getMentorProfileDetailsById':
            {
                return [
                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED'),

                    check('mentorId')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }

        case 'submitMentorPhoneVerification':
            {
                return [

                    check('phoneToken')
                    .exists().withMessage('TOKEN-ID-REQUIRED'),

                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }
        case 'verifyMentorEmail':
            {
                return [

                    check('emailToken')
                    .exists().withMessage('TOKEN-ID-REQUIRED'),

                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }

    }

}