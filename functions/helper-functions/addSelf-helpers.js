function addSelfURL(req, obj) {
  const selfURL = `${req.protocol}://${req.get('host') + req.baseUrl}/${obj.id}`;
  obj.self = `${selfURL}`;
  return obj;
}

exports.addSelfURL = addSelfURL;
