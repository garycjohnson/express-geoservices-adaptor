var FILE = require('fs'),
		UTIL = require('util'),
		PATH = require('path'),
		QUERY = require('./query')

var dataproviderbase = require("./dataproviderbase");

var terraformer = require("terraformer"),
		terraformerArcGIS = require("terraformer-arcgis-parser")

var _infoJSON = JSON.parse(FILE.readFileSync(PATH.join(__dirname,'./outputtemplates/info.json'), 'utf8'));
var _servicesJSON = JSON.parse(FILE.readFileSync(PATH.join(__dirname,'./outputtemplates/services.json'), 'utf8'));
var _featureServiceJSON = JSON.parse(FILE.readFileSync(PATH.join(__dirname,'./outputtemplates/featureService.json'), 'utf8'));
var _featureService_LayerItemJSON = JSON.parse(FILE.readFileSync(PATH.join(__dirname,'./outputtemplates/featureService_layerItem.json'), 'utf8'));
var _featureServiceLayerJSON = JSON.parse(FILE.readFileSync(PATH.join(__dirname,'./outputtemplates/featureServiceLayer.json'), 'utf8'));
var _featureServiceLayersJSON = JSON.parse(FILE.readFileSync(PATH.join(__dirname,'./outputtemplates/featureServiceLayers.json'), 'utf8'));

var _featureSetJSON = JSON.parse(FILE.readFileSync(PATH.join(__dirname,'./outputtemplates/featureSet.json'), 'utf8'));
var _queryCountJSON = JSON.parse(FILE.readFileSync(PATH.join(__dirname,'./outputtemplates/queryCount.json'), 'utf8'));
var _queryIdsJSON = JSON.parse(FILE.readFileSync(PATH.join(__dirname,'./outputtemplates/queryIds.json'), 'utf8'));

var _dataProvidersHTML = FILE.readFileSync(PATH.join(__dirname,'./outputtemplates/dataProviders.html'), 'utf8');

var _infoHTML = FILE.readFileSync(PATH.join(__dirname,'./outputtemplates/info.html'), 'utf8');
var _servicesHTML = FILE.readFileSync(PATH.join(__dirname,'./outputtemplates/services.html'), 'utf8');
var _featureServiceHTML = FILE.readFileSync(PATH.join(__dirname,'./outputtemplates/featureService.html'), 'utf8');
var _featureServiceLayerHTML = FILE.readFileSync(PATH.join(__dirname,'./outputtemplates/featureServiceLayer.html'), 'utf8');
var _featureServiceLayersHTML = FILE.readFileSync(PATH.join(__dirname,'./outputtemplates/featureServiceLayers.html'), 'utf8');
var _featureServiceLayer_LayerItemHTML = FILE.readFileSync(PATH.join(__dirname,'./outputtemplates/featureServiceLayer_layerItem.html'), 'utf8');

var _serviceDetailsJSON = {
	"name": "dummyService",
	"type": "FeatureServer",
	"url": "http://www.arcgis.com"
};

var drawingInfo_Point = JSON.parse(FILE.readFileSync(PATH.join(__dirname,"./outputtemplates/drawingInfo/point.json"), 'utf8'));
var drawingInfo_Line = JSON.parse(FILE.readFileSync(PATH.join(__dirname,"./outputtemplates/drawingInfo/line.json"), 'utf8'));
var drawingInfo_Polygon = JSON.parse(FILE.readFileSync(PATH.join(__dirname,"./outputtemplates/drawingInfo/polygon.json"), 'utf8'));

function _clone(object) {
	if (object) {
		return JSON.parse(JSON.stringify(object));
	}
	return null;
}

var envelopeHTMLTemplate = '<ul>XMin: %d<br/> YMin: %d<br/> XMax: %d<br/> YMax: %d<br/> ' + 
					   	   'Spatial Reference: %d<br/></ul>';
function htmlStringForEnvelope(env) {
	return UTIL.format(envelopeHTMLTemplate, 
						env.xmin, env.ymin, 
						env.xmax, env.ymax,
						env.spatialReference.wkid);
}

var fieldHTMLTemplate = '<li>%s <i>(type: %s, alias: %s, nullable: %s, editable: %s)</i></li>\n';

