/**
 * Author: Paul Newling
 * Date: 24AUG21
 * File: cargo.js
 * Description: File that contains all of the routes associated with cargo
 *  */

const express = require('express');
const cargoRouter = express.Router();
const { addSelfURL } = require('../functions/helper-functions/addSelf-helpers');
const {
  getCargo,
  getSpecificCargo,
  postCargo,
  patchCargo,
  deleteCargo,
  getCargoCount,
} = require('../functions/cargo-functions');
const { getSpecificBoat } = require('../functions/boat-functions');
const { removeCargoFromBoat } = require('../functions/boat-cargo-functions');
const { checkAcceptJSON, checkContentAndAccepts } = require('../middleware/reqContentAcceptsCheck');


/**
 * GET route to get all cargo
 * Middleware checks to ensure request accepts JSON in return
 */
cargoRouter.get('/', checkAcceptJSON, async (req, res) => {
  // Gets the cargo array and the full cargo count
  let response = await getCargo(req);
  let count = await getCargoCount();
  response.count = count;

  // Checks to see if the response contains any cargo entities, if so it attaches their associated URL to their object
  // before sending the data to the user
  if (typeof response.cargo !== 'undefined') {
    for (let cargo of response.cargo) {
      await addSelfURL(req, cargo);
    }
    res.status(200).json(response);
  } else {
      
    // Otherwise return an empty array
    res.status(200).json([]);
  }
});

/**
 * GET route to get specific cargo with ID
 * Middleware checks to ensure request accepts JSON in return
 */
cargoRouter.get('/:id', checkAcceptJSON, async (req, res) => {
  const { id } = req.params;
  
  // Gets cargo with the specific ID
  let cargo = await getSpecificCargo(id);

  // If cargo exists attach their associated URL and return object
  if (Object.keys(cargo).length !== 0) {
    addSelfURL(req, cargo[0]);
    res.status(200).json(cargo[0]);
  } else {

    // Otherwise return an error message
    res.status(404).json({ Error: 'No cargo with this cargo_id exists' });
  }
});

/**
 * POST route to create new cargo
 * Middleware checks to ensure request is JSON and accepts JSON in return
 */
cargoRouter.post('/', checkContentAndAccepts, async (req, res) => {
  const { volume, content, creationDate } = req.body;

  // Check to ensure all required params are in the request
  if (volume == null || content == null || creationDate == null) {
    res.status(400).json({ Error: 'The request object is missing at least one of the required attributes' });
  } else {

    // Create the new cargo entity
    let key = await postCargo(volume, content, creationDate);

    // Get the key returned from creating the cargo, get the specific cargo object and attach the associated URL
    let newCargo = await getSpecificCargo(key.id);
    await addSelfURL(req, newCargo[0]);

    // Finally return the object to the user
    res.status(201).send(newCargo[0]);
  }
});

/**
 * PATCH route to update cargo attribute
 * Middleware checks to ensure request is JSON and accepts JSON in return
 */
cargoRouter.patch('/:cid', checkContentAndAccepts, async (req, res) => {
  const { volume, content, creationDate } = req.body;
  const { cid } = req.params;

  // Get the specific cargo object
  let cargo = await getSpecificCargo(cid);

  // If it exists make the associated changes, add the associated URL and return the object to the user
  if (Object.keys(cargo).length !== 0) {
    let updatedCargo = await patchCargo(cid, volume, content, creationDate);
    await addSelfURL(req, updatedCargo[0]);
    res.status(200).json(updatedCargo[0]);
  } else {

    // Otherwise return that the specific cargo was not able to be found
    res.status(404).json({ Error: 'No cargo with this cargo_id exists' });
  }
});

/**
 * PUT route to update all cargo attributes
 * Middleware checks to ensure request is JSON and accepts JSON in return
 */
cargoRouter.put('/:cid', checkContentAndAccepts, async (req, res) => {
  const { volume, content, creationDate } = req.body;
  const { cid } = req.params;

  // Check to ensure all attributes are not null
  if (volume == null || content == null || creationDate == null) {
    res.status(400).json({ Error: 'The request object is missing at least one of the required attributes' });
  } else {

    // Get the specific cargo object
    let cargo = await getSpecificCargo(cid);

    // If it exists make the associated changes, add the associated URL and return the object to the user
    if (Object.keys(cargo).length !== 0) {
      let updatedCargo = await patchCargo(cid, volume, content, creationDate);
      await addSelfURL(req, updatedCargo[0]);
      res.status(200).json(updatedCargo[0]);
    } else {

      // Otherwise return that the specific cargo was not able to be found
      res.status(404).json({ Error: 'No cargo with this cargo_id exists' });
    }
  }
});

/**
 * DELETE route to delete one cargo
 */
cargoRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;

  // Get the specific cargo object
  let cargo = await getSpecificCargo(id);

  // If none exists with that ID return an error
  if (Object.keys(cargo).length === 0) {
    res.status(404).json({ Error: 'No cargo with this cargo_id exists' });

    // If the cargo is not associated with a boat, simply delete the cargo object
  } else if (cargo[0].carrier == null) {
    await deleteCargo(id);
    res.status(204).end();

    // If the cargo is associated with a boat, remove the association from the boat to the cargo, then delete the cargo object
  } else {
    let boat = await getSpecificBoat(cargo[0].carrier);
    await removeCargoFromBoat(boat[0], cargo[0]);
    await deleteCargo(id);
    res.status(204).end(); 
  }
});

module.exports = cargoRouter;
