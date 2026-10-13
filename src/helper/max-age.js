// Returns the maxAge as a number, or null when no maxAge was requested.
// Only numbers and non blank numeric strings count. undefined, null, '', blank
// strings, booleans, arrays, objects, NaN and non numeric strings all mean "not set".
function normalise(value) {
  if (typeof value === 'string' ? value.trim() === '' : typeof value !== 'number') {
    return null;
  }
  var number = Number(value);
  return isNaN(number) ? null : number;
}

export default {
  normalise: normalise
};
