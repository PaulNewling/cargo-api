/**
 * Author: Paul Newling
 * Date: 24AUG21
 * File: users.js
 * Description: File that contains all of the routes associated with users
 *  */

const express = require('express');
const { getUsers, getUserCount } = require('../functions/userFunctions');
const { onlyAcceptGET } = require('../middleware/checkMethod');
const { checkJSONError } = require('../middleware/reqContentAcceptsCheck');
const userRouter = express.Router();

// Enable middleware to check for malformed JSON
userRouter.use(checkJSONError);

/**
 * GET route to get all users
 */
userRouter.get('/', onlyAcceptGET, async (req, res) => {
  let response = await getUsers(req);
  let count = await getUserCount();
  response.count = count;
  if (typeof response.users !== 'undefined') {
    res.status(200).json(response);
  } else {
    res.status(200).json([]);
  }
});

// Route to block any other requests besides GET
userRouter.all('*', onlyAcceptGET);

module.exports = userRouter;
