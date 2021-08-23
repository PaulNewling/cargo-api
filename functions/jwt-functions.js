const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.CLIENT_ID);

async function verify(token) {
  return client
    .verifyIdToken({
      idToken: token,
      audience: process.env.CLIENT_ID,
    })

    .then((ticket) => {
      const payload = ticket.getPayload();
      const userid = payload.sub;
      return userid;
    })
    .catch((e) => {
      throw e;
    });
}

function respondBadJWT(res) {
  res.status(401).json({ Error: 'Invalid or missing JWT' });
}

function checkJWT(req, res, next) {
  const { authorization } = req.headers;

  if (typeof authorization !== 'undefined') {
    const tokenArray = authorization.split(' ');
    const idToken = tokenArray[1];

    verify(idToken)
      .then((userID) => {
        req.params.userID = userID;
        next();
      })

      .catch((e) => {
        // eslint-disable-next-line no-console
        console.log(e);
        req.error = true;
        next();
      });
  }
  else {
    req.error = true;
    next();
  }
}

module.exports = {
  verify,
  respondBadJWT,
  checkJWT,
};
