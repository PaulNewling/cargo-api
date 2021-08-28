/**
 * Author: Paul Newling
 * Date: 24AUG21
 * File: boats.js
 * Description: File that contains all of the boat related routes
 *  */

const express = require('express');
const boatRouter = express.Router();
const { respondBadJWT, checkJWT } = require('../functions/jwtFunctions');
const { addSelfURL } = require('../functions/helper-functions/addSelfHelpers');
const {
  getAllBoatsOfOwnerID,
  getSpecificBoat,
  postBoats,
  patchBoat,
  deleteBoats,
  getBoatCountOfUserID,
} = require('../functions/boatFunctions');
const { placeCargoOnBoat, removeCargoFromBoat, unassignAllCargo } = require('../functions/boatCargoFunctions');
const { getSpecificCargo } = require('../functions/cargoFunctions');
const { checkAcceptJSON, checkContentAndAccepts } = require('../middleware/reqContentAcceptsCheck');
const { checkIDisNumber } = require('../functions/helper-functions/boatHelpers');

/**
 * GET route for boats
 * Middleware checks that the request accepts JSON response and if the request has a valid, invalid or no JWT
 */
boatRouter.get('/', [checkAcceptJSON, checkJWT], async (req, res) => {
  const { userID } = req.params;

  // Check if the JWT is valid, if invalid respond with the error
  if (req.error) {
    respondBadJWT(res);
  } else {

    // Get the number and array of boats associated with the user
    const response = await getAllBoatsOfOwnerID(req, userID);
    const count = await getBoatCountOfUserID(userID);
    response.count = count;

    // Check that the user is associated with at least one boat, if not response will be undefined
    // and the step of appending associated URLs can be skipped
    if (typeof response !== 'undefined') {

      // For each boat attached the associated URL
      for (let i = 0; i < count; i += 1) {
        await addSelfURL(req, response.boats[i]);

        // For each piece of cargo associated with that boat append the associated URL
        for (let cargo of response.boats[i].cargo) {
          req.baseUrl = '/cargo';
          await addSelfURL(req, cargo);
        }
      }

      // Respond with array to the user
      res.status(200).json(response);
    } else {

      // Otherwise respond with an empty array
      res.status(200).json([]);
    }
  }
});

/**
 * POST route to create boats
 * Middleware checks that the request accepts JSON response and if the request has a valid, invalid or no JWT
 */
boatRouter.post('/', [checkContentAndAccepts, checkJWT], async (req, res) => {
  const { name, type, length } = req.body;
  const { userID } = req.params;

  // Check if the JWT is valid, if invalid respond with the error, otherwise ensure all required attributes are present
  if (req.error) {
    respondBadJWT(res);
  } else if (name == null || type == null || length == null) {
    res.status(400).json({ Error: 'The request object is missing at least one of the required attributes' });
  } else {

    // If everything is in order, create the new boat, use the newly created key to get the new boat object
    // append the associated URL with the new boat and respond with it to the user
    var key = await postBoats(name, type, length, userID);
    var newBoat = await getSpecificBoat(key.id);
    await addSelfURL(req, newBoat[0]);
    res.status(201).json(newBoat[0]);
  }
});

/**
 * GET route for getting a boat with a specific ID
 * Middleware checks that the request accepts a JSON response and if the request has a valid, invalid or no JWT
 */
boatRouter.get('/:bid', [checkAcceptJSON, checkJWT], async (req, res) => {
  const { bid, userID } = req.params;

  // Check if the JWT is valid, if invalid respond with the error
  if (req.error) {
    respondBadJWT(res);
  } else {

    // Get the specific boat by ID if it exists
    var boatObj = await getSpecificBoat(bid);
    const [boat] = boatObj;

    // If the boat exists proceed...
    if (Object.keys(boatObj).length !== 0) {

      // Check that user is associated with the boat, if they are append the URL for the boat and its cargo and respond to the user
      if (boat.owner === userID) {
        await addSelfURL(req, boat);
        for (let cargo of boat.cargo) {
          req.baseUrl = '/cargo';
          await addSelfURL(req, cargo);
        }
        res.status(200).json(boat);

        // If the boat is not associated with the user relay an error
      } else {
        res.status(403).json({ Error: 'You do not have access to modify or view this boat' });
      }

      // If no boat exists with that ID, relay an error
    } else {
      res.status(404).json({ Error: 'No boat with this boat_id exists or you do not have access to it' });
    }
  }
});

