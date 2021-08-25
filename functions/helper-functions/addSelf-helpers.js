/**
 * Author: Paul Newling
 * Date: 24AUG21
 * File: addSelf-helpers.js
 * Description: Helper function that adds the self URL of the object, to the object
 *  */ 
function addSelfURL(req, obj) {
  const selfURL = `${req.protocol}://${req.get('host') + req.baseUrl}/${obj.id}`;
  obj.self = `${selfURL}`;
  return obj;
}

exports.addSelfURL = addSelfURL;
