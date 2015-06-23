var Bluebird = require('bluebird');
var _defaults = require('lodash/object/defaults');

var EmberCliDeployError = require('./errors/ember-cli-deploy-error');

var azureTableService;

var opts;
var _defaultOpts = {
  revisionQueryParam: 'index_key'
};
var _getOpts = function(opts) {
  opts = opts || {};
  return _defaults({}, opts, _defaultOpts);
};

var initialized = false;
var _initialize = function(connectionInfo, passedOpts) {
  opts = _getOpts(passedOpts);

  if (connectionInfo.accountName && connectionInfo.accessKey) {
    azureTableService = azure.createTableService(connectionInfo.accountName, connectionInfo.accessKey);
    initialized = true;
  } else {
    throw new EmberCliDeployError("No connection info specified. accountName and accessKey must be defined.", true);
  }

};

var fetchIndex = function(req, appName, connectionInfo, passedOpts) {
  if (!initialized) {
    _initialize(connectionInfo, passedOpts);
  }

  var rowKey;
  if (req.query[opts.revisionQueryParam]) {
    var queryKey = req.query[opts.revisionQueryParam].replace(/[^A-Za-z0-9]/g, '');
    rowKey = appName + ':' + queryKey;
  }

  var customrowKeyWasSpecified = !!rowKey;

  function queryAzure(table, partitionKey, rowKey) {
    return new Promise(function(resolve, reject) {
      azureTableService.retrieveEntity(table, partitionKey, rowKey, function(error, result, response) {
        if(!result) {
          reject(new EmberCliDeployError("There's no " + rowKey + " revision.", true));
        }
        else if (error) {
          reject(new Error(error));
        }

        // azure tables returns a goofy result with a content object containing another object with a key of
        // '-', so need to grab the result from that
        var key = Object.keys(result.content)[0];
        var value = result.content[key];

        resolve(value);
      });
    });
  }

  function retrieverowKey() {
    if (rowKey) {
      return Bluebird.resolve(rowKey);
    } else {
      return queryAzure('emberdeploy', 'manifest', appName + ":current");
    }
  }

  return retrieverowKey().then(function(result) {
    return queryAzure('emberdeploy', 'manifest', result);
  });
};

module.exports = fetchIndex;
