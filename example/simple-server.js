var port = process.env.PORT || 1337;
var EXP = require('express'),
    BODY = require('body-parser')

// Set up the basics for ExpressJS Web Server
module.exports = app = EXP()
app.use(BODY.urlencoded({extended:true}))
app.use(BODY.json())


// Load your custom data provider
var myDataProvider = new (require('./simple-data-source').SimpleDataSource)()

// Require in the express-services-adaptor middleware
// and set parameters
// The 'dataProviders' array is mandatory and includes all of your
// custom data providers
var adaptor = require('..')({
  logger: console.log,
  verbose: true,
  dataProviders: [
    myDataProvider
  ]
})

// Mount the middleware at "/gis"
app.use('/gis', adaptor)

// ... and finally start the web server
app.listen(port);
console.log('Express is now listening on port ' + port);
console.log('Access GeoServices API at http://localhost:1337/gis' + myDataProvider._urls.getServicesUrl())