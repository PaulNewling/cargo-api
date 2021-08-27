/**
 * Author: Paul Newling
 * Date: 24AUG21
 * File: jwt-functions.js
 * Description: Functions involved in using JSON Web Tokens
 *  */

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.CLIENT_ID);

/**
 * Function built on GCP function 'client.verifyIdToken' that check if the JWT is accurate with Google's server 
 * @param {JWT} token 
 * @returns (int) User ID
 */
async function verify(token) {
  const ticket = await client.verifyIdToken({ idToken: token, audience: process.env.CLIENT_ID });
  const payload = ticket.getPayload();
  const userID = payload.sub;
  return userID;
}

/**
 * Sends response that the JWT was invalid of missing
 * @param {response object} res 
 */
function respondBadJWT(res) {
  res.status(401).json({ Error: 'Invalid or missing JWT' });
}

/**
 * JWT middleware that checks validity of the JWT with the userID
 * @param {request object} req 
 * @param {response object} res 
 */
async function checkJWT(req, res, next) {
  const { authorization } = req.headers;
  if (typeof authorization !== 'undefined') {
    const tokenArray = authorization.split(' ');
    const idToken = tokenArray[1];
    try {
      const userID = await verify(idToken);
      req.params.userID = userID;
      next();
    } catch (e) {
      console.log(e);
      req.error = true;
      next();
    }
  } else {
    req.error = true;
    next();
  }
}

module.exports = {
  verify,
  respondBadJWT,
  checkJWT,
};
