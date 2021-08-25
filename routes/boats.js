const express = require('express');

const boatRouter = express.Router();
const { respondBadJWT, checkJWT } = require('../functions/jwt-functions');
const { addSelfURL } = require('../functions/helper-functions/addSelf-helpers');
const {
  getAllBoatsOfOwnerID,
  getSpecificBoat,
  postBoats,
  patchBoat,
  deleteBoats,
  getBoatCountOfUserID,
} = require('../functions/boat-functions');
const { placeCargoOnBoat, removeCargoFromBoat, unassignAllCargo } = require('../functions/boat-cargo-functions');
const { getSpecificCargo } = require('../functions/cargo-functions');
const { checkAcceptJSON, checkContentAndAccepts } = require('../middleware/reqContentAcceptsCheck');
const { checkIDisNumber } = require('../functions/helper-functions/boat-helpers');

/* ===== Boat Controller Functions ===== */

// GET route that will display the boats related to the user of the
//  corresponding JWT. If the JWT is missing or broken an error will be returned to the user
boatRouter.get('/', [checkAcceptJSON, checkJWT], async (req, res) => {
  const { userID } = req.params;
  if (req.error) {
    respondBadJWT(res);
  } else {
    const response = await getAllBoatsOfOwnerID(req, userID);
    const count = await getBoatCountOfUserID(userID);
    response.count = count;
    if (typeof response !== 'undefined') {
      for (let i = 0; i < Object.keys(response.boats).length; i += 1) {
        await addSelfURL(req, response.boats[i]);
        for (let cargo of response.boats[i].cargo) {
          req.baseUrl = '/cargo';
          await addSelfURL(req, cargo);
        }
      }
      res.status(200).json(response);
    } else {
      res.status(200).json([]);
    }
  }
});

boatRouter.post('/', [checkContentAndAccepts, checkJWT], async (req, res) => {
  const { name, type, length } = req.body;
  const { userID } = req.params;

  if (req.error) {
    respondBadJWT(res);
  } else if (name == null || type == null || length == null) {
    res.status(400).json({ Error: 'The request object is missing at least one of the required attributes' });
  } else {
    var key = await postBoats(name, type, length, userID);
    var newBoat = await getSpecificBoat(key.id);
    await addSelfURL(req, newBoat[0]);
    res.status(201).json(newBoat[0]);
  }
});

// GET route for boats that gets a specific boat with id
boatRouter.get('/:bid', [checkAcceptJSON, checkJWT], async (req, res) => {
  const { bid, userID } = req.params;
  if (req.error) {
    respondBadJWT(res);
  } else {
    var boatObj = await getSpecificBoat(bid);
    const [boat] = boatObj;
    if (Object.keys(boatObj).length !== 0) {
      if (boat.owner === userID) {
        await addSelfURL(req, boat);
        for (let cargo of boat.cargo) {
          req.baseUrl = '/cargo';
          await addSelfURL(req, cargo);
        }
        res.status(200).json(boat);
      } else {
        res.status(403).json({ Error: 'You do not have access to modify or view this boat' });
      }
    } else {
      res.status(404).json({ Error: 'No boat with this boat_id exists or you do not have access to it' });
    }
  }
});

boatRouter.patch('/:boatID', [checkContentAndAccepts, checkJWT], async (req, res) => {
  const { boatID, userID } = req.params;
  const { id, name, type, length } = req.body;

  if (req.error) {
    respondBadJWT(res);
  } else {
    try {
      let boat = await getSpecificBoat(boatID);
      if (Object.keys(boat).length !== 0) {
        if (id !== undefined) {
          res.status(400).json({ Error: 'Boat ID modification is not allowed.' });
        } else if (boat[0].owner !== userID) {
          res.status(403).json({
            Error: 'You do not have access to modify or view this boat',
          });
        } else {
          var updatedBoat = await patchBoat(boatID, name, type, length);
          addSelfURL(req, updatedBoat[0]);
          res.status(200).json(updatedBoat[0]);
        }
      } else {
        res.status(404).json({ Error: 'No boat with this boat_id exists or you do not have access to it' });
      }
    } catch (e) {
      console.log(e);
    }
  }
});

