const { BOATS, CARGO, datastore } = require('./helper-functions/datastore-helpers');
const { getSpecificBoat } = require('./boat-functions');
const { getSpecificCargo } = require('./cargo-functions');

function assignBoatToCargo(boat, cargo) {
  const cargoKey = datastore.key([CARGO, parseInt(cargo.id, 10)]);
  cargo.carrier = `${boat.id}`;
  return datastore.save({ key: cargoKey, data: cargo });
}

function unassignBoatFromCargo(cargo) {
  const cargoKey = datastore.key([CARGO, parseInt(cargo.id, 10)]);
  cargo.carrier = null;
  return datastore.save({ key: cargoKey, data: cargo });
}

async function unassignAllCargo(cargoIDs) {
  for (const cargo of cargoIDs) {
    let specificCargo = await getSpecificCargo(cargo.id);
    await unassignBoatFromCargo(specificCargo[0]);
  }
}

async function placeCargoOnBoat(boat, cargo) {
  assignBoatToCargo(boat, cargo);
  const boatKey = datastore.key([BOATS, parseInt(boat.id, 10)]);
  const newCargoData = { id: `${cargo.id}` };
  boat.cargo.push(newCargoData);
  await datastore.save({ key: boatKey, data: boat });
  const updatedBoat = await getSpecificBoat(boat.id);
  return updatedBoat;
}

async function removeCargoFromBoat(boat, cargo) {
  const boatKey = datastore.key([BOATS, parseInt(boat.id, 10)]);
  const indexToRemove = boat.cargo.map((x) => x.id).indexOf(cargo.id);
  boat.cargo.splice(indexToRemove, 1);
  await unassignBoatFromCargo(cargo);

  await datastore.save({ key: boatKey, data: boat });
  const updatedBoat = await getSpecificBoat(boat.id);
  return updatedBoat;
}

module.exports = {
  placeCargoOnBoat,
  removeCargoFromBoat,
  unassignAllCargo,
};
