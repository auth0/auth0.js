'use strict';

var path = require('path');

var attributeName = process.argv[2] || 'name';
var inputPath = process.argv[3] || '../../package.json';
var rootDir = path.resolve(__dirname, '../..');
var resolvedPath = path.resolve(__dirname, inputPath);

if (resolvedPath !== rootDir && resolvedPath.indexOf(rootDir + path.sep) !== 0) {
  throw new Error('Invalid path: must resolve within the project root');
}

var attributes = require(resolvedPath);
var value = attributes[attributeName];
if (value !== undefined) {
  console.log(value);
}
