const { validator } = require('../validator/countryStateCity.validator')
const { procErr } = require('../utilities/processErrors')
const { addCity, addState, addCountry, cityListing, countryListing, stateListing, deleteCountry, deleteCity, deleteState} = require('../controller/countryStateCity.controller')
const tokenValidator = require('../utilities/token');//calling token checking middleware

// Routes =============================================================
module.exports = router => {


    // POST route to mock a city add  endpoint
    router.post("/api/country/add", [validator('addCountry')], procErr, addCountry)
    router.post("/api/state/add", [validator('addState')], procErr, addState)
    router.post("/api/city/add", [validator('addCity')], procErr, addCity)

    router.get("/api/country/listing", procErr, countryListing)
    router.post("/api/state/listing", procErr, stateListing)
    router.get("/api/city/listing",  procErr, cityListing)

    router.post("/api/state/deleteState", procErr, deleteState)
    router.post("/api/city/deleteCity", procErr, deleteCity)
    router.post("/api/country/deleteCountry", procErr, deleteCountry)

}