/**
 * Author: Paul Newling
 * Date: 24AUG21
 * File: boat-helpers.js
 * Description: Helper functions for the boats route endpoints
 *  */ 

/**
 * Function if boat creation doesn't have sufficient attributes
 * */ 
function respondRequirementsNotMet(res) {
  res.status(400).json({ Error: 'The request attributes do not meet requirements' });
}

/**
 * Returns true if str is alphanumberic or a space, otherwise it returns false
 * @param {string} str 
 * @returns boolean
 */
function isAlphaNumericOrSpace(str) {
  let code;
  let i;
  let len;
  for (i = 0, len = str.length; i < len; i += 1) {
    code = str.charCodeAt(i);
    if (
      !(code > 47 && code < 58) && // numeric (0-9)
      !(code > 64 && code < 91) && // upper alpha (A-Z)
      !(code > 96 && code < 123) &&
      !(code === 32)
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Returns true if the name is comprised only of alphanumerics, spaces and is longer than 2 characters
 * @param {string} name 
 * @returns boolean
 */
function checkValidName(name) {
  if (isAlphaNumericOrSpace(name) && name.length >= 3) {
    return true;
  }
  return false;
}

/**
 * Returns true if there are more than the max amount of attributes in the request body
 * @param {int} max 
 * @param {request object} req 
 * @returns boolean
 */
function checkBodyLengthAboveMax(max, req) {
  if (req.body.length >= max) {
    return false;
  }
  return true;
}

/**
 * Returns true if all boat attributes are valid (valid name, no extra attributes, and that length of boat object is an integer)
 * @param {string} name 
 * @param {int} length 
 * @param {request object} req 
 * @returns boolean
 */
function checkAllBoatAttributes(name, length, req) {
  if (checkValidName(name) && !checkBodyLengthAboveMax(4, req) && Number.isInteger(length)) {
    return true;
  }
  return false;
}

/**
 * Returns true if the ID number is of type number
 * @param {int} id 
 * @returns boolean
 */
function checkIDisNumber(id) {
  if (typeof parseInt(id, 10) === 'number') {
    return true;
  }
  return false;
}

module.exports = {
  respondRequirementsNotMet,
  checkValidName,
  checkAllBoatAttributes,
  checkIDisNumber,
};
