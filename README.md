# node-ember-cli-deploy-azure-tables
ExpressJS middleware to fetch the current (or specified) revision of your Ember App from Azure Tables deployed by [ember-cli-deploy](https://github.com/ember-cli/ember-cli-deploy).

## Why?
[ember-cli-deploy](https://github.com/ember-cli/ember-cli-deploy) is great. It allows you to run
multiple versions in production at the same time and view revisions without impacting users.
However, [the example provided](https://github.com/philipheinser/ember-lightning) uses [koa](http://koajs.com/)
and many of us are not. This package allows you to easily fetch current and specified `index.html`
revisions from Azure Table storage.

## Deploying to Azure via Ember CLI
Check out the excellent [ember-cli-deploy-azure](https://github.com/duizendnegen/ember-cli-deploy-azure/) addon by [duizendnegen](https://github.com/duizendnegen/)!

## Installation

```
npm install node-ember-cli-deploy-azure-tables
```

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

### Fetching a Specific Revision
You can  fetch a specific revision by using the `index_key` query param. Example:

```
http://www.coolio.com?index_key=abc123
```

## Documentation
### `nodeEmberCliDeployAzureTables(connectionInfo, keyPrefix, options)` (middleware constructor)
* `connectionInfo` (object, required) - the configuration to connect to azure tables.  
  - `accountName` (required) - azure storage account name
  - `accessKey` (required) - azure storage account key
* `keyPrefix` (required) - the application name, specified for ember deploy  
     the keys in azure tables are prefaced with this name. For instance, if your azure table keys are `my-app:index:current`, you'd pass `my-app:index`.
* `options` (optional) - a hash of params to override [the defaults](https://github.com/jamesdixon/node-ember-cli-deploy-azure-tables/blob/master/README.md#options)

### options
* `revisionQueryParam` (defaults to `index_key`)  
   the query parameter to specify a revision (e.g. `http://example.org/?index_key=abc123`). the key will be automatically prefaced with your `keyPrefix` for security.
* `memoize` (defaults to `false`)
   enable memoizing azure storage. see [the memoization section](#Memoization) for more details.
* `memoizeOpts`
   customize memoization parameters. see [the memoization section](#Memoization) for more details.

## Memoization
Since the majority of the requests will be serving the `current` version of your
app, you can enable memoization to reduce the load on Azure Tables. By default, memoization
is disabled. To enable it, simply pass:

```javascript
memoize: true
```

in your options hash. Additionally, you can pass options to the underlying memoization
library ([memoizee](https://github.com/medikoo/memoizee)). Check out their documentation,
and the [defaults](https://github.com/jamesdixon/node-ember-cli-deploy-azure-tables/blob/master/fetch.js#L13)
for this library.

### Example
```javascript
app.use('/*', nodeEmberCliDeployAzureTables({
  accountName: 'AZURE_STORAGE_ACCOUNT_NAME',
  accessKey: 'AZURE_STORAGE_ACCESS_KEY'
  },
  'myapp',
  { memoize: true },
));
```

## Credit
This is a modified version of [Ben Limmer's](https://github.com/blimmer) excellent [node-ember-cli-deploy-redis](https://github.com/blimmer/node-ember-cli-deploy-redis) package. Thanks, Ben!

## Contributing
Comments/PRs/Issues are welcome!
