/**
 * Author: Paul Newling
 * Date: 24AUG21
 * File: boat-cargo-functions.js
 * Description: Functions that involve both boat and cargo object. Predominately this involves associating boats with cargo and visa versa
 *  */

const { BOATS, CARGO, datastore } = require('./helper-functions/datastore-helpers');
const { getSpecificBoat } = require('./boat-functions');
const { getSpecificCargo } = require('./cargo-functions');

/**
 * Sets the Cargo 'carrier' attribute to the boat.id
 * @param {boat object} boat
 * @param {cargo object} cargo
 * @returns CargoKey (not normally used)
 */
async function assignBoatToCargo(boat, cargo) {
  const cargoKey = datastore.key([CARGO, parseInt(cargo.id, 10)]);
  cargo.carrier = `${boat.id}`;
  return await datastore.save({ key: cargoKey, data: cargo });
}

/**
 * Set 'carrier' attribute of cargo object to null
 * @param {cargo object} cargo
 * @returns CargoKey (not normally used)
 */
async function unassignBoatFromCargo(cargo) {
  const cargoKey = datastore.key([CARGO, parseInt(cargo.id, 10)]);
  cargo.carrier = null;
  return await datastore.save({ key: cargoKey, data: cargo });
}

/**
 * Removes all 'carrier' attributes of the cargo whose IDs are in the array.
 * Used when deleting a boat to remove all associated cargo links to the boat itself
 * @param {array of ints} cargoIDs
 */
async function unassignAllCargo(cargoIDs) {
  for (const cargo of cargoIDs) {
    let specificCargo = await getSpecificCargo(cargo.id);
    await unassignBoatFromCargo(specificCargo[0]);
  }
}

/**
 * Adds the boat ID of the boat object as the 'carrier' attribute of the cargo.
 * And adds the cargo ID to the boat object 'cargo' array attribute.
 * @param {boat object} boat 
 * @param {cargo object} cargo 
 * @returns boat object
 */
async function placeCargoOnBoat(boat, cargo) {
  await assignBoatToCargo(boat, cargo);
  const boatKey = datastore.key([BOATS, parseInt(boat.id, 10)]);
  const newCargoData = { id: `${cargo.id}` };
  boat.cargo.push(newCargoData);
  await datastore.save({ key: boatKey, data: boat });
  const updatedBoat = await getSpecificBoat(boat.id);
  return updatedBoat;
}

/**
 * Removes cargo ID from the boat 'cargo' array and sets the cargo 'carrier' attribute to null
 * @param {boat object} boat 
 * @param {cargo object} cargo 
 * @returns boat object
 */
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
