/**
 * Author: Paul Newling
 * Date: 24AUG21
 * File: boat-functions.js
 * Description: Functions involved with manipulation of boat objects
 *  */

const { BOATS, datastore } = require('./helper-functions/datastore-helpers');
const { getSpecificCargo } = require('./cargo-functions');

/**
 * Sets boat object details and id
 * @param {boat object} boatObject 
 * @returns boat object
 */
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

/**
 * Creates and saves boat object data to datastore, returning with the unique key
 * @param {string} name 
 * @param {string} type 
 * @param {int} length 
 * @param {ID int} owner 
 * @returns (int) key
 */
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

/**
 * Counts the number of boat objects of a particular userID
 * @param {ID int} userID 
 * @returns (int) count
 */
async function getBoatCountOfUserID(userID) {
  const query = datastore.createQuery(BOATS).filter('owner', '=', userID);
  const entities = await datastore.runQuery(query);
  const count = Object.keys(entities[0]).length;
  return count;
}

/**
 * Function that fetches an array of boat objects paginated to a maximum of 5.
 * If there are more than 5 boat objects in the datastore a link to the next page is included
 * @param {reqest object} req 
 * @returns array of boat objects if there are any, if more than 5 also includes a link to next set of boat objects
 */
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

/**
 * Function that fetches an array of boat objects associated with a user ID to a maximum of 5.
 * If there are more than 5 associated boat objects in the datastore a link to the next page is included
 * @param {request object} req 
 * @param {ID int} userID 
 * @returns array of boat objects associated with a user ID if there are any, if more than 5 also includes a link to next set of boat objects
 */
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

/**
 * Function that fetches a boat object with matching id attribute.
 * @param {int} id 
 * @returns boat object
 */
async function getSpecificBoat(id) {
  const key = datastore.key([BOATS, parseInt(id, 10)]);
  const query = datastore.createQuery(BOATS).filter('__key__', '=', key);
  const results = await datastore.runQuery(query);
  const selectedBoat = results[0].map(setBoatData);
  return selectedBoat;
}

/**
 * Function that gets all of the associated cargo of a boat 
 * @param {boat object} boat
 * @returns array of cargo objects
 */
async function getSpecificBoatCargo(boat) {
  const allCargo = [];
  for (const cargo of boat) {
    const specificCargo = await getSpecificCargo(cargo.id);
    allCargo.push(specificCargo[0]);
  }
  return allCargo;
}

/**
 * Function that updates a boat object's attributes
 * @param {ID int} bid 
 * @param {string} name 
 * @param {string} type 
 * @param {int} length 
 * @returns boat object
 */
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

/**
 * Function that deletes a boat object from the datastore.
 * @param {ID int} id 
 * @returns key (not usually used)
 */
async function deleteBoats(id) {
  const key = await datastore.key([BOATS, parseInt(id, 10)]);
  return await datastore.delete(key);
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