function getHtmlForFields(fields) {
	var outStr = "";
	for (var i=0; i < fields.length; i++)
	{
		var field = fields[i];
		outStr = outStr + UTIL.format(fieldHTMLTemplate,
										field.name,
										field.type,
										field.alias,
										field.nullable,
										false);
	}
	return outStr;
};



// JSON
function infoJSON(dataProvider, callback) {
	var t = _clone(_infoJSON);
	t["currentVersion"] = dataProvider.serverVersion;
	t["fullVersion"] = dataProvider.serverVersion.toString();
	callback(t, null);
}

function servicesJSON(dataProvider, callback) {
	var t = _clone(_servicesJSON);
	t["currentVersion"] = dataProvider.serverVersion;
	var serviceIds = dataProvider.getServiceIds(function(serviceIds, err) {
		for (var i=0; i<serviceIds.length; i++)
		{
			var serviceDetails = _clone(_serviceDetailsJSON),
				serviceId = serviceIds[i];
			serviceDetails.name = serviceId;
			serviceDetails.url = dataProvider.baseUrl + dataProvider.urls.getServiceUrl(serviceId);
			t.services.push(serviceDetails);
		};
		dataProvider.updateServicesDetails(t.services, function(newDetails, err) {
			t.services = newDetails;
			callback(t, err);
		});
	});
};

function featureServiceJSON(dataProvider, serviceId, callback) {
	var t = _clone(_featureServiceJSON);
	t["currentVersion"] = dataProvider.serverVersion;
	dataProvider.getFeatureServiceDetails(t, serviceId, function(layerIds, layerNames, err) {
		var ls = [];
		for (var i=0; i<layerIds.length; i++) {
			var layerDetails = _clone(_featureService_LayerItemJSON);
			layerDetails.id = layerIds[i];
			layerDetails.name = layerNames[i];
			ls.push(layerDetails);
		}
		dataProvider.updateFeatureServiceDetailsLayersList(serviceId, ls, function(layersDetails, err) {
			t.layers = layersDetails;
			callback(t, err);
		});
	});
};

function featureServiceLayerJSON(dataProvider, serviceId, layerId, callback) {
	var t = _clone(_featureServiceLayerJSON);
	dataProvider.getFeatureServiceLayerDetails(t, serviceId, layerId, function(layerDetails, err) {
		var layerName = layerDetails.layerName, 
			idField = layerDetails.idField,
			nameField = layerDetails.nameField, 
			fields = layerDetails.fields,
			geomType = layerDetails.geometryType;
		if (geomType) {
			t["geometryType"] = geomType;
		}
		if (!t.hasOwnProperty("drawingInfo")) {
			// If the provider has already given us drawingInfo, let's do it.
			var drawingInfo = null;
			switch(geomType) {
				case "esriGeometryPoint":
					drawingInfo = drawingInfo_Point;
					break;
				case "esriGeometryPolyline":
					drawingInfo = drawingInfo_Line;
					break;
				case "esriGeometryPolygon":
					drawingInfo = drawingInfo_Polygon;
					break;
				default:
					console.log("Could not determine the geometry type: " + geomType);
					console.log("layerDetails");
					break;
			}
			if (drawingInfo) {
				t["drawingInfo"] = drawingInfo;
			}
		}
		t["currentVersion"] = dataProvider.serverVersion;
		t["name"] = layerName; // dataProvider.featureServiceLayerName(serviceId, layerId);
		t["id"] = layerId;
		t["objectIdField"] = idField; // dataProvider.idField(serviceId, layerId);
		t["displayField"] = nameField; // dataProvider.nameField(serviceId, layerId);
		t["fields"] = fields; // dataProvider.fields(serviceId, layerId);
		callback(t, err);
	});
};

