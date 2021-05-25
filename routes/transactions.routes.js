const { procErr } = require('../utilities/processErrors')
const { getTransactions, fetchInvoicesById } = require('../controller/transactions.controller')
const tokenValidator = require('../utilities/token'); //calling token checking middleware

// Routes =============================================================
module.exports = router => {

    // POST route to mock a city add  endpoint
    router.post("/api/transactions/getTransactions", procErr, getTransactions)
    router.post("/api/transactions/fetchInvoicesById", procErr, fetchInvoicesById)

}