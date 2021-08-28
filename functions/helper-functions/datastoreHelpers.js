/**
 * Author: Paul Newling
 * Date: 24AUG21
 * File: datastore-helpers.js
 * Description: Helper functions and initializations for use of the Google Cloud Datastore
 *  */ 

const { Datastore } = require('@google-cloud/datastore');

const BOATS = 'Boats';
const CARGO = 'Cargo';
const USERS = 'Users';

module.exports = {
  BOATS,
  CARGO,
  USERS,
};

module.exports.Datastore = Datastore;
module.exports.datastore = new Datastore();
module.exports.fromDatastore = function fromDatastore(item) {
  item.id = item[Datastore.KEY].id;
  return item;
};
