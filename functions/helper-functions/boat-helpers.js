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
      !(code > 47 && code < 58) // numeric (0-9)
      && !(code > 64 && code < 91) // upper alpha (A-Z)
      && !(code > 96 && code < 123)
      && !(code === 32)
    ) {
      // lower alpha (a-z)
      // console.log("CODE: " + code);
      return false;
    }
  }
  return true;
}

// https://stackoverflow.com/questions/4434076/best-way-to-alphanumeric-check-in-javascript/25352300#25352300
function checkValidName(name) {
  if (isAlphaNumericOrSpace(name) && name.length >= 3) {
    return true;
  }
  // console.log("CHECK CAL NAME FAIL");
  return false;
}

function checkBodyLengthAboveMax(max, req) {
  if (req.body.length >= max) {
    // console.log("FAIL BODY LEN");
    return false;
  }
  return true;
}

function checkAllBoatAttributes(name, length, req) {
  if (
    checkValidName(name)
    && !checkBodyLengthAboveMax(4, req)
    && Number.isInteger(length)
  ) {
    return true;
  }
  // console.log("FAIL BOAT ATTRIBUES");
  return false;
}

module.exports = {
  respondRequirementsNotMet,
  checkValidName,
  checkAllBoatAttributes,
};
