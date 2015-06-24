var Bluebird = require('bluebird');

var AzureClientApi = {
  _storage: {},
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

var queryAzure = function(table, partition, rowKey) {
  console.log(AzureClientApi._storage[rowKey]);
  return Bluebird.resolve(AzureClientApi._storage[rowKey]);
}

module.exports = {
  AzureClientApi: AzureClientApi,
  AzureApi: AzureApi,
  queryAzure: queryAzure
};