/**
 * PATCH route to update a boat attribute
 * Middleware checks that the request accepts JSON, is in JSON and if the request has a valid, invalid or no JWT
 */
boatRouter.patch('/:boatID', [checkContentAndAccepts, checkJWT], async (req, res) => {
  const { boatID, userID } = req.params;
  const { id, name, type, length } = req.body;

  // Check if the JWT is valid, if invalid respond with the error
  if (req.error) {
    respondBadJWT(res);
  } else {

    try{
        
      // Get the boat with the specific ID
      let boat = await getSpecificBoat(boatID);
      if (Object.keys(boat).length !== 0) {

        // Ensure the boat ID is not being modified, if so respond with the error
        if (id !== undefined) {
          res.status(400).json({ Error: 'Boat ID modification is not allowed.' });

        // Ensure the boat is associated with the user otherwise respond with the error
        } else if (boat[0].owner !== userID) {
          res.status(403).json({
            Error: 'You do not have access to modify or view this boat',
          });
        } else {

          // If everything is in order update the boat, attach the associated URL and send the updated boat as the response
          var updatedBoat = await patchBoat(boatID, name, type, length);
          addSelfURL(req, updatedBoat[0]);
          res.status(200).json(updatedBoat[0]);
        }
      } else {

        // If a boat with the specific ID does not exist respond with an error
        res.status(404).json({ Error: 'No boat with this boat_id exists or you do not have access to it' });
      }
    } catch (e) {
      console.log(e);
    }
  }
});

/**
 * PUT route to update all boat attributes
 * Middleware checks that the request accepts JSON, is in JSON and if the request has a valid, invalid or no JWT
 */
boatRouter.put('/:boatID', [checkContentAndAccepts, checkJWT], async (req, res) => {
  const { boatID, userID } = req.params;
  const { id, name, type, length } = req.body;

  // Check if the JWT is valid, if invalid respond with the error
  if (req.error) {
    respondBadJWT(res);
  } else if (name == null || type == null || length == null) {

    // Check that none of the attributes are missing, otherwise respond with an error
    res.status(400).json({ Error: 'The request object is missing at least one of the required attributes' });
  } else {
    try {

      // Get the specific boat associated with the ID
      let boat = await getSpecificBoat(boatID);
      if (Object.keys(boat).length !== 0) {

        // Ensure the boat ID is not being modified
        if (id !== undefined) {
          res.status(400).json({ Error: 'Boat ID modification is not allowed.' });

          // Ensure the boat is associated with the user
        } else if (boat[0].owner !== userID) {
          res.status(403).json({ Error: 'You do not have access to modify or view this boat' });
        } else {

          // If everything is in order, update the boat, add the associated URL and respond with the boat object to the user
          let updatedBoat = await patchBoat(boatID, name, type, length);
          await addSelfURL(req, updatedBoat[0]);
          res.status(200).json(updatedBoat[0]);
        }
      } else {

        // If no boat with that associated ID is found respond with an error
        res.status(404).json({ Error: 'No boat with this boat_id exists or you do not have access to it' });
      }
    } catch (e) {
      console.log(e);
    }
  }
});

/**
 * PATCH route that associates one boat with one cargo
 * Middleware checks if the request has a valid, invalid or no JWT
 */
boatRouter.patch('/:bid/cargo/:cid', checkJWT, async (req, res) => {
  const { bid, cid, userID } = req.params;

  // Check that the boat ID and cargo ID are not malformed
  if (!checkIDisNumber(bid) || !checkIDisNumber(cid)) {
    res.status(400).json({ Error: 'Identifier malformed.' });

    // Check that the JWT is valid
  } else if (req.error) {
    respondBadJWT(res);
  } else {

    // Get the boat specified
    let boat = await getSpecificBoat(bid);

    // Check that the boat exists and that it is associated with the user
    if (Object.keys(boat).length === 0) {
      res.status(404).json({ Error: 'The specified boat and/or cargo does not exist' });
    } else if (boat[0].owner !== userID) {
      res.status(403).json({ Error: 'You do not have access to modify or view this boat' });
    } else {

      // Get the cargo specified
      let cargo = await getSpecificCargo(cid);

      // Check to see that the specified cargo exists and that it is not already assigned to another boat
      if (Object.keys(cargo).length === 0 || Object.keys(boat).length === 0) {
        res.status(404).json({ Error: 'The specified boat and/or cargo does not exist' });
      } else if (cargo[0].carrier != null) {
        res.status(403).json({ Error: 'The specified cargo is already assigned a boat' });
      } else {

        // If boat, cargo and user items have no issues associate the boat with the cargo and visa versa 
        let loadedBoat = await placeCargoOnBoat(boat[0], cargo[0]);

        // Add the associated URLs to the boat and all of its cargo
        await addSelfURL(req, loadedBoat[0]);
        for (let cargo of loadedBoat[0].cargo) {
          req.baseUrl = '/cargo';
          await addSelfURL(req, cargo);
        }

        // Respond with the boat and cargo to the user
        res.status(201).json(loadedBoat[0]);
      }
    }
  }
});

