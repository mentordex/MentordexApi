const { procErr } = require('../utilities/processErrors')
const { add, listing, deleteTeam, changeStatus } = require('../controller/team.controller')
const tokenValidator = require('../utilities/token');//calling token checking middleware

// Routes =============================================================
module.exports = router => {

    // POST route to mock a city add  endpoint
    router.post("/api/team/add", procErr, add)

    router.post("/api/team/listing", procErr, listing)

    router.post("/api/team/deleteTeam", procErr, deleteTeam)
    router.post("/api/team/changeStatus", procErr, changeStatus)

    
}