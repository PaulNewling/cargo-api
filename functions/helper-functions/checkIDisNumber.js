function checkIDisNumber(id) {
  if (typeof parseInt(id, 10) === 'number') {
    return true;
  }
  return false;
}

module.exports = {
  checkIDisNumber,
};
