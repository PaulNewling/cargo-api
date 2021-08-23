function respondRequirementsNotMet(res) {
  res
    .status(400)
    .json({ Error: 'The request attributes do not meet requirements' });
}

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

function checkValidName(name) {
  if (isAlphaNumericOrSpace(name) && name.length >= 3) {
    return true;
  }
  return false;
}

function checkBodyLengthAboveMax(max, req) {
  if (req.body.length >= max) {
    return false;
  }
  return true;
}

function checkAllBoatAttributes(name, length, req) {
  if (
    checkValidName(name) &&
    !checkBodyLengthAboveMax(4, req) &&
    Number.isInteger(length)
  ) {
    return true;
  }
  return false;
}

module.exports = {
  respondRequirementsNotMet,
  checkValidName,
  checkAllBoatAttributes,
};
