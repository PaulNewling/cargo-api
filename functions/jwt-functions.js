const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.CLIENT_ID);

async function verify(token) {
  const ticket = await client.verifyIdToken({ idToken: token, audience: process.env.CLIENT_ID });
  const payload = ticket.getPayload();
  const userID = payload.sub;
  return userID;
}

function respondBadJWT(res) {
  res.status(401).json({ Error: 'Invalid or missing JWT' });
}

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
