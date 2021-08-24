const { CARGO, datastore } = require('./helper-functions/datastore-helpers');

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

async function getCargoCount() {
  const query = datastore.createQuery(CARGO);
  const entities = await datastore.runQuery(query);
  const count = Object.keys(entities[0]).length;
  return count;
}

async function getCargo(req) {
  let query = datastore.createQuery(CARGO).limit(5);
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

// Returns a specific cargo with a cargo id of 'id'
async function getSpecificCargo(id) {
  const key = datastore.key([CARGO, parseInt(id, 10)]);
  const query = datastore.createQuery(CARGO).filter('__key__', '=', key);

  const results = await datastore.runQuery(query);
  const selectedCargo = results[0].map(setCargoData);
  return selectedCargo;
}

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

// Deletes selected boat with id of 'id' in the datastore
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
