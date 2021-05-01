const { validator } = require('../validator/auth.validator')
const { procErr } = require('../utilities/processErrors')
const { login, signup, forgotPassword, userProfileData, verifyToken, updatePassword, updateProfileInformation, contact, changePassword, updateMedia, memberListing, contactToAdmin, emailExist, officeListing, teamListing, getParentDetails, getMentorDetails, getMentorProfileDetails, resendMentorEmailVerification, resendMentorPhoneVerification, submitMentorPhoneVerification, verifyMentorEmail, updateParentInfo, checkEmailExists, onCompleteMentorApplication, updateBasicDetails, updateSkillsDetails, updateBookASlotDetails, updateProfileAcademicHistoryDetails, updateProfileBasicDetails, updateProfileEmploymentHistoryDetails, updateProfileHourlyRateDetails, updateProfileAchievementDetails, updateProfileSocialLinksDetails, buySubscription, addYourPaymentMethod, getSavedPaymentMethod, getMentorMembershipDetails, cancelYourSubscription, getMentorProfileDetailsById, getMentorSlotsByDate, uploadFile, deleteObject, testMail, updateNotes, search, subcategoryListing } = require('../controller/auth.controller')

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

    /* Parent Routes */
    router.post("/api/getParentDetails", [validator('getParentDetails')], procErr, getParentDetails)

    /* Mentor Routes */
    router.post("/api/getMentorDetails", [validator('getMentorDetails')], procErr, getMentorDetails)
    router.post("/api/getMentorProfileDetails", [validator('getMentorProfileDetails')], procErr, getMentorProfileDetails)
    router.post("/api/resendMentorEmailVerification", [validator('resendMentorEmailVerification')], procErr, resendMentorEmailVerification)
    router.post("/api/resendMentorPhoneVerification", [validator('resendMentorPhoneVerification')], procErr, resendMentorPhoneVerification)
    router.post("/api/submitMentorPhoneVerification", [validator('submitMentorPhoneVerification')], procErr, submitMentorPhoneVerification)
    router.post("/api/verifyMentorEmail", [validator('verifyMentorEmail')], procErr, verifyMentorEmail)
    router.post("/api/onCompleteMentorApplication", [validator('onCompleteMentorApplication')], procErr, onCompleteMentorApplication)
    router.post("/api/updateBasicDetails", [validator('updateBasicDetails')], procErr, updateBasicDetails)
    router.post("/api/updateSkillsDetails", [validator('updateSkillsDetails')], procErr, updateSkillsDetails)
    router.post("/api/updateBookASlotDetails", [validator('updateBookASlotDetails')], procErr, updateBookASlotDetails)
    router.post("/api/updateProfileBasicDetails", [validator('updateProfileBasicDetails')], procErr, updateProfileBasicDetails)
    router.post("/api/updateProfileAchievementDetails", [validator('updateProfileAchievementDetails')], procErr, updateProfileAchievementDetails)

    router.post("/api/updateProfileAcademicHistoryDetails", [validator('updateProfileAcademicHistoryDetails')], procErr, updateProfileAcademicHistoryDetails)


    router.post("/api/updateProfileEmploymentHistoryDetails", [validator('updateProfileEmploymentHistoryDetails')], procErr, updateProfileEmploymentHistoryDetails)

    router.post("/api/updateProfileHourlyRateDetails", [validator('updateProfileHourlyRateDetails')], procErr, updateProfileHourlyRateDetails)

    router.post("/api/updateProfileSocialLinksDetails", [validator('updateProfileSocialLinksDetails')], procErr, updateProfileSocialLinksDetails)

    router.post("/api/buySubscription", [validator('buySubscription')], procErr, buySubscription)

    router.post("/api/addYourPaymentMethod", [validator('addYourPaymentMethod')], procErr, addYourPaymentMethod)

    router.post("/api/getSavedPaymentMethod", [validator('getSavedPaymentMethod')], procErr, getSavedPaymentMethod)

    router.post("/api/getMentorMembershipDetails", [validator('getMentorMembershipDetails')], procErr, getMentorMembershipDetails)

    router.post("/api/cancelYourSubscription", [validator('cancelYourSubscription')], procErr, cancelYourSubscription)

    router.post("/api/getMentorProfileDetailsById", [validator('getMentorProfileDetailsById')], procErr, getMentorProfileDetailsById)

    router.post("/api/getMentorSlotsByDate", [validator('getMentorSlotsByDate')], procErr, getMentorSlotsByDate)

    router.post("/api/uploadFile", procErr, uploadFile)
    router.post("/api/deleteObject", procErr, deleteObject)
    router.post("/api/sendMail", procErr, testMail)

    router.post("/api/updateNotes", updateNotes)

    router.post("/api/search", search)
    router.post("/api/subcategoryListing", subcategoryListing)
}