var Bluebird = require('bluebird');

var AzureClientApi = {
  _storage: {},
  retrieveEntity: function(table, partitionKey, rowKey, callback) {
    return Bluebird.resolve(this._storage[rowKey]);
  },
  set: function(key, value){
    this._storage[key] = value;
    return Bluebird.resolve(value);
  },
  del: function(key){
    delete this._storage[key];
    return Bluebird.resolve();
  },
  flushall: function(){
    this._storage = {};
    return Bluebird.resolve();
  }
};

var AzureApi = {
  createTableService: function(accountName, accessKey) {
    return AzureClientApi;
  }
};

module.exports = {
  AzureClientApi: AzureClientApi,
  AzureApi: AzureApi
};
