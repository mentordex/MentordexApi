const { procErr } = require('../../utilities/processErrors')
const { validator } = require('../../validator/auth.validator')
const { login, adminListing, userListing, cityListing, stateListing,countryListing, propertyTypeListing, propertyListing, amenityListing, changeUserStatus, deleteUser, adminData, verifyToken, forgotPassword, updatePassword, changePassword, changeAdminStatus, deleteAdmin, addUpdateAdmin, changePropertyStatus, dashboard, adminProfile, updateProfile, categoryListing, subcategoryListing, faqcategoryListing   } = require('../../controller/admin/admin.controller')
const tokenValidator = require('../../utilities/token');//calling token checking middleware

// Routes =============================================================
module.exports = router => {

    // POST route to mock a login  endpoint
    router.post("/api/admin/login", [validator('login')],  procErr, login)
    
    router.post("/api/admin/listing", procErr, adminListing)

    router.post("/api/admin/userListing", procErr, userListing)

    router.post("/api/admin/cityListing", procErr, cityListing)
    router.post("/api/admin/stateListing", procErr, stateListing)
    router.post("/api/admin/countryListing", procErr, countryListing)

    router.post("/api/admin/categoryListing", procErr, categoryListing)

    router.post("/api/admin/categoryListing", procErr, categoryListing)

    router.post("/api/admin/subcategoryListing", procErr, subcategoryListing)

    router.post("/api/admin/faqcategoryListing", procErr, faqcategoryListing)
    

    router.post("/api/admin/propertyTypeListing", procErr, propertyTypeListing)

    router.post("/api/admin/propertyListing", procErr, propertyListing)

    router.post("/api/admin/amenityListing", procErr, amenityListing)

    router.post("/api/admin/changeStatus", procErr, changeUserStatus)

    router.post("/api/admin/changeAdminStatus", procErr, changeAdminStatus)

    
    router.post("/api/admin/deleteUser", procErr, deleteUser)

    router.post("/api/admin/deleteAdmin", procErr, deleteAdmin)
    

    router.post("/api/admin/adminData", procErr, adminData)

    // POST route to mock a forgotten password endpoint
    router.post("/api/admin/forgot-password", validator('forgotPassword'), procErr, forgotPassword)


    router.post("/api/admin/verifyToken", validator('verifyToken'), procErr, verifyToken)

    router.post("/api/admin/updatePassword", validator('updatePassword'), procErr, updatePassword)

    router.post("/api/admin/changePassword",  procErr, changePassword)

    router.post("/api/admin/addUpdateAdmin",  procErr, addUpdateAdmin)

    router.post("/api/admin/changePropertyStatus",  procErr, changePropertyStatus)

    router.post("/api/admin/dashboard",  procErr, dashboard)

    router.post("/api/admin/adminProfile",  procErr, adminProfile)
    
    router.post("/api/admin/updateProfile",  procErr, updateProfile)
    
    
}