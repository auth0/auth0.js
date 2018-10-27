'use strict';

let attributeName = process.argv[2] || 'name';
let path = process.argv[3] || '../../package.json';
const attributes = require(path);
let value = attributes[attributeName];
if (value) {
  console.log(value);
}
