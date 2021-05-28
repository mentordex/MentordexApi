const { procErr } = require('../utilities/processErrors')
const { add, listing, deleteJobs, changeStatus, newBookingRequest, upateBookingRequest, getMentorJobDetails, getMentorJobs, getParentJobDetails, chargePayment, getParentJobs, saveParentReview, saveMentorReview, cancelBookingRequest } = require('../controller/jobs.controller')
const tokenValidator = require('../utilities/token'); //calling token checking middleware

// Routes =============================================================
module.exports = router => {

    // POST route to mock a city add  endpoint
    router.post("/api/jobs/add", procErr, add)

    router.post("/api/jobs/listing", procErr, listing)

    router.post("/api/jobs/deleteJobs", procErr, deleteJobs)
    router.post("/api/jobs/changeStatus", procErr, changeStatus)
    router.post("/api/jobs/newBookingRequest", procErr, newBookingRequest)
    router.post("/api/jobs/upateBookingRequest", procErr, upateBookingRequest)
    router.post("/api/jobs/cancelBookingRequest", procErr, cancelBookingRequest)

    /* Mentor Job Functions */
    router.post("/api/jobs/getMentorJobDetails", procErr, getMentorJobDetails)
    router.post("/api/jobs/getMentorJobs", procErr, getMentorJobs)
    router.post("/api/jobs/saveMentorReview", procErr, saveMentorReview)


    /* Parent Job Functions */
    router.post("/api/jobs/getParentJobDetails", procErr, getParentJobDetails)
    router.post("/api/jobs/saveParentReview", procErr, saveParentReview)
    router.post("/api/jobs/chargePayment", procErr, chargePayment)
    router.post("/api/jobs/getParentJobs", procErr, getParentJobs)

}