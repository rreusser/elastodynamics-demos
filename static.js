'use strict';

// Load modules and make them global (perhaps) here so that they're available
// to the main script you're trying to run. This code is bundled and minified
// and (again, perhaps) sent to a static host like S3 or http://rawgit.com

window.regl = require('regl');
window.tfi = require('ndarray-transfinite-interpolation');
window.zeros = require('ndarray-scratch').zeros;
window.createGeometry = require('ndarray-grid-connectivity');
window.extend = require('util-extend');
window.flatten = require('flatten');
window.vectorFill = require('ndarray-vector-fill');
window.show = require('ndarray-show');
window.cwise = require('cwise');

window.createCamera = require('./camera');
