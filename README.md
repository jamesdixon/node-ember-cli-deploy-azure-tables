# node-ember-cli-deploy-azure-tables
ExpressJS middleware to fetch the current (or specified) revision of your Ember App from Azure Tables deployed by [ember-cli-deploy](https://github.com/ember-cli/ember-cli-deploy).

## Credit
This is a modified version of [Ben Limmer's](https://github.com/blimmer) excellent [node-ember-cli-deploy-redis](https://github.com/blimmer/node-ember-cli-deploy-redis) package. Thanks, Ben!

## Usage
There are two ways of using the package:

### ExpressJS Middleware
1. `require` the package
2. `use` the package in your app

#### Example
```javascript
var express = require('express');
var app = express();

var nodeEmberCliDeployAzureTables = require('node-ember-cli-deploy-azure-tables');
app.use('/*', nodeEmberCliDeployAzureTables({
  accountName: 'AZURE_STORAGE_ACCOUNT_NAME',
  accessKey: 'AZURE_STORAGE_ACCESS_KEY'
}, 'myapp'));
```

### Custom Fetch Method
1. `require` the package
2. Use the `fetchIndex` method
3. Render the index string as you wish.

## Example
```javascript
var express = require('express');
var app = express();

var fetchIndex = require('node-ember-cli-deploy-azure-tables/fetch');

app.get('/', function(req, res) {
    fetchIndex(req, 'myapp', {
      accountName: 'AZURE_STORAGE_ACCOUNT_NAME',
      accessKey: 'AZURE_STORAGE_ACCESS_KEY'
    }).then(function (indexHtml) {
    indexHtml = serverVarInjectHelper.injectServerVariables(indexHtml, req);
    res.status(200).send(indexHtml);
  }).catch(function(err) {
    res.status(500).send('Oh noes!\n' + err.message);
  });
});
```
### Fetching a Specific Revision
You can  fetch a specific revision by using the `index_key` query param. Example:

```
http://www.coolio.com?index_key=abc123
```

## Contributing
Comments/PRs/Issues are welcome!
