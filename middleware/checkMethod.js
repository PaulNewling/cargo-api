/**
 * Author: Paul Newling
 * Date: 24AUG21
 * File: checkMethod.js
 * Description: Middleware to ensure only the GET method is accepted
 *  */

function onlyAcceptGET(req, res, next) {
  const acceptedMethods = ['GET'];
  if (Object.keys(req.params).length === 0) {
    if (req.method === 'GET' || req.method === 'POST') {
      next();
    } else {
      res.set('Accept', 'GET, POST').status(405).end();
    }
  } else if (acceptedMethods.indexOf(req.method) !== -1) {
    next();
  } else {
    res.set('Accept', 'GET').status(405).end();
  }
}

module.exports = {
  onlyAcceptGET,
};
