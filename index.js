'use strict';

const Promise  = require('bluebird');
const fetchIndex = require('./fetch');

module.exports = (connectionInfo, appName, opts) =>
  (req, res) =>
    new Promise((resolve, reject) => {
      fetchIndex(req, appName, connectionInfo, opts)
        .then((indexHtml) => {
          res.status(200).send(indexHtml);
          resolve();
        })
        .catch((err) => {
          res.status(500).send(err);
          reject(err);
        });
    });
