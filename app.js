const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const createLocaleMiddleware = require('express-locale');
const { startPolyglot } = require('./utilities/startPolyglot');
var cors = require('cors')
var error = require('./interceptors/error');

require('./utilities/errorLogsHandling')(); //error logging library
require('./config/database')();

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser())
app.use(cors())

app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

// Get the user's locale, and set a default in case there's none
app.use(createLocaleMiddleware({
    "priority": ["accept-language", "default"],
    "default": "en_US"
}))

// Start polyglot and set the language in the req with the phrases to be used
app.use(startPolyglot)

// Root URL
app.get('/', function(req, res) {
        res.send('All Set');
    })
    // Routes
    // =============================================================
require("./routes/auth.routes")(app)
require("./routes/countryStateCity.routes")(app)
require("./routes/categorySubcategory.routes")(app)
require("./routes/property.routes")(app)
require("./routes/propertyType.routes")(app)
require("./routes/amenity.routes")(app)
require("./routes/admin/admin.routes")(app)
require("./routes/office.routes")(app)
require("./routes/team.routes")(app)
require("./routes/faqcategory.routes")(app)
require("./routes/day_timeslot.routes")(app)
require("./routes/banner.routes")(app)
require("./routes/about.routes")(app)
require("./routes/jobs.routes")(app)
require("./routes/membership.routes")(app)
require("./routes/review.routes")(app)
require("./routes/notifications.routes")(app)
require("./routes/transactions.routes")(app)
require("./routes/messages.routes")(app)
    //Interceptors

module.exports = app;