function featureServiceLayersJSON(dataProvider, serviceId, callback) {
	var t = _clone(_featureServiceLayersJSON);
	var outputter = this;
	dataProvider.getLayerIds(serviceId, function(layerIds, err) {
		if (err) return callback(null, err);
		var layerResults = {};
		var retrievedResults = 0;
		for (var i=0; i<layerIds.length; i++) {
			var layerId = layerIds[i];
			featureServiceLayerJSON(dataProvider, serviceId, layerId, function (layerJSON, err) {
				if (err) return callback(null, err);
				layerResults[layerId] = layerJSON;
				retrievedResults++;
				if (retrievedResults == layerIds.length) {
					t.layers = layerIds.map(function(layerId) {
						return layerResults[layerId];
					});
					callback(t, err);
				}
			});
		}
	});
};

function projectGeographicGeomToMercator(geometry) {
	var g = terraformerArcGIS.convert(terraformerArcGIS.parse(geometry).toMercator());
	g.spatialReference.wkid = 102100;
	return g;
}

function featureServiceLayerQueryJSON(dataProvider, serviceId, layerId, query, callback)
{
	var queryResult = null;

	if (query.returnCountOnly)
	{
		dataProvider.countForQuery(serviceId, layerId, query, function(resultCount, err) {
			var output = _clone(_queryCountJSON);
			// Note, for now we only handle one layer at a time
			var outLayer = output.layers[0];
			outLayer.id = layerId;
			outLayer.count = resultCount;
			callback(output, err);
		});
	}
	else if (query.returnIdsOnly)
	{
		dataProvider.idsForQuery(serviceId, layerId, query, function(resultIds, err) {
			var output = _clone(_queryIdsJSON);
			// Note, for now we only handle one layer at a time
			var outLayer = output.layers[0];
			outLayer.id = layerId;
			outLayer.objectIdFieldName = dataProvider.idField(serviceId, layerId);
			outLayer.objectIds = resultIds;
			callback(output, err);
		});
	}
	else
	{
		dataProvider._featuresForQuery(serviceId, layerId, query, function(queryResult, idField, fields, err, outputFormat) {
			if (err) {
				callback([], err);
			}
			else
			{
				switch (query.generatedFormat.toLowerCase()) {
					case "json":
						var featureSet = JSON.parse(JSON.stringify(_featureSetJSON));
						
						featureSet.fields = fields;
						featureSet.objectIdFieldName = idField;
						featureSet.features = [];
						
						if (query.outSR === 102100)
						{
							for (var i=0; i<queryResult.length; i++)
							{
								var feature = JSON.parse(JSON.stringify(queryResult[i]));
 								feature.geometry = projectGeographicGeomToMercator(feature.geometry);
								featureSet.features.push(feature);
							}
							featureSet.spatialReference.wkid = 102100;
						}
						else
						{
							featureSet.features = queryResult;
						}
						if (query.hasOwnProperty("outputGeometryType")) {
							featureSet.geometryType = query["outputGeometryType"];
						} else {
							featureSet.geometryType = dataProvider.geometryType(serviceId, layerId)
						}
			
						callback(featureSet, err);
						break;
					case "geojson":
						if (query.outSR != 4326) {
							return callback(queryResult, "geoJSON can only be output in geographic coordinates. outSR asked for " + 
								query.outSR + ". Alternatively specify a return format other than f=geojson");
						}
						callback(queryResult, err);
						break;
				}
			}
		});
	}
};

// HTML
function dataProvidersHTML(dataProviders) {
	var dataProviderTemplate = "<li><a href='%s'>%s</a></li>\n";
	var s = "";
	for (var providerId in dataProviders) {
		var dataProvider = dataProviders[providerId].dataProvider;
		s += UTIL.format(dataProviderTemplate, 
						 dataProvider.baseUrl + dataProvider.urls.getServicesUrl(),
						 dataProvider.name);
	};
	return UTIL.format(_dataProvidersHTML, s);
};

function getHtmlForFeatureServiceEntry(dataProvider, svc) {
	var featureServiceEntryHtmlTemplate = '<li><a href="%s">%s</a> (%s)</li>\n';
	return UTIL.format(featureServiceEntryHtmlTemplate,
						svc.url,
						dataProvider.getServiceName(svc.name),
						svc.type);
}

function getHtmlForFeatureServiceLayerEntry(layer, layerUrl) {
	var featureServiceLayerEntryHtmlTemplate = '<li><a href="%s">%s</a> (%d)</li>\n';
	return UTIL.format(featureServiceLayerEntryHtmlTemplate,
						layerUrl,
						layer.name,
						layer.id);
}

