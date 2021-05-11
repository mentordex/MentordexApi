const { procErr } = require('../utilities/processErrors')
const { add, listing, deleteReview, changeStatus } = require('../controller/review.controller')
const tokenValidator = require('../utilities/token');//calling token checking middleware

// Routes =============================================================
module.exports = router => {

    // POST route to mock a city add  endpoint
    router.post("/api/review/add", procErr, add)

    router.post("/api/review/listing", procErr, listing)

    router.post("/api/review/deleteReview", procErr, deleteReview)
    router.post("/api/review/changeStatus", procErr, changeStatus)

    
}