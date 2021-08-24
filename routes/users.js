const express = require('express');
const { getUsers, getUserCount } = require('../functions/user-functions');
const { onlyAcceptGET } = require('../middleware/checkMethod');
const { checkJSONError } = require('../middleware/reqContentAcceptsCheck');

const userRouter = express.Router();

userRouter.use(checkJSONError);

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

userRouter.all('*', onlyAcceptGET);

module.exports = userRouter;
