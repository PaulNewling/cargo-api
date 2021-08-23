function checkJSONError(error, req, res, next) {
  if (error instanceof SyntaxError) {
    res.status(400).json({ Error: 'Unable to parse JSON' });
  }
  else {
    next();
  }
}

function checkContentJSON(req, res, next) {
  if (!req.is('application/json')) {
    res
      .status(415)
      .json({ Error: 'Server only accepts application/json data.' });
  }
  else {
    next();
  }
}

function checkAcceptJSON(req, res, next) {
  if (!req.accepts('application/json')) {
    res.status(406).set('Header', 'Server Only Responds in JSON').send();
  }
  else {
    next();
  }
}

function checkContentAndAccepts(req, res, next) {
  if (!req.is('application/json')) {
    res
      .status(415)
      .json({ Error: 'Server only accepts application/json data.' });
  }
  else if (!req.accepts('application/json')) {
    res.status(406).set('Header', 'Server Only Responds in JSON').send();
  }
  else {
    next();
  }
}

module.exports = {
  checkContentAndAccepts,
  checkContentJSON,
  checkAcceptJSON,
  checkJSONError,
};
