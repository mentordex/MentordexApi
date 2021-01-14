const { procErr } = require('../utilities/processErrors')
const { add, listing, deleteOffice } = require('../controller/office.controller')
const tokenValidator = require('../utilities/token');//calling token checking middleware

// Routes =============================================================
module.exports = router => {

    // POST route to mock a city add  endpoint
    router.post("/api/office/add", procErr, add)

    router.post("/api/office/listing", procErr, listing)

    router.post("/api/office/deleteOffice", procErr, deleteOffice)
}