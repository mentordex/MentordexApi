//const { validator } = require('../validator/categorySubcategory.validator')
const { procErr } = require('../utilities/processErrors')
const { addCategory,categoryListing, deleteCategory } = require('../controller/faqcategory.controller')
const tokenValidator = require('../utilities/token');//calling token checking middleware

// Routes =============================================================
module.exports = router => {


    // POST route to mock a city add  endpoint
    router.post("/api/faqcategory/add",  procErr, addCategory)

    router.get("/api/faqcategory/listing", procErr, categoryListing)


    router.post("/api/faqcategory/deleteCategory", procErr, deleteCategory)
   
}