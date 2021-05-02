const { procErr } = require('../utilities/processErrors')
const { add, listing, changeStatus, getMembershipPlans } = require('../controller/membership.controller')
const tokenValidator = require('../utilities/token'); //calling token checking middleware

// Routes =============================================================
module.exports = router => {

    // POST route to mock a add  endpoint
    router.post("/api/membership/add", procErr, add)

    router.post("/api/membership/listing", procErr, listing)

    router.post("/api/membership/changeStatus", procErr, changeStatus)

    router.get("/api/membership/getMembershipPlans", procErr, getMembershipPlans)
}