const { BOATS, datastore } = require('./helper-functions/datastore-helpers');
const { getSpecificCargo } = require('./cargo-functions');

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

async function postBoats(name, type, length, owner) {
  const key = datastore.key(BOATS);
  const newBoat = {
    name,
    type,
    length,
    owner,
    cargo: [],
  };
  await datastore.save({ key, data: newBoat });
  return key;
}

async function getBoatCountOfUserID(userID) {
  const query = datastore.createQuery(BOATS).filter('owner', '=', userID);
  const entities = await datastore.runQuery(query);
  const count = Object.keys(entities[0]).length;
  return count;
}

// Gets all boats in the datastore
async function getBoats(req) {
  let query = datastore.createQuery(BOATS).limit(5);
  if (Object.keys(req.query).includes('cursor')) {
    query = query.start(req.query.cursor);
  }
  const entities = await datastore.runQuery(query);
  const results = {};
  results.boats = entities[0].map(setBoatData);
  if (entities[1].moreResults !== datastore.NO_MORE_RESULTS) {
    const next = `${req.protocol}://${req.get('host') + req.baseUrl}?cursor=${entities[1].endCursor}`;
    const editedNext = new URL(next.slice(0, -1));
    results.next = `${editedNext}`;
  }
  return results;
}

async function getAllBoatsOfOwnerID(req, userID) {
  let query = datastore.createQuery(BOATS).filter('owner', '=', userID).limit(5);
  if (Object.keys(req.query).includes('cursor')) {
    query = query.start(req.query.cursor);
  }
  const entities = await datastore.runQuery(query);
  const results = {};
  results.boats = entities[0].map(setBoatData);
  if (entities[1].moreResults !== datastore.NO_MORE_RESULTS) {
    const next = `${req.protocol}://${req.get('host') + req.baseUrl}?cursor=${entities[1].endCursor}`;
    const editedNext = new URL(next.slice(0, -1));
    results.next = `${editedNext}`;
  }
  return results;
}

// Returns a specific boat with a boat id of 'id'
async function getSpecificBoat(id) {
  const key = datastore.key([BOATS, parseInt(id, 10)]);
  const query = datastore.createQuery(BOATS).filter('__key__', '=', key);
  const results = await datastore.runQuery(query);
  const selectedBoat = results[0].map(setBoatData);
  return selectedBoat;
}

async function getSpecificBoatCargo(boatCargo) {
  const allCargo = [];
  for (const cargo of boatCargo) {
    const specificCargo = await getSpecificCargo(cargo.id);
    allCargo.push(specificCargo[0]);
  }
  return allCargo;
}

// Patches boat of with id of 'id' with updated boat attributes
async function patchBoat(bid, name, type, length) {
  const key = datastore.key([BOATS, parseInt(bid, 10)]);

  const boat = await getSpecificBoat(bid);
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
  await datastore.save({ key, data: updatedBoat });
  return await getSpecificBoat(bid);
}

// Deletes selected boat with id of 'id' in the datastore
async function deleteBoats(id) {
  const key = await datastore.key([BOATS, parseInt(id, 10)]);
  return datastore.delete(key);
}

module.exports = {
  setBoatData,
  getBoats,
  getBoatCountOfUserID,
  getAllBoatsOfOwnerID,
  getSpecificBoat,
  getSpecificBoatCargo,
  postBoats,
  patchBoat,
  deleteBoats,
};
