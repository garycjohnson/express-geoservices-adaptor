var dataproviderbase = require('../lib/dataproviderbase'),
    UTIL = require('util'),
    FILE = require('fs')


SimpleDataSource = function() {
  SimpleDataSource.super_.call(this)

  this._isReady = true
  this._devMode = true
}
UTIL.inherits(SimpleDataSource, dataproviderbase.DataProviderBase)

Object.defineProperties(SimpleDataSource.prototype, {
  name: {
    // SimpleDataSource.getName()
    // Each DataProvider will be mounted on a route with this name
    get: function() {
      // Override the service name - every data provider should override this.
      return "simple-data-server";
    }
  },
  isReady: {
    // SimpleDataSource.getIsReady()
    // For a data provider with a long-running startup process, isReady
    // is used to defer any requests until the startup is complete.
    get: function() {
      return this._isReady;
    }
  },
  getServiceIds: {
    // SimpleDataSource.getServiceIds()
    // Pass an array of your Service Names to the callback
    // The service name is used to describe each ArcGIS Feature Service
    // and will produce an endpoint such as /rest/services/<ServiceName>
    value: function(callback) {
      callback(['MyFirstService', 'MySecondService'])
    }
  },
  getServiceName: {
    // SimpleDataSource.getServiceName(serviceId)
    // Returns the Friendly Name corresponing to the serviceId
    // Typically the name is the same as the serviceId
    value: function(serviceId) {
      return serviceId;
    }
  },
  getLayerIds: {
    // SimpleDataSource.getLayerIds()
    // Pass an array of your Layer IDs to the callback.
    // The LayerIds are typically a numeric list of layers in the services
    // The layer id is used to describe each ArcGIS Feature Service's Layer
    // and will produce an endpoint such as /rest/services/<ServiceName>/FeatureServer/<LayerID>
    value: function(serviceId, callback) {
      callback([0,1])
    }
  },
  getLayerName: {
    // SimpleDataSource.getLayerName()
    // Returns the Friendly Name corresponding to the LayerId
    value: function(serviceId, layerId) {
      return ['Simple Layer','The Same Simple Layer'][layerId]
    }
  },
  idField: {
    // SimpleDataSource.idField()
    // Each feature must have an attribute that corresponds to a
    // unique key for the feature. Return the name of the field that 
    // will be used as the ID for this layer.
    value: function(serviceId, layerId) {
      return "id";
    }
  },
  nameField: {
    // SimpleDataSource.nameField()
    // Each feature must have an attribute that corresponds to a
    // friendly name for the feature. Return the name of the field that 
    // will be used as the feature name for this layer.
    value: function(serviceId, layerId) {
      return "name";
    }
  },
  fields: {
    // SimpleDataSource.fields()
    // The list of attribute names and types that exist on this layer.
    value: function(serviceId, layerId) {
      return [
        {"name" : "id", "type" : "esriFieldTypeInteger", "alias" : "ID", "nullable" : "true"},
        {"name" : "name", "type" : "esriFieldTypeString", "alias" : "Name", "length" : "255", "nullable" : "true"}
      ]    
    }
  },
  geometryType: {
    // SimpleDataSource.geometryType()
    // The geometry type for this layer. Must be one of: -
    // esriGeometryPolygon
    // esriGeometryPolyline
    // esriGeometryPoint
    value: function(serviceId, layerId) {
      return "esriGeometryPolygon"
    }
  },
  featuresForQuery: {
    // SimpleDataSource.featuresForQuery()
    // This is where the FeatureServer data for this layer gets 
    // returned to the API.
    //
    // The callback requires the following parameters: -
    // . array of feature objects
    // . name of the unique ID attribute for the layer
    // . array of the attribute definitions for this layer
    //
    // The 'query' parameter will contain the definition for which
    // features should be returned. The query object has the following
    // attributes, all of which are optional. It is up to the developer
    // of the DataProvider whether these are respected by the call.
    // . where - an SQL where clauses
    // . objectIds - an array of IDs
    // . inSR - input spatial reference for query by geometry 
    // . outSR - output spatial reference for returned features
    // . geometry - provides an area to return features
    // . geometryType - only supports esriGeometryEnvelope and esriGeometryPoint
    // . spatialRel - the relationship for the geometry query
    // . time - time for the data
    // . outFields - an array of attribute names to return or '*'
    // . returnGeometry - boolean should return the geometry with each feature
    // . returnIdsOnly - boolean to only return array of ID of matching features
    // . returnCountOnly - boolean to only retun the count of matching features
    value: function(serviceId, layerId, query, callback) {
      console.log('NOTE: This example does not use query where clause, outFields etc')
      return callback(require('./simple-data-features.json').features, 
                      this.idField(serviceId, layerId), 
                      this.fields(serviceId, layerId))
    }
  },
  getFeatureServiceDetails: {
    // SimpleDataSource.getFeatureServiceDetails
    // The callback requires a list of all layer IDs and Names
    // Can also optionally add attributes to the detailsTemplate object
    // . detailsTemplate.initialExtent
    // . detailsTemplate.serviceDescription
    // . detailsTemplate.supportedQueryFormats
    // . detailsTemplate.maxRecordCount
    // . detailsTemplate.description
    // . detailsTemplate.copyrightText
    // . detailsTemplate.fullExtent
    value: function(detailsTemplate, serviceId, callback) {
      
      detailsTemplate.initialExtent = require('./simple-data-features.json').extent
      detailsTemplate.fullExtent = detailsTemplate.initialExtent 

      this.getLayerIds(serviceId, (function(layerIds, err) {
        callback(layerIds, this.getLayerNamesForIds(serviceId, layerIds), err);
      }).bind(this));
    }
  },

  getFeatureServiceLayerDetails: {
    // SimpleDataSource.getFeatureServiceLayerDetails
    // The callback takes an object with the following attributes: -
    // {
    //   layerName: "friendly name of this layer",
    //   idField: "name of the ID attribute for this layer",
    //   nameField: "name of the Name attribute for this layer",
    //   fields: [ "array of field definitions" ],
    //   geometryType: "theGeometryType"
    // }
    // Can also optionally add attributes to the detailsTemplate object
    // . detailsTemplate.displayField
    // . detailsTemplate.description
    // . detailsTemplate.minScale
    // . detailsTemplate.maxScale
    // . detailsTemplate.maxRecordCount
    // . detailsTemplate.copyrightText
    // . detailsTemplate.extent
    value: function(detailsTemplate, serviceId, layerId, callback) {

      detailsTemplate.extent = require('./simple-data-features.json').extent

      callback({
        layerName: this.getLayerName(serviceId, layerId), 
        idField: this.idField(serviceId, layerId),
        nameField: this.nameField(serviceId, layerId),
        fields: this.fields(serviceId, layerId),
        geometryType: this.geometryType()
      }, null);

    }
  }
});

exports.SimpleDataSource = SimpleDataSource