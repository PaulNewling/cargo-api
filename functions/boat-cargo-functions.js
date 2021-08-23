/* eslint-disable no-restricted-syntax */
const { BOATS, CARGO, datastore } = require('./helper-functions/datastore-helpers');
const { getSpecificBoat } = require('./boat-functions');
const { getSpecificCargo } = require('./cargo-functions');

function assignBoatToCargo(boat, cargo) {
  const cargoKey = datastore.key([CARGO, parseInt(cargo.id, 10)]);

  // eslint-disable-next-line no-param-reassign
  cargo.carrier = `${boat.id}`;

  return datastore.save({ key: cargoKey, data: cargo });
}

function unassignBoatFromCargo(cargo) {
  const cargoKey = datastore.key([CARGO, parseInt(cargo.id, 10)]);

  // eslint-disable-next-line no-param-reassign
  cargo.carrier = null;

  return datastore.save({ key: cargoKey, data: cargo });
}

async function unassignAllCargo(cargoIDs) {
  for await (const cargo of cargoIDs) {
    getSpecificCargo(cargo.id).then((specificCargo) => {
      unassignBoatFromCargo(specificCargo[0]);
    });
  }
}

async function placeCargoOnBoat(boat, cargo) {
  assignBoatToCargo(boat, cargo);

  const boatKey = datastore.key([BOATS, parseInt(boat.id, 10)]);

  const newCargoData = { id: `${cargo.id}` };
  boat.cargo.push(newCargoData);

  return datastore.save({ key: boatKey, data: boat }).then(() => {
    const updatedBoat = getSpecificBoat(boat.id);
    return updatedBoat;
  });
}

async function removeCargoFromBoat(boat, cargo) {
  const boatKey = datastore.key([BOATS, parseInt(boat.id, 10)]);

  const indexToRemove = boat.cargo.map((x) => x.id).indexOf(cargo.id);
  boat.cargo.splice(indexToRemove, 1);

  await unassignBoatFromCargo(cargo);

  return datastore.save({ key: boatKey, data: boat }).then(() => {
    const updatedBoat = getSpecificBoat(boat.id);
    return updatedBoat;
  });
}

module.exports = {
  placeCargoOnBoat,
  removeCargoFromBoat,
  unassignAllCargo,
};