function infoHTML(dataProvider, callback) {
	infoJSON(dataProvider, function(json, err) {
		var r = UTIL.format(_infoHTML,
			json.currentVersion,
			json.fullVersion);
		callback(r, err);
	});
};

function servicesHTML(dataProvider, callback) {
	servicesJSON(dataProvider, function(json, err) {
		var serviceListHTML = "";
		for (var i=0; i < json.services.length; i++) {
			serviceListHTML += getHtmlForFeatureServiceEntry(dataProvider, json.services[i]);
		}
		var r = UTIL.format(_servicesHTML,
			dataProvider.baseUrl + dataProvider.urls.getServicesUrl(), 
			dataProvider.baseUrl + dataProvider.urls.getServicesUrl(),
			json.currentVersion,
			serviceListHTML);

		callback(r, err);
	});
};

function featureServiceHTML(dataProvider, serviceId, callback) {
	featureServiceJSON(dataProvider, serviceId, function(json, err) {
		var layerListHTML = "";
	
		for (var i=0; i<json.layers.length; i++) {
			var layer = json.layers[i];
			var layerUrl = dataProvider.baseUrl + dataProvider.urls.getLayerUrl(serviceId, layer["id"]);
			layerListHTML += getHtmlForFeatureServiceLayerEntry(layer, layerUrl);
		}
	
		var r = UTIL.format(
			_featureServiceHTML,
			dataProvider.name, "FeatureServer",
			dataProvider.baseUrl + dataProvider.urls.getServicesUrl(), 
			dataProvider.baseUrl + dataProvider.urls.getServicesUrl(), 
			dataProvider.baseUrl + dataProvider.urls.getServiceUrl(serviceId), 
			dataProvider.getServiceName(serviceId), "FeatureServer",
			dataProvider.getServiceName(serviceId), "FeatureServer",
			json.serviceDescription,
			json.hasVersionedData,
			json.maxRecordCount,
			json.supportedQueryFormats,
			dataProvider.baseUrl + dataProvider.urls.getLayersUrl(serviceId),
			layerListHTML,
			json.description,
			json.copyrightText,
			json.spatialReference.wkid,
			htmlStringForEnvelope(json.initialExtent),
			htmlStringForEnvelope(json.fullExtent),
			json.units,
			"FSQueryURL"
		);
		
		callback(r, err);
	});
};

function featureServiceLayerItemHTML(dataProvider, serviceId, layerId, callback) {
	function getHTML(json) {
		var r = UTIL.format(_featureServiceLayer_LayerItemHTML,
			json.name,
			json.displayField,
			json.geometryType,
			json.description,
			json.copyrightText,
			json.minScale,
			json.maxScale,
			json.maxRecordCount,
			htmlStringForEnvelope(json.extent),
			getHtmlForFields(json.fields));

		return r;
	}
	if (dataProvider instanceof dataproviderbase.DataProviderBase) {
		featureServiceLayerJSON(dataProvider, serviceId, layerId, function (json, err) {
			callback(getHTML(json), err);
		});
	} else {
		var json = dataProvider;
		return getHTML(json);
	}
};

function getFullFeatureServiceLayerURL(dataProvider, serviceId, layerId) {
	var r = dataProvider.baseUrl + dataProvider.urls.getLayerUrl(serviceId, layerId);
	return encodeURIComponent(r);
}

function featureServiceLayerHTML(dataProvider, serviceId, layerId, callback) {
	featureServiceLayerJSON(dataProvider, serviceId, layerId, function (json, err) {
		var url = getFullFeatureServiceLayerURL(dataProvider, serviceId, layerId);
		var r = UTIL.format(_featureServiceLayerHTML,
			json.name, layerId,
			dataProvider.baseUrl + dataProvider.urls.getServicesUrl(), 
			dataProvider.baseUrl + dataProvider.urls.getServicesUrl(),
			dataProvider.baseUrl + dataProvider.urls.getServiceUrl(serviceId), 
			dataProvider.getServiceName(serviceId), 
			"FeatureServer",
			dataProvider.baseUrl + dataProvider.urls.getLayerUrl(serviceId, layerId), 
			json.name,
			json.name, 
			layerId,
			url,
			dataProvider.baseUrl,
			url,
			dataProvider.baseUrl,
			url,
			url,
			featureServiceLayerItemHTML(json),
			dataProvider.baseUrl + dataProvider.urls.getLayerQueryUrl(serviceId, layerId));
	
console.log('FSL', dataProvider.baseUrl);

		callback(r, err);
	});
};

