const { validator } = require('../validator/categorySubcategory.validator')
const { procErr } = require('../utilities/processErrors')
const { addCategory, addSubcategory, categoryListing, subcategoryListing, allSubcategory, deleteCategory, deleteSubcategory, uploadImage, changeSubcategoryStatus } = require('../controller/categorySubcategory.controller')
const tokenValidator = require('../utilities/token');//calling token checking middleware

// Routes =============================================================
module.exports = router => {

    router.post("/api/uploadImage", procErr, uploadImage)
    // POST route to mock a city add  endpoint
    router.post("/api/category/add", [validator('addCategory')], procErr, addCategory)

    router.get("/api/category/listing", procErr, categoryListing)

    

    // POST route to mock a neighbourhood add   endpoint
    router.post("/api/subcategory/add", validator('addSubcategory'), procErr, addSubcategory)

    router.post("/api/subcategory/listing", validator('subcategoryListing'), procErr, subcategoryListing)

    router.get("/api/subcategory/allSubcategory", procErr, allSubcategory)

    router.post("/api/category/deleteCategory", procErr, deleteCategory)

    router.post("/api/subcategory/deleteSubcategory", procErr, deleteSubcategory)
    router.post("/api/subcategory/changeSubcategoryStatus", procErr, changeSubcategoryStatus)
    
}