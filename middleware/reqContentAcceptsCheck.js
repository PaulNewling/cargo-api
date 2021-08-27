/**
 * Author: Paul Newling
 * Date: 24AUG21
 * File: reqContentAcceptsChecks.js
 * Description: Middleware that checks the incoming requests headers, type, and JSON
 *  */

/**
 * Function that checks if there is malformed JSON sent in the request
 */
function checkJSONError(error, req, res, next) {
  if (error instanceof SyntaxError) {
    res.status(400).json({ Error: 'Unable to parse JSON' });
  } else {
    next();
  }
}

/**
 * Function that checks if the content is JSON
 */
function checkContentJSON(req, res, next) {
  if (!req.is('application/json')) {
    res.status(415).json({ Error: 'Server only accepts application/json data.' });
  } else {
    next();
  }
}

/**
 * Function that checks if the request can accept JSON in return
 */
function checkAcceptJSON(req, res, next) {
  if (!req.accepts('application/json')) {
    res.status(406).set('Header', 'Server Only Responds in JSON').send();
  } else {
    next();
  }
}

/**
 * Function that checks if the request can accept JSON in return and is JSON sent out.
 */
function checkContentAndAccepts(req, res, next) {
  if (!req.is('application/json')) {
    res.status(415).json({ Error: 'Server only accepts application/json data.' });
  } else if (!req.accepts('application/json')) {
    res.status(406).set('Header', 'Server Only Responds in JSON').send();
  } else {
    next();
  }
}

module.exports = {
  checkContentAndAccepts,
  checkContentJSON,
  checkAcceptJSON,
  checkJSONError,
};
