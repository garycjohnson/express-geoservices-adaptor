express-geoservices-adaptor
===========================

This is an [ExpressJS](http://expressjs.com) Middleware to host a "GeoServices" REST API Service that serves up Geospatial data as Feature Services that can be consumed by clients such as Esri's ArcGIS Online, ArcMap and ArcGIS Pro.

##Data Provider
A data provider must inherit from the DataProviderBase class to connect to your data source to return data through the API. The [simple-data-source.js](example/simple-data-source.js) gives a great example of creating your custom data provider and includes comments describing each method to be implemented.

##Connecting the Middleware
Create an instance of the your custom data provider to pass to the middleware. You can create as many different custom data providers as you require. Each will be given a route corresponding to its name.
```
var myDataProvider = new (require('./simple-data-source').SimpleDataSource)()
```

Configure the express-geoservices-adaptor to use your data providers.
```
var adaptor = require('express-geoservices-adaptor')({
  logger: console.log,
  verbose: true,
  dataProviders: [
    myDataProvider
  ]
})
```
* logger - A function to call for any log statements
* verbose - If true will output more log statements
* dataProviders - An array of objects inheriting from DataProviderBase

Then mount your middleware within your Express application.
```
app.use('/gis', adaptor)
```

This would give a route for each data provider at: -
```
http://mywebserver/gis/dataProviderName/rest/services
```

##Known Limitations
* Only a limited subset of the [Geoservices REST Specification](http://resources.arcgis.com/en/help/arcgis-rest-api/) is implemented.
  * [`Server Info`](http://resources.arcgis.com/en/help/arcgis-rest-api/#/Server_Info/02r300000116000000/)
  * [`Catalog`](http://resources.arcgis.com/en/help/arcgis-rest-api/#/Catalog/02r3000000tn000000/)
  * [`Feature Service`](http://resources.arcgis.com/en/help/arcgis-rest-api/#/Feature_Service/02r3000000z2000000/)
  * `Layers (Feature Service)`
  * [`Layer (Feature Service)`](http://resources.arcgis.com/en/help/arcgis-rest-api/#/Layer/02r3000000w6000000/)
  * [`Query (Feature Service\Layer)`](http://resources.arcgis.com/en/help/arcgis-rest-api/#/Query_Feature_Service_Layer/02r3000000r1000000/)
* Only spatial references 4326 and 102100 are supported.
* The application will convert from 4326 to 102100 only.
* Queries only work against the layer end point. `Query (Feature Service)` is declared as a capability but not yet implemented.
* HTML Browsing is not available for Query endpoints. All queries return JSON.
* Only a subset of [`Query (Feature Service\Layer)`](http://resources.arcgis.com/en/help/arcgis-rest-api/#/Query_Feature_Service_Layer/02r3000000r1000000/) is implemented:
  * `objectIds`
  * `outSR` (4326 and 102100 only)
  * `returnIdsOnly`
  * `returnCountOnly`

## Resources

* [ArcGIS REST Specification](http://resources.arcgis.com/en/help/arcgis-rest-api/)
* [Terraformer](https://github.com/esri/terraformer) by [Esri](http://esri.github.io)
* [node.js documentation](http://nodejs.org/api/)
* [express.js documentation](http://expressjs.com/api.html)
* [CityBikes API](http://api.citybik.es)
* [GeoHub](https://github.com/chelm/geohub)
* [geoJSON Specification](http://www.geojson.org/geojson-spec.html)

## Issues

Find a bug or want to request a new feature?  Please let us know by submitting an Issue.

## Licensing

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

[](Tags: NodeJS ExpressJS GeoServices REST)
