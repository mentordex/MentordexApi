const { procErr } = require('../utilities/processErrors')
const { uploadImage, addProperty, deletePropertyImage, listing, deleteProperty, propertyInformation, checkAndUpdateViewCount, dashboardChart, recentActivities, dashboard, featuredListing, editablePropertyInformation, homePageFeaturedListing, searchProperty, updateProperty } = require('../controller/property.controller')
const tokenValidator = require('../utilities/token');//calling token checking middleware

// Routes =============================================================
module.exports = router => {

    // POST route to upload a propert image  endpoint
    router.post("/api/property/uploadImage", [tokenValidator], procErr, uploadImage)
    router.post("/api/property/add", [tokenValidator], procErr, addProperty)
    router.post("/api/property/listing", [tokenValidator], procErr, listing)
    router.post("/api/property/featuredListing", [tokenValidator], procErr, featuredListing)
    router.post("/api/property/deleteProperty", [tokenValidator], procErr, deleteProperty)
    router.post("/api/property/deletePropertyImage", [tokenValidator], procErr, deletePropertyImage)
    router.post("/api/property/propertyInformation", procErr, propertyInformation)
    router.post("/api/property/checkAndUpdateViewCount",  procErr, checkAndUpdateViewCount)
    router.post("/api/property/dashboard", [tokenValidator], procErr, dashboard)
    router.post("/api/property/dashboardChart", [tokenValidator], procErr, dashboardChart)
    router.post("/api/property/recentActivities", [tokenValidator], procErr, recentActivities)
    router.post("/api/property/editablePropertyInformation", [tokenValidator], procErr, editablePropertyInformation)

    router.get("/api/property/homePageFeaturedListing", procErr, homePageFeaturedListing)

    router.post("/api/property/searchProperty", procErr, searchProperty)
    
    router.post("/api/property/updateProperty", procErr, updateProperty)
    
}   