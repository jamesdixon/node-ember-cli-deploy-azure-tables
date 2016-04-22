'use strict';

const Azure = require('Azure-storage');
const EmberCliDeployError = require('./errors/ember-cli-deploy-error');
const Memoize = require('memoizee');
const Promise = require('bluebird');
const _defaultsDeep = require('lodash/defaultsDeep');

// default options
const _defaultOpts = {
  azureTableName: 'emberdeploy',
  revisionQueryParam: 'index_key',
  memoize: false,
  memoizeOpts: {
    maxAge:   5000, // ms
    preFetch: true,
    max:      4,    // a sane default (current pointer, current html and two indexkeys in cache)
  }
};

let opts;

/**
 * Merges user-supplied options with defaults.
 */
const _getOpts = (opts) => {
  opts = opts || {};
  return _defaultsDeep({}, opts, _defaultOpts);
};

let initialized = false;
let azureTableService;

/**
 *  Initialize connection to Azure Storage and apply
 *  Memoization options, if applicable.
 */
const _initialize = (connectionInfo, passedOpts) => {

  opts = _getOpts(passedOpts);

  if (connectionInfo.accountName && connectionInfo.accessKey) {
    azureTableService = Azure.createTableService(connectionInfo.accountName, connectionInfo.accessKey);

    if (opts.memoize === true) {
      let memoizeOpts = opts.memoizeOpts;
      memoizeOpts.primitive = true;
      memoizeOpts.async = true;
      memoizeOpts.length = 3;

      azureTableService.retrieveEntity = Memoize(azureTableService.retrieveEntity, memoizeOpts);
    }

    initialized = true;
  } else {
    throw new EmberCliDeployError('No connection info specified. accountName and accessKey must be defined.', true);
  }
};

/**
 * Retrieves the HTML from Azure Table Storage.
 */
const fetchIndex = (req, appName, connectionInfo, passedOpts) => {

  if (!initialized) {
    _initialize(connectionInfo, passedOpts);
  }

  let rowKey;
  if (req.query[opts.revisionQueryParam]) {
    const queryKey = req.query[opts.revisionQueryParam].replace(/[^A-Za-z0-9]/g, '');
    rowKey = appName + ':' + queryKey;
  }

  /**
   * Retrieves the row key of the active revision.
   */
  function retrieveRowKey() {
    if (rowKey) {
      return Promise.resolve(rowKey);
    } else {
      return queryAzure(opts.azureTableName, 'manifest', appName + ':current')
        .then((result) => result)
        .catch((err) => {
          throw err;
        });
    }
  }

  /**
   * Returns the active revision based on the row key
   * returned by `retrieveRowKey()`
   */
  function queryAzure(table, partitionKey, rowKey) {

    return new Promise((resolve, reject) => {

      azureTableService.retrieveEntity(table, partitionKey, rowKey, (error, result, response) => {

        if (!result) {
          reject(new EmberCliDeployError("There's no " + rowKey + ' revision.', true));
        } else if (error) {
          reject(new Error(error));
        } else {
          // Azure tables returns a goofy result with a content object containing another object
          // with a key of '-', so need to grab the result from that
          const key = Object.keys(result.content)[0];
          resolve(result.content[key]);
        }
      });
    });
  }

  /**
   *  Retrieve the row key for the active revision and
   *  return the active revision's content.
   */
  return retrieveRowKey()
    .then((rowKey) => queryAzure(opts.azureTableName, 'manifest', rowKey))
    .then((html) => html);
};

module.exports = fetchIndex;
