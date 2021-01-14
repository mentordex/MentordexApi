const { procErr } = require('../utilities/processErrors')
const { add, listing, deletePropertyType } = require('../controller/propertyType.controller')
const tokenValidator = require('../utilities/token');//calling token checking middleware

// Routes =============================================================
module.exports = router => {

    // POST route to mock a city add  endpoint
    router.post("/api/propertyType/add", procErr, add)

    router.get("/api/propertyType/listing", procErr, listing)

    router.post("/api/propertyType/deletePropertyType", procErr, deletePropertyType)
}