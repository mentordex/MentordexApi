const { procErr } = require('../utilities/processErrors')
const { getNotifications } = require('../controller/notifications.controller')
const tokenValidator = require('../utilities/token'); //calling token checking middleware

// Routes =============================================================
module.exports = router => {

    // POST route to mock a city add  endpoint

    router.post("/api/notifications/getNotifications", procErr, getNotifications)


}