const { procErr } = require('../utilities/processErrors')
const { add, listing, deleteJobs, changeStatus } = require('../controller/jobs.controller')
const tokenValidator = require('../utilities/token'); //calling token checking middleware

// Routes =============================================================
module.exports = router => {

    // POST route to mock a city add  endpoint
    router.post("/api/jobs/add", procErr, add)

    router.post("/api/jobs/listing", procErr, listing)

    router.post("/api/jobs/deleteJobs", procErr, deleteJobs)
    router.post("/api/jobs/changeStatus", procErr, changeStatus)


}