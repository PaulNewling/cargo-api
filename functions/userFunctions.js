/**
 * Author: Paul Newling
 * Date: 24AUG21
 * File: user-functions.js
 * Description: Functions involved with user objects
 *  */

const axios = require('axios');
const { datastore, USERS } = require('./helper-functions/datastoreHelpers');
const { verify } = require('./jwtFunctions');

/**
 * Function that sets user data into one object
 * @param {user object} usersObject
 * @returns user object
 */
function setUserData(usersObject) {
  const userDetails = {
    userID: usersObject.userID,
    displayName: usersObject.displayName,
  };
  return userDetails;
}

/**
 * Gets user ID of user object
 * @param {user object} userObject
 * @returns (int) userID
 */
function getUserIDs(userObject) {
  return userObject.userID;
}

/**
 * Gets the number of all users in the datastore
 * @returns (int) count
 */
async function getUserCount() {
  const query = datastore.createQuery(USERS);
  const entities = await datastore.runQuery(query);
  const count = Object.keys(entities[0]).length;
  return count;
}

/**
 * Function that fetches a paginated list of user objects in datastore to a max of 5.
 * If there are more than 5 users a paginated link is included
 * @param {request object} req
 * @returns array of user objects, possibly with paginated link
 */
async function getUsers(req) {

  // Creates pagination limit of 5
  let query = datastore.createQuery(USERS).limit(5);

  // Checks to see if 'curson' is included, this tells the pagination where to start
  if (Object.keys(req.query).includes('cursor')) {
    query = query.start(req.query.cursor);
  }
  const entities = await datastore.runQuery(query, { wrapNumbers: true });
  const results = {};
  results.users = entities[0].map(setUserData);
  if (entities[1].moreResults !== datastore.NO_MORE_RESULTS) {
    const next = `${req.protocol}://${req.get('host') + req.baseUrl}?cursor=${entities[1].endCursor}`;
    const editedNext = new URL(next.slice(0, -1));
    results.next = `${editedNext}`;
  }
  return results;
}

/**
 * Function that returns true/false if the user is already in the user datastore
 * @param {request object} req
 * @param {ID int} userID
 * @returns boolean
 */
async function isUserAlreadyInDatabase(req, userID) {
  const entities = await getUsers(req);
  let userList = {};
  if (typeof entities.users !== 'undefined') {
    userList = entities.users.map(getUserIDs);
    if (userList.indexOf(userID) !== -1) {
      return true;
    }
    return false;
  }
  return false;
}

/**
 * Function that saves a user object to the datastore
 * @param {ID int} userID
 * @param {string} displayName
 * @returns (int) key
 */
async function postUser(userID, displayName) {
  const key = datastore.key(USERS);
  const newUser = {
    userID,
    displayName,
  };
  await datastore.save({ key, data: newUser });
  return key;
}

/**
 * Function that attempts to add a user to the database if they are not already in the database
 * @param {request object} req
 * @param {ID int} userID
 * @param {string} displayName
 * @returns boolean
 */
async function addUser(req, userID, displayName) {
  const isInDataBase = await isUserAlreadyInDatabase(req, userID);
  if (!isInDataBase) {
    await postUser(userID, displayName);
    return true;
  }
  return false;
}

/**
 * Function runs step 2 of the OAuth2.0 procedure.
 * Receives original passed back code from google login. From here we are considered authenticated.
 * We then make a request for the OAuth token and then use this to get the information that has logged in with google.
 * Saving the token, display name and userID in cookies are then able to end the function.
 * These cookies will be used in the rendering of the next page from where this function was called.
 * 
 * @param {string} code // Secret authorization code as part of OAuth2.0
 * @param {response object} res
 * @param {array} usageDataPackage // Array of site usage secrets set
 */
async function getUserInformation(code, res, usageDataPackage) {
  // Prepare data for axios post request
  const data = {
    code: `${code}`,
    client_id: `${usageDataPackage[0]}`,
    client_secret: `${usageDataPackage[1]}`,
    redirect_uri: `${usageDataPackage[2]}`,
    grant_type: 'authorization_code',
  };

  const oAuthTokenURL = 'https://oauth2.googleapis.com/token';
  let tokenResponse = await axios.post(oAuthTokenURL, data);

  // Gets the token response and collects the access_token and ID_token preparing the next axios get request
  const { access_token, id_token } = tokenResponse.data;
  let config = {
    headers: {
      Authorization: `Bearer ${access_token}`,
      withCredentials: true,
    },
  };

  const peopleURL = 'https://people.googleapis.com/v1/people/me?personFields=names';
  let infoResponse = await axios.get(peopleURL, config);

  // After final axios get request we have the full display name, JWT and User ID
  // These will be saved in expiring cookies to be rendered on the '/success' redirect page
  const { displayName } = infoResponse.data.names[0];
  res.cookie('displayName', displayName, { expire: new Date() + 300000 });
  res.cookie('token', id_token, { expire: new Date() + 300000 });
  try {
    var userID = await verify(id_token);
  } catch (e) {
    console.log(e);
  } finally {
    res.cookie('userID', userID, { expire: new Date() + 300000 });
  }
}

module.exports = {
  setUserData,
  getUserCount,
  getUserIDs,
  getUsers,
  isUserAlreadyInDatabase,
  postUser,
  addUser,
  getUserInformation,
};
