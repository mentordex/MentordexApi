const { validator } = require('../validator/auth.validator')
const { procErr } = require('../utilities/processErrors')
const { login, signup, forgotPassword, userProfileData, verifyToken, updatePassword, updateProfileInformation, contact, changePassword, updateMedia, memberListing, contactToAdmin } = require('../controller/auth.controller')
const tokenValidator = require('../utilities/token');//calling token checking middleware

// Routes =============================================================
module.exports = router => {

    // POST route to mock a login  endpoint
    router.post("/api/login", [validator('login')], procErr, login)

    // POST route to mock a signup  endpoint
    router.post("/api/signup", validator('signup'), procErr, signup)

    // POST route to mock a forgotten password endpoint
    router.post("/api/forgot-password", validator('forgotPassword'), procErr, forgotPassword)

    router.post("/api/userProfileData", [tokenValidator, validator('userProfileData')], procErr, userProfileData)

    router.post("/api/verifyToken", validator('verifyToken'), procErr, verifyToken)

    router.post("/api/updatePassword", validator('updatePassword'), procErr, updatePassword)

    router.post("/api/updateProfileInformation",  procErr, updateProfileInformation)

    router.post("/api/contact",  procErr, contact)

    router.post("/api/changePassword",  procErr, changePassword)

    router.post("/api/updateMedia",  procErr, updateMedia)

    router.post("/api/memberListing",  procErr, memberListing)

    router.post("/api/contactToAdmin",  procErr, contactToAdmin)
    
    
}