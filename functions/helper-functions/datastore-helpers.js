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