boatRouter.put('/:boatID', [checkContentAndAccepts, checkJWT], async (req, res) => {
  const { boatID, userID } = req.params;
  const { id, name, type, length } = req.body;

  if (req.error) {
    respondBadJWT(res);
  } else if (name == null || type == null || length == null) {
    res.status(400).json({ Error: 'The request object is missing at least one of the required attributes' });
  } else {
    try {
      let boat = await getSpecificBoat(boatID);
      if (Object.keys(boat).length !== 0) {
        if (id !== undefined) {
          res.status(400).json({ Error: 'Boat ID modification is not allowed.' });
        } else if (boat[0].owner !== userID) {
          res.status(403).json({ Error: 'You do not have access to modify or view this boat' });
        } else {
          let updatedBoat = await patchBoat(boatID, name, type, length);
          await addSelfURL(req, updatedBoat[0]);
          res.status(200).json(updatedBoat[0]);
        }
      } else {
        res.status(404).json({ Error: 'No boat with this boat_id exists or you do not have access to it' });
      }
    } catch (e) {
      console.log(e);
    }
  }
});

// ~~~~~~~~~~~~~~~~~~~~~~~~
boatRouter.patch('/:bid/cargo/:cid', checkJWT, async (req, res) => {
  const { bid, cid, userID } = req.params;

  if (!checkIDisNumber(bid) || !checkIDisNumber(cid)) {
    res.status(400).json({ Error: 'Identifier malformed.' });
  } else if (req.error) {
    respondBadJWT(res);
  } else {
    let boat = await getSpecificBoat(bid);
    if (Object.keys(boat).length === 0) {
      res.status(404).json({ Error: 'The specified boat and/or cargo does not exist' });
    } else if (boat[0].owner !== userID) {
      res.status(403).json({ Error: 'You do not have access to modify or view this boat' });
    } else {
      let cargo = await getSpecificCargo(cid);
      if (Object.keys(cargo).length === 0 || Object.keys(boat).length === 0) {
        res.status(404).json({ Error: 'The specified boat and/or cargo does not exist' });
      } else if (cargo[0].carrier != null) {
        res.status(403).json({ Error: 'The specified cargo is already assigned a boat' });
      } else {
        let loadedBoat = await placeCargoOnBoat(boat[0], cargo[0]);
        await addSelfURL(req, loadedBoat[0]);
        for (let cargo of loadedBoat[0].cargo) {
          req.baseUrl = '/cargo';
          await addSelfURL(req, cargo);
        }
        res.status(201).json(loadedBoat[0]);
      }
    }
  }
});

boatRouter.delete('/:bid/cargo/:cid', [checkAcceptJSON, checkJWT], async (req, res) => {
  const { bid, cid, userID } = req.params;

  if (!checkIDisNumber(bid) || !checkIDisNumber(cid)) {
    res.status(400).json({ Error: 'Identifier malformed.' });
  } else if (req.error) {
    respondBadJWT(res);
  } else {
    let boat = await getSpecificBoat(bid);
    if (Object.keys(boat).length === 0) {
      res.status(404).json({ Error: 'The specified boat and/or cargo does not exist' });
    } else if (boat[0].owner !== userID) {
      res.status(403).json({ Error: 'You do not have access to modify or view this boat' });
    } else {
      let specificCargo = await getSpecificCargo(cid);
      if (Object.keys(specificCargo).length === 0 || Object.keys(boat).length === 0) {
        res.status(404).json({ Error: 'The specified boat and/or cargo does not exist' });
      } else if (specificCargo[0].carrier !== req.params.bid) {
        res.status(403).json({ Error: 'The specified boat is not assigned to this cargo' });
      } else {
        let index = -1;
        for (let k = 0; k < Object.keys(boat[0].cargo).length; k += 1) {
          if (specificCargo[0].id === boat[0].cargo[k].id) {
            index = k;
            break;
          }
        }
        if (index !== -1) {
          let boatWithRemovedCargo = await removeCargoFromBoat(boat[0], specificCargo[0]);
          await addSelfURL(req, boatWithRemovedCargo[0]);
          for (let cargo of boatWithRemovedCargo[0].cargo) {
            req.baseUrl = '/cargo';
            await addSelfURL(req, cargo);
          }
          res.status(201).json(boatWithRemovedCargo[0]);
        } else {
          res.status(403).json({ Error: 'The specified cargo is not assigned to this boat' });
        }
      }
    }
  }
});

// DELETE route for boat that deletes selected boat if it exists.
boatRouter.delete('/:boatID', checkJWT, async (req, res) => {
  const { boatID, userID } = req.params;
  if (req.error) {
    respondBadJWT(res);
  } else {
    let boat = await getSpecificBoat(boatID);
    if (Object.keys(boat).length === 0 || boat[0].owner !== userID) {
      res.status(404).json({ Error: 'No boat with this boat_id exists or you do not have access to it' });
    } else if (boat[0].cargo.length === 0) {
      await deleteBoats(boatID);
      res.status(204).end();
    } else {
      await unassignAllCargo(boat[0].cargo);
      await deleteBoats(boatID);
      res.status(204).end();
    }
  }
});

module.exports = boatRouter;
