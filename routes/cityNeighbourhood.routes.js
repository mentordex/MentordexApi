const { validator } = require('../validator/cityNeighbourhood.validator')
const { procErr } = require('../utilities/processErrors')
const { addCity, addNeighbourhood, cityListing, neighbourhoodListing, allNeighbourhoods, deleteCity, deleteNeighborhood } = require('../controller/cityNeighbourhood.controller')
const tokenValidator = require('../utilities/token');//calling token checking middleware

// Routes =============================================================
module.exports = router => {

    // POST route to mock a city add  endpoint
    router.post("/api/city/add", [validator('addCity')], procErr, addCity)

    router.get("/api/city/listing", procErr, cityListing)

    

    // POST route to mock a neighbourhood add   endpoint
    router.post("/api/neighbourhood/add", validator('addNeighbourhood'), procErr, addNeighbourhood)

    router.post("/api/neighbourhood/listing", validator('neighbourhoodListing'), procErr, neighbourhoodListing)

    router.get("/api/neighbourhood/allNeighbourhoods", procErr, allNeighbourhoods)

    router.post("/api/city/deleteCity", procErr, deleteCity)

    router.post("/api/neighbourhood/deleteNeighborhood", procErr, deleteNeighborhood)
}