function featureServiceLayersHTML(dataProvider, serviceId, callback) {
	featureServiceLayersJSON(dataProvider, serviceId, function(json, err) {
		var layerHTMLItems = {};
		var t = '<h3>Layer: <a href="%s">%s</a> (%d)</h3><br/>';
		for (var i=0; i<json.layers.length; i++) {
			var layer = json.layers[i];
			var html = featureServiceLayerItemHTML(layer, serviceId, layer.id);
			html = UTIL.format(t, 
				dataProvider.baseURL + dataProvider.urls.getLayerUrl(serviceId, layer.id),
				layer.name, 
				layer.id) + html;
			layerHTMLItems[layer.id] = html;
		}

		var layersHTML = "";
		for (var j=0; j<json.layers.length; j++) {
			layersHTML += layerHTMLItems[json.layers[j].id];
		}

		var r = UTIL.format(_featureServiceLayersHTML,
			serviceId, 
			dataProvider.baseURL + dataProvider.urls.getServicesUrl(), 
			dataProvider.baseURL + dataProvider.urls.getServicesUrl(),
			dataProvider.baseURL + dataProvider.urls.getServiceUrl(serviceId), 
			dataProvider.getServiceName(serviceId), 
			"FeatureServer",
			dataProvider.baseURL + dataProvider.urls.getLayersUrl(serviceId),
			serviceId,
			layersHTML);
		callback(r, err);
	});
};

exports.dataProvidersHTML = dataProvidersHTML;

function o(mJ,mH,f,d) {
	var args = Array.prototype.slice.call(arguments);
	var callback = args.pop();
	args.shift(); args.shift(); args.shift();
	args.push(function(result, err) {
		callback(result, err);
	});
	var m = (f==="json" || f==="pjson")?mJ:mH;
	m.apply(d,args);
};

exports.info = function(req, callback) {
	var f = req.geoservicesOutFormat
	var dataProvider = req.dataProvider
	o(infoJSON, infoHTML, f, dataProvider, function(output, err) {
		callback(output, err);
	});
};

exports.services = function(req, callback) {
	var f = req.geoservicesOutFormat
	var dataProvider = req.dataProvider
	o(servicesJSON, servicesHTML, f, dataProvider, function(output, err) {
		callback(output, err);
	});
};

exports.featureService = function(req, callback) {
	var f = req.geoservicesOutFormat
	var dataProvider = req.dataProvider
	var serviceId = req.params.serviceId
	o(featureServiceJSON, featureServiceHTML, f, dataProvider, serviceId, function(output, err) {
		callback(output, err);
	});
};

exports.featureServiceLayer = function(req, callback) {
	var f = req.geoservicesOutFormat
	var dataProvider = req.dataProvider
	var serviceId = req.params.serviceId
  var layerId = req.params.layerId
	o(featureServiceLayerJSON, featureServiceLayerHTML, f, dataProvider, serviceId, layerId, function(output, err) {
		callback(output, err);
	});
};

exports.featureServiceLayers = function(req, callback) {
	var f = req.geoservicesOutFormat
	var dataProvider = req.dataProvider
	var serviceId = req.params.serviceId
	o(featureServiceLayersJSON, featureServiceLayersHTML, f, dataProvider, serviceId, function(output, err) {
		callback(output, err);
	});
};

exports.featureServiceLayerQuery = function(req, callback) {
	var f = req.geoservicesOutFormat
	var dataProvider = req.dataProvider
	var serviceId = req.params.serviceId
  var layerId = req.params.layerId
  var query = new QUERY.Query(req)
	o(featureServiceLayerQueryJSON, featureServiceLayerQueryJSON, f, dataProvider, serviceId, layerId, query, function(output, err) {
		callback(output, err);
	});
};