/**
 * DELETE route that disassociates one boat and one cargo
 * Middleware checks that the request accepts a JSON response and if the request has a valid, invalid or no JWT
 */
boatRouter.delete('/:bid/cargo/:cid', [checkAcceptJSON, checkJWT], async (req, res) => {
  const { bid, cid, userID } = req.params;

  // Check that the boat ID and cargo ID are not malformed
  if (!checkIDisNumber(bid) || !checkIDisNumber(cid)) {
    res.status(400).json({ Error: 'Identifier malformed.' });

    // Check that the JWT is valid
  } else if (req.error) {
    respondBadJWT(res);
  } else {

    // Get the boat specified
    let boat = await getSpecificBoat(bid);

    // Check that the boat exists and that it is associated with the user
    if (Object.keys(boat).length === 0) {
      res.status(404).json({ Error: 'The specified boat and/or cargo does not exist' });
    } else if (boat[0].owner !== userID) {
      res.status(403).json({ Error: 'You do not have access to modify or view this boat' });
    } else {

      // Get the cargo specified
      let specificCargo = await getSpecificCargo(cid);

      // Check to see that the specified cargo exists and that it is not already assigned to another boat
      if (Object.keys(specificCargo).length === 0 || Object.keys(boat).length === 0) {
        res.status(404).json({ Error: 'The specified boat and/or cargo does not exist' });
      } else if (specificCargo[0].carrier !== req.params.bid) {
        res.status(403).json({ Error: 'The specified boat is not assigned to this cargo' });
      } else {

        // Search the boat's cargo to see if the specified cargo ID is associated with this boat
        // -1 is the flag that it is not found
        let index = -1;
        for (let k = 0; k < Object.keys(boat[0].cargo).length; k += 1) {
          if (specificCargo[0].id === boat[0].cargo[k].id) {
            index = k;
            break;
          }
        }

        // If the specified cargo is found, remove the cargo association from the boat and respond with the boat object and remaining cargo, if any
        if (index !== -1) {
          let boatWithRemovedCargo = await removeCargoFromBoat(boat[0], specificCargo[0]);
          await addSelfURL(req, boatWithRemovedCargo[0]);
          for (let cargo of boatWithRemovedCargo[0].cargo) {
            req.baseUrl = '/cargo';
            await addSelfURL(req, cargo);
          }
          res.status(201).json(boatWithRemovedCargo[0]);
        } else {

          // If the cargo is not found to be associated with this boat, respond with an error
          res.status(403).json({ Error: 'The specified cargo is not assigned to this boat' });
        }
      }
    }
  }
});

/**
 * DELETE route that deletes a boat
 * Middleware checks if the request has a valid, invalid or no JWT
 */
boatRouter.delete('/:boatID', checkJWT, async (req, res) => {
  const { boatID, userID } = req.params;

  // Check that the JWT is valid
  if (req.error) {
    respondBadJWT(res);
  } else {

    // Get the specified boat
    let boat = await getSpecificBoat(boatID);

    // Ensure the boat exists and is associated with the user, if not respond with an error
    if (Object.keys(boat).length === 0 || boat[0].owner !== userID) {
      res.status(404).json({ Error: 'No boat with this boat_id exists or you do not have access to it' });

      // If the boat has no associated cargo simply delete the boat
    } else if (boat[0].cargo.length === 0) {
      await deleteBoats(boatID);
      res.status(204).end();

      // If the boat has cargo remove all cargo associations with the boat, and then delete the boat
    } else {
      await unassignAllCargo(boat[0].cargo);
      await deleteBoats(boatID);
      res.status(204).end();
    }
  }
});

module.exports = boatRouter;
