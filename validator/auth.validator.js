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

        case 'checkGoogleLogin':
            {
                return [
                    check('email')
                    .exists().withMessage('emailRequiredField')
                    .isEmail().withMessage('emailIsEmail')
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
        case 'getUserDetails':
            {
                return [
                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }

            // Parent Functions        
        case 'getParentDetails':
            {
                return [
                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED')
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

        case 'updateParentProfile':
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
        case 'addYourBankAccount':
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
        case 'getSavedBankAccounts':
            {
                return [
                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }

        case 'getMentorMembershipDetails':
            {
                return [
                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }

        case 'cancelYourSubscription':
            {
                return [
                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }
        case 'upgradeYourSubscription':
            {
                return [
                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }

        case 'defaultCard':
            {
                return [
                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }

        case 'defaultBankAccount':
            {
                return [
                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }
        case 'removeCard':
            {
                return [
                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }

        case 'removeBankAccount':
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

        case 'getMentorReviewsById':
            {
                return [
                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED'),

                    check('mentorId')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }

        case 'saveMentor':
            {
                return [
                    check('userID')
                    .exists().withMessage('USER-ID-REQUIRED'),

                    check('mentorId')
                    .exists().withMessage('USER-ID-REQUIRED')
                ]
            }

        case 'getMentorSlotsByDate':
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