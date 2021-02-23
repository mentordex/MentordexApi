const { validator } = require('../validator/countryStateCity.validator')
const { procErr } = require('../utilities/processErrors')
const { addDayTimeslot, changeDayStatus } = require('../controller/day_timeslot.controller')
const tokenValidator = require('../utilities/token'); //calling token checking middleware

// Routes =============================================================
module.exports = router => {

    router.post("/api/dayTimeslot/add", addDayTimeslot)
    router.post("/api/dayTimeslot/changeDayStatus", changeDayStatus)

}