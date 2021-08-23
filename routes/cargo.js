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

/* ======================================= */

cargoRouter.get('/', checkAcceptJSON, (req, res) => {
  getCargo(req).then((response) => {
    getCargoCount().then((count) => {
      response.count = count;

      if (typeof response.cargo !== 'undefined') {
        for (let i = 0; i < Object.keys(response.cargo).length; i += 1) {
          addSelfURL(req, response.cargo[i]);
        }
        res.status(200).json(response);
      }
      else {
        res.status(200).json([]);
      }
    });
  });
});

// GET route for cargo that gets a specific cargo with id
cargoRouter.get('/:id', checkAcceptJSON, (req, res) => {
  const { id } = req.params;

  getSpecificCargo(id).then((cargo) => {
    if (Object.keys(cargo).length !== 0) {
      addSelfURL(req, cargo[0]);
      res.status(200).json(cargo[0]);
    }
    else {
      res.status(404).json({ Error: 'No cargo with this cargo_id exists' });
    }
  });
});

// POST route for cargo that creates a new cargo in the datastore
cargoRouter.post('/', checkContentAndAccepts, (req, res) => {
  const { volume, content, creationDate } = req.body;

  if (volume == null || content == null || creationDate == null) {
    res
      .status(400)
      .json(
        { Error: 'The request object is missing at least one of the required attributes' },
      );
  }
  else {
    postCargo(volume, content, creationDate).then((key) => {
      getSpecificCargo(key.id).then((newCargo) => {
        addSelfURL(req, newCargo[0]);
        res.status(201).send(newCargo[0]);
      });
    });
  }
});

cargoRouter.patch('/:cid', checkContentAndAccepts, (req, res) => {
  const { volume, content, creationDate } = req.body;
  const { cid } = req.params;

  getSpecificCargo(cid).then((cargo) => {
    if (Object.keys(cargo).length !== 0) {
      patchCargo(cid, volume, content, creationDate).then((updatedCargo) => {
        addSelfURL(req, updatedCargo[0]);
        res.status(200).json(updatedCargo[0]);
      });
    }
    else {
      res.status(404).json({ Error: 'No cargo with this cargo_id exists' });
    }
  });
});

cargoRouter.put('/:cid', checkContentAndAccepts, (req, res) => {
  const { volume, content, creationDate } = req.body;
  const { cid } = req.params;

  if (volume == null || content == null || creationDate == null) {
    res.status(400).json({
      Error:
              'The request object is missing at least one of the required attributes',
    });
  }
  else {
    getSpecificCargo(cid).then((cargo) => {
      if (Object.keys(cargo).length !== 0) {
        patchCargo(cid, volume, content, creationDate).then((updatedCargo) => {
          addSelfURL(req, updatedCargo[0]);
          res.status(200).json(updatedCargo[0]);
        });
      }
      else {
        res.status(404).json({ Error: 'No cargo with this cargo_id exists' });
      }
    });
  }
});

// DELETE route for boat that deletes selected boat if it exists.
cargoRouter.delete('/:id', (req, res) => {
  const { id } = req.params;

  getSpecificCargo(id).then((cargo) => {
    if (Object.keys(cargo).length === 0) {
      res.status(404).json({ Error: 'No cargo with this cargo_id exists' });
    }
    else if (cargo[0].carrier == null) {
      deleteCargo(id).then(res.status(204).end());
    }
    else {
      getSpecificBoat(cargo[0].carrier).then((boat) => {
        removeCargoFromBoat(boat[0], cargo[0]).then(() => {
          deleteCargo(id).then(res.status(204).end());
        });
      });
    }
  });
});

module.exports = cargoRouter;
