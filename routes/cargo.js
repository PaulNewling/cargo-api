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
 */
cargoRouter.get('/', checkAcceptJSON, async (req, res) => {
  let response = await getCargo(req);
  let count = await getCargoCount();
  response.count = count;
  if (typeof response.cargo !== 'undefined') {
    for (let cargo of response.cargo) {
      await addSelfURL(req, cargo);
    }
    res.status(200).json(response);
  } else {
    res.status(200).json([]);
  }
});

/**
 * GET route to get specific cargo with ID
 */
cargoRouter.get('/:id', checkAcceptJSON, async (req, res) => {
  const { id } = req.params;
  let cargo = await getSpecificCargo(id);
  if (Object.keys(cargo).length !== 0) {
    addSelfURL(req, cargo[0]);
    res.status(200).json(cargo[0]);
  } else {
    res.status(404).json({ Error: 'No cargo with this cargo_id exists' });
  }
});

/**
 * POST route to create new cargo
 */
cargoRouter.post('/', checkContentAndAccepts, async (req, res) => {
  const { volume, content, creationDate } = req.body;
  if (volume == null || content == null || creationDate == null) {
    res.status(400).json({ Error: 'The request object is missing at least one of the required attributes' });
  } else {
    let key = await postCargo(volume, content, creationDate);
    let newCargo = await getSpecificCargo(key.id);
    await addSelfURL(req, newCargo[0]);
    res.status(201).send(newCargo[0]);
  }
});

/**
 * PATCH route to update cargo attribute
 */
cargoRouter.patch('/:cid', checkContentAndAccepts, async (req, res) => {
  const { volume, content, creationDate } = req.body;
  const { cid } = req.params;
  let cargo = await getSpecificCargo(cid);
  if (Object.keys(cargo).length !== 0) {
    let updatedCargo = await patchCargo(cid, volume, content, creationDate);
    await addSelfURL(req, updatedCargo[0]);
    res.status(200).json(updatedCargo[0]);
  } else {
    res.status(404).json({ Error: 'No cargo with this cargo_id exists' });
  }
});

/**
 * PUT route to update all cargo attributes
 */
cargoRouter.put('/:cid', checkContentAndAccepts, async (req, res) => {
  const { volume, content, creationDate } = req.body;
  const { cid } = req.params;
  if (volume == null || content == null || creationDate == null) {
    res.status(400).json({ Error: 'The request object is missing at least one of the required attributes' });
  } else {
    let cargo = await getSpecificCargo(cid);
    if (Object.keys(cargo).length !== 0) {
      
      let updatedCargo = await patchCargo(cid, volume, content, creationDate);
      console.log(updatedCargo);
      await addSelfURL(req, updatedCargo[0]);
      res.status(200).json(updatedCargo[0]);
    } else {
      res.status(404).json({ Error: 'No cargo with this cargo_id exists' });
    }
  }
});

/**
 * DELETE route to delete one cargo
 */
cargoRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;
  let cargo = await getSpecificCargo(id);
  if (Object.keys(cargo).length === 0) {
    res.status(404).json({ Error: 'No cargo with this cargo_id exists' });
  } else if (cargo[0].carrier == null) {
    deleteCargo(id).then(res.status(204).end());
  } else {
    let boat = await getSpecificBoat(cargo[0].carrier);
    await removeCargoFromBoat(boat[0], cargo[0]);
    await deleteCargo(id);
    res.status(204).end(); 
  }
});

module.exports = cargoRouter;
