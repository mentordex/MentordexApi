const { procErr } = require('../utilities/processErrors')
const { add} = require('../controller/about.controller')
const tokenValidator = require('../utilities/token');//calling token checking middleware

// Routes =============================================================
module.exports = router => {

    // POST route to mock a city add  endpoint
    router.post("/api/about/add", procErr, add)

    

}