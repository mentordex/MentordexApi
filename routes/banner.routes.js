const { procErr } = require('../utilities/processErrors')
const { add, listing, deleteBanner, changeStatus } = require('../controller/banner.controller')
const tokenValidator = require('../utilities/token');//calling token checking middleware

// Routes =============================================================
module.exports = router => {

    // POST route to mock a city add  endpoint
    router.post("/api/banner/add", procErr, add)

    router.get("/api/banner/listing", procErr, listing)

    router.post("/api/banner/deleteBanner", procErr, deleteBanner)

    router.post("/api/banner/changeStatus", procErr, changeStatus)
}