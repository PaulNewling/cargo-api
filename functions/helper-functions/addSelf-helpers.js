function addSelfURL(req, obj) {
  const selfURL = `${req.protocol}://${req.get('host') + req.baseUrl}/${obj.id}`;
  // eslint-disable-next-line no-param-reassign
  obj.self = `${selfURL}`;

  return obj;
}

exports.addSelfURL = addSelfURL;
