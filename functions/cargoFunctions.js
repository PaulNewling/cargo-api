/**
 * Author: Paul Newling
 * Date: 24AUG21
 * File: cargo-functions.js
 * Description: Functions involved with manipulation of cargo objects
 *  */
const { CARGO, datastore } = require('./helper-functions/datastoreHelpers');

/**
 * Function that sets a cargo objects details and id
 * @param {cargoObject} cargoObject 
 * @returns cargo object
 */
function setCargoData(cargoObject) {
  const cargoDetails = {
    id: cargoObject[datastore.KEY].id,
    volume: cargoObject.volume,
    carrier: cargoObject.carrier,
    content: cargoObject.content,
    creationDate: cargoObject.creationDate,
  };
  return cargoDetails;
}

/**
 * Function that adds a cargo object to the datastore
 * @param {int} volume 
 * @param {string} content 
 * @param {string} creationDate 
 * @returns (int) key
 */
async function postCargo(volume, content, creationDate) {
  const key = datastore.key(CARGO);
  const newCargo = {
    volume,
    content,
    carrier: null,
    creationDate,
  };
  await datastore.save({ key, data: newCargo });
  return key;
}

/**
 * Function that gets a count of all cargo in the datastore
 * @returns int(count)
 */
async function getCargoCount() {
  const query = datastore.createQuery(CARGO);
  const entities = await datastore.runQuery(query);
  const count = Object.keys(entities[0]).length;
  return count;
}

/**
 * Function that uses pagination to return an array of cargo objects.
 * If more than 5 cargo objects are in the datastore a link to the next page is displayed
 * @param {request object} req 
 * @returns array of cargo and if more than 5 cargo object a link to the next page
 */
async function getCargo(req) {

  // Sets paginiation limit to 5
  let query = datastore.createQuery(CARGO).limit(5);

  // check is 'curson' is in the query, this sets what page to begin on
  if (Object.keys(req.query).includes('cursor')) {
    query = query.start(req.query.cursor);
  }
  const entities = await datastore.runQuery(query);
  const results = {};
  results.cargo = entities[0].map(setCargoData);
  if (entities[1].moreResults !== datastore.NO_MORE_RESULTS) {
    const next = `${req.protocol}://${req.get('host') + req.baseUrl}?cursor=${entities[1].endCursor}`;
    const editedNext = new URL(next.slice(0, -1));
    results.next = `${editedNext}`;
  }
  return results;
}

/**
 * Fetches cargo object with specified id
 * @param {ID int} id 
 * @returns cargo object
 */
async function getSpecificCargo(id) {
  const key = datastore.key([CARGO, parseInt(id, 10)]);
  const query = datastore.createQuery(CARGO).filter('__key__', '=', key);
  const results = await datastore.runQuery(query);
  const selectedCargo = results[0].map(setCargoData);
  return selectedCargo;
}

/**
 * Function that updates a cargo object's attributes in the datastore
 * @param {ID int} id 
 * @param {int} volume 
 * @param {string} content 
 * @param {string} creationDate 
 * @returns cargo object
 */
async function patchCargo(id, volume, content, creationDate) {
  const key = datastore.key([CARGO, parseInt(id, 10)]);
  const cargo = await getSpecificCargo(id);
  const updatedCargo = cargo[0];
  if (volume != null) {
    updatedCargo.volume = volume;
  }
  if (content != null) {
    updatedCargo.content = content;
  }
  if (creationDate != null) {
    updatedCargo.creationDate = creationDate;
  }
  await datastore.save({ key, data: updatedCargo });
  return await getSpecificCargo(id);
}

/**
 * Deletes cargo object with specified id
 * @param {ID int} id 
 * @returns key (not normally used)
 */
async function deleteCargo(id) {
  const key = datastore.key([CARGO, parseInt(id, 10)]);
  return await datastore.delete(key);
}

module.exports = {
  setCargoData,
  getCargo,
  getCargoCount,
  getSpecificCargo,
  postCargo,
  patchCargo,
  deleteCargo,
};
