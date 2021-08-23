/* eslint-disable no-restricted-syntax */
const { BOATS, datastore } = require('./helper-functions/datastore-helpers');
const { getSpecificCargo } = require('./cargo-functions');

// Sets the boat data of a boat object
function setBoatData(boatObject) {
  const boatDetails = {
    id: boatObject[datastore.KEY].id,
    name: boatObject.name,
    type: boatObject.type,
    length: boatObject.length,
    owner: boatObject.owner,
    cargo: boatObject.cargo,
  };
  return boatDetails;
}

// Creates a new boat object in the datastore
function postBoats(name, type, length, owner) {
  const key = datastore.key(BOATS);

  const newBoat = {
    name,
    type,
    length,
    owner,
    cargo: [],
  };

  return datastore.save({ key, data: newBoat }).then(() => key);
}

async function getBoatCountOfUserID(userID) {
  const query = datastore.createQuery(BOATS).filter('owner', '=', userID);

  return datastore.runQuery(query).then((entities) => {
    const count = Object.keys(entities[0]).length;

    return count;
  });
}

// Gets all boats in the datastore
async function getBoats(req) {
  let query = datastore.createQuery(BOATS).limit(5);

  if (Object.keys(req.query).includes('cursor')) {
    query = query.start(req.query.cursor);
  }

  return datastore.runQuery(query).then((entities) => {
    const results = {};
    results.boats = entities[0].map(setBoatData);

    if (entities[1].moreResults !== datastore.NO_MORE_RESULTS) {
      const next = `${req.protocol}://${req.get('host') + req.baseUrl}?cursor=${
        entities[1].endCursor
      }`;
      const editedNext = new URL(next.slice(0, -1));

      results.next = `${editedNext}`;
    }
    return results;
  });
}

// Gets all boats in the datastore
async function getPublicBoats(req) {
  let query = datastore.createQuery(BOATS).filter('public', '=', true).limit(5);

  if (Object.keys(req.query).includes('cursor')) {
    query = query.start(req.query.cursor);
  }

  return datastore.runQuery(query).then((entities) => {
    const results = {};
    results.boats = entities[0].map(setBoatData);

    if (entities[1].moreResults !== datastore.NO_MORE_RESULTS) {
      const next = `${req.protocol}://${req.get('host') + req.baseUrl}?cursor=${
        entities[1].endCursor
      }`;
      const editedNext = new URL(next.slice(0, -1));

      results.next = `${editedNext}`;
    }
    return results;
  });
}

async function getAllBoatsOfOwnerID(req, userID) {
  let query = datastore.createQuery(BOATS).filter('owner', '=', userID).limit(5);

  if (Object.keys(req.query).includes('cursor')) {
    query = query.start(req.query.cursor);
  }

  return datastore.runQuery(query).then((entities) => {
    const results = {};
    results.boats = entities[0].map(setBoatData);

    if (entities[1].moreResults !== datastore.NO_MORE_RESULTS) {
      const next = `${req.protocol}://${req.get('host') + req.baseUrl}?cursor=${
        entities[1].endCursor
      }`;
      const editedNext = new URL(next.slice(0, -1));

      results.next = `${editedNext}`;
    }
    return results;
  });
}

// Returns a specific boat with a boat id of 'id'
async function getSpecificBoat(id) {
  const key = datastore.key([BOATS, parseInt(id, 10)]);
  const query = datastore.createQuery(BOATS).filter('__key__', '=', key);

  return datastore.runQuery(query).then((results) => {
    const selectedBoat = results[0].map(setBoatData);
    return selectedBoat;
  });
}

async function getSpecificBoatCargo(boatCargo) {
  const allCargo = [];

  for await (const cargo of boatCargo) {
    getSpecificCargo(cargo.id).then((specificCargo) => {
      allCargo.push(specificCargo[0]);
    });
  }
  return allCargo;
}

// Patches boat of with id of 'id' with updated boat attributes
async function patchBoat(bid, name, type, length) {
  const key = datastore.key([BOATS, parseInt(bid, 10)]);

  return getSpecificBoat(bid).then((boat) => {
    const updatedBoat = boat[0];
    if (name != null) {
      updatedBoat.name = name;
    }
    if (type != null) {
      updatedBoat.type = type;
    }
    if (length != null) {
      updatedBoat.length = length;
    }
    return datastore.save({ key, data: updatedBoat }).then(() => getSpecificBoat(bid));
  });
}

// Deletes selected boat with id of 'id' in the datastore
function deleteBoats(id) {
  const key = datastore.key([BOATS, parseInt(id, 10)]);
  return datastore.delete(key);
}

module.exports = {
  setBoatData,
  getBoats,
  getBoatCountOfUserID,
  getPublicBoats,
  getAllBoatsOfOwnerID,
  getSpecificBoat,
  getSpecificBoatCargo,
  postBoats,
  patchBoat,
  deleteBoats,
};
