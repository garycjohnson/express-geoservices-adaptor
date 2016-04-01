var EXP = require('express'),
		PATH = require('path'),
		URLS = require('./urls'),
		OUTPUT = require('./output'),
		QUERY = require('./query')

module.exports = function(params) {

	this._params = params

	this._router = EXP.Router()
	this._router.use(EXP.static(PATH.join(__dirname, 'static'), {maxAge:24*60*60*1000}))

	// Create an object with all the URL patterns that need to be
	// implemented for the Geoservices REST API
	this._routerUrls = new URLS.Urls()

	this._logger = params.logger || function(){}
	this._verboseLogging = params.verbose
	this._dataProviders = params.dataProviders
	this._services = {}
	for (var i=0; i < this._dataProviders.length; i++) {
		var dp = this._dataProviders[i]
		this._services[dp.name] = {
			dataProvider: dp
		}
		this._logger('Added dataProvider ' + dp.name + ' at URL ' + dp._urls.getServicesUrl())
	}

	this._router.all('*', (req,res,next) => {
	  res.header('Access-Control-Allow-Origin', '*')
	  res.header('Access-Control-Allow-Headers', 'X-Requested-With')
	  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
	  res.header('Access-Control-Allow-Headers', 'Content-Type')
	  next()		
	})

	/*************************************************************
	**
	** If the URL contains the 'dataProviderName' param
	** - Check the data provider exists else return 404
	** - Put the provider into req.dataProvider
	**
	*************************************************************/
	this._router.param('dataProviderName', (req,res,next,name) => {
		if (this._verboseLogging)
			this._logger('Request is for dataProvider=' + name)
		var dp = this._services[name].dataProvider
		if (dp) {
			dp._request = req
			req.dataProvider = dp
			next()
		} else {
			res.status(404).send('No such data provider: ' + name)
		}
	})

	/*************************************************************
	**
	** Set up some common variables
	** - If query includes 'callback', set req.shouldUseCallback
	** - Look for 'f' in body or query, set req.geoservicesOutFormat
	**
	*************************************************************/
	this._router.use((req,res,next) => {
		if (this._verboseLogging)
			this._logger('Request received for ' + req.originalUrl)

		req.shouldUseCallback = (req.query.callback !== undefined)

		var responseFormat = req.body['f'] || req.query['f'] || 'html'
		req.geoservicesOutFormat = responseFormat.toLowerCase()

		next()
	})

	function responseHandler(req,res,next,data,err) {
		if (err) return next(err)

		if (req.shouldUseCallback) {
			res.status(200).jsonp(data)
		} else {
			res.status(200).send(data)
		}
	}


	/*************************************************************
	**
	** .../rest/info
	**
	*************************************************************/
	this._router.get(this._routerUrls.getInfoUrl(), infoHandler)
	this._router.post(this._routerUrls.getInfoUrl(), infoHandler)
	function infoHandler(req,res,next) {
		OUTPUT.info(req, (data, err) => {
			return responseHandler(req,res,next,data,err)
		})
	}

	/*************************************************************
	**
	** .../rest/services
	**
	*************************************************************/
	this._router.get(this._routerUrls.getServicesUrl(), servicesHandler)
	this._router.post(this._routerUrls.getServicesUrl(), servicesHandler)
	function servicesHandler(req,res,next) {
		OUTPUT.services(req, (data, err) => {
			return responseHandler(req,res,next,data,err)
		})
	}

	/*************************************************************
	**
	** .../rest/services/:service/FeatureServer
	**
	*************************************************************/
	this._router.get(this._routerUrls.getServiceUrl(), featureServiceHandler)
	this._router.post(this._routerUrls.getServiceUrl(), featureServiceHandler)
	function featureServiceHandler(req,res,next) {
		OUTPUT.featureService(req, (data, err) => {
			return responseHandler(req,res,next,data,err)
		})
	}

	/*************************************************************
	**
	** .../rest/services/:service/FeatureServer/layers
	**
	*************************************************************/
	this._router.get(this._routerUrls.getLayersUrl(), featureLayerHandler)
	this._router.post(this._routerUrls.getLayersUrl(), featureLayerHandler)
	function featureLayersHandler(req,res,next) {
		OUTPUT.featureServiceLayers(req, (data, err) => {
			return responseHandler(req,res,next,data,err)
		})
	}

	/*************************************************************
	**
	** .../rest/services/:service/FeatureServer/:layer
	**
	*************************************************************/
	this._router.get(this._routerUrls.getLayerUrl(), featureLayerHandler)
	this._router.post(this._routerUrls.getLayerUrl(), featureLayerHandler)
	function featureLayerHandler(req,res,next) {
		OUTPUT.featureServiceLayer(req, (data, err) => {
			return responseHandler(req,res,next,data,err)
		})
	}

	/*************************************************************
	**
	** .../rest/services/:service/FeatureServer/:layer/query
	**
	*************************************************************/
	this._router.get(this._routerUrls.getLayerQueryUrl(), featureLayerQueryHandler)
	this._router.post(this._routerUrls.getLayerQueryUrl(), featureLayerQueryHandler)
	function featureLayerQueryHandler(req,res,next) {
		OUTPUT.featureServiceLayerQuery(req, (data, err) => {
			return responseHandler(req,res,next,data,err)
		})
	}

	return this._router

}