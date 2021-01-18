const { procErr } = require('../utilities/processErrors')
const { add, listing, deleteAmenity } = require('../controller/amenity.controller')
const tokenValidator = require('../utilities/token');//calling token checking middleware

// Routes =============================================================
module.exports = router => {

    // POST route to mock a city add  endpoint
    router.post("/api/amenity/add", procErr, add)

    router.post("/api/faqs/listing", procErr, listing)
    router.get("/api/amenity/listing", procErr, listing)
    router.post("/api/amenity/deleteAmenity", procErr, deleteAmenity)
}