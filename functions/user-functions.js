const axios = require('axios');
const { datastore, USERS } = require('./helper-functions/datastore-helpers');
const { verify } = require('./jwt-functions');

function setUserData(usersObject) {
  const userDetails = {
    userID: usersObject.userID,
    displayName: usersObject.displayName,
  };
  return userDetails;
}

function getUserIDs(userObject) {
  return userObject.userID;
}

async function getUserCount() {
  const query = datastore.createQuery(USERS);

  return datastore.runQuery(query).then((entities) => {
    const count = Object.keys(entities[0]).length;

    return count;
  });
}

async function getUsers(req) {
  let query = datastore.createQuery(USERS).limit(5);

  if (Object.keys(req.query).includes('cursor')) {
    query = query.start(req.query.cursor);
  }

  return datastore
    .runQuery(query, {
      wrapNumbers: true,
    })
    .then((entities) => {
      const results = {};

      results.users = entities[0].map(setUserData);

      if (entities[1].moreResults !== datastore.NO_MORE_RESULTS) {
        const next = `${req.protocol}://${
          req.get('host') + req.baseUrl
        }?cursor=${entities[1].endCursor}`;
        const editedNext = new URL(next.slice(0, -1));

        results.next = `${editedNext}`;
      }

      return results;
    });
}

async function isUserAlreadyInDatabase(req, userID) {
  return getUsers(req).then((entities) => {
    let userList = {};
    if (typeof entities.users !== 'undefined') {
      userList = entities.users.map(getUserIDs);
      if (userList.indexOf(userID) !== -1) {
        return true;
      }
      return false;
    }

    return false;
  });
}

async function postUser(userID, displayName) {
  const key = datastore.key(USERS);

  const newUser = {
    userID,
    displayName,
  };

  return datastore.save({ key, data: newUser }).then(() => key);
}

async function addUser(req, userID, displayName) {
  return isUserAlreadyInDatabase(req, userID).then((isInDataBase) => {
    if (!isInDataBase) {
      postUser(userID, displayName);
      return true;
    }
    return false;
  });
}

async function getUserInformation(code, res, usageDataPackage) {
    const data = {
      code: `${code}`,
      client_id: `${usageDataPackage[0]}`,
      client_secret: `${usageDataPackage[1]}`,
      redirect_uri: `${usageDataPackage[2]}`,
      grant_type: 'authorization_code',
    };
  
    const oAuthTokenURL = 'https://oauth2.googleapis.com/token';
    let tokenResponse = await axios.post(oAuthTokenURL, data);
    const { access_token, id_token } = tokenResponse.data;
    let config = {
      headers: {
        Authorization: `Bearer ${access_token}`,
        withCredentials: true,
      },
    };
    const peopleURL =
      'https://people.googleapis.com/v1/people/me?personFields=names';
  
    let infoResponse = await axios.get(peopleURL, config);
    const { displayName } = infoResponse.data.names[0];
    res.cookie('displayName', displayName, { expire: new Date() + 300000 });
    res.cookie('token', id_token, { expire: new Date() + 300000 });
  
    let userID = await verify(id_token);
    res.cookie('userID', userID, { expire: new Date() + 300000 });
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
