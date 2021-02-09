const { validator } = require('../validator/auth.validator')
const { procErr } = require('../utilities/processErrors')
const { login, signup, forgotPassword, userProfileData, verifyToken, updatePassword, updateProfileInformation, contact, changePassword, updateMedia, memberListing, contactToAdmin, emailExist, officeListing, teamListing, getMentorDetails, resendMentorEmailVerification, resendMentorPhoneVerification, submitMentorPhoneVerification, verifyMentorEmail, updateParentInfo, checkEmailExists, onCompleteMentorApplication, updateBasicDetails, updateSkillsDetails } = require('../controller/auth.controller')
const tokenValidator = require('../utilities/token'); //calling token checking middleware

// Routes =============================================================
module.exports = router => {

    // POST route to mock a login  endpoint
    router.post("/api/updateParentInfo", updateParentInfo)
    router.post("/api/checkEmail", [validator('emailExist')], procErr, emailExist)

    // POST route to mock a login  endpoint
    router.post("/api/login", [validator('login')], procErr, login)

    // POST route to mock a signup  endpoint
    router.post("/api/signup", validator('signup'), procErr, signup)

    router.post("/api/checkEmailExists", validator('checkEmailExists'), procErr, checkEmailExists)

    // POST route to mock a forgotten password endpoint
    router.post("/api/forgot-password", validator('forgotPassword'), procErr, forgotPassword)

    router.post("/api/userProfileData", [tokenValidator, validator('userProfileData')], procErr, userProfileData)

    router.post("/api/verifyToken", validator('verifyToken'), procErr, verifyToken)

    router.post("/api/updatePassword", validator('updatePassword'), procErr, updatePassword)

    router.post("/api/updateProfileInformation", procErr, updateProfileInformation)

    router.post("/api/contact", procErr, contact)

    router.post("/api/changePassword", procErr, changePassword)

    router.post("/api/updateMedia", procErr, updateMedia)

    router.post("/api/memberListing", procErr, memberListing)

    router.post("/api/contactToAdmin", procErr, contactToAdmin)

    router.get("/api/offices", procErr, officeListing)

    router.get("/api/team", procErr, teamListing)



    /* Mentor Routes */
    router.post("/api/getMentorDetails", [validator('getMentorDetails')], procErr, getMentorDetails)
    router.post("/api/resendMentorEmailVerification", [validator('resendMentorEmailVerification')], procErr, resendMentorEmailVerification)
    router.post("/api/resendMentorPhoneVerification", [validator('resendMentorPhoneVerification')], procErr, resendMentorPhoneVerification)
    router.post("/api/submitMentorPhoneVerification", [validator('submitMentorPhoneVerification')], procErr, submitMentorPhoneVerification)
    router.post("/api/verifyMentorEmail", [validator('verifyMentorEmail')], procErr, verifyMentorEmail)
    router.post("/api/onCompleteMentorApplication", [validator('onCompleteMentorApplication')], procErr, onCompleteMentorApplication)
    router.post("/api/updateBasicDetails", [validator('updateBasicDetails')], procErr, updateBasicDetails)
    router.post("/api/updateSkillsDetails", [validator('updateSkillsDetails')], procErr, updateSkillsDetails)

}