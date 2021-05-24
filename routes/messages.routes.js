const { procErr } = require('../utilities/processErrors')
const { getMentorMessages, getMentorJobMessages, getMentorJobsById, getMentorJobs, saveMentorMessage, getParentJobs, getParentJobMessages, saveParentMessage, getParentJobsById } = require('../controller/messages.controller')
const tokenValidator = require('../utilities/token'); //calling token checking middleware

// Routes =============================================================
module.exports = router => {
    router.post("/api/messages/getMentorMessages", procErr, getMentorMessages)
    router.post("/api/messages/getMentorJobMessages", procErr, getMentorJobMessages)
    router.post("/api/messages/getParentJobMessages", procErr, getParentJobMessages)
    router.post("/api/messages/getMentorJobsById", procErr, getMentorJobsById)
    router.post("/api/messages/getParentJobsById", procErr, getParentJobsById)
    router.post("/api/messages/getMentorJobs", procErr, getMentorJobs)
    router.post("/api/messages/getParentJobs", procErr, getParentJobs)
    router.post("/api/messages/saveMentorMessage", procErr, saveMentorMessage)
    router.post("/api/messages/saveParentMessage", procErr, saveParentMessage)
}