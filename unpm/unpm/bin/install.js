'use strict';

var Package = require('../lib/package').Package;

module.exports = function execute(args) {

  var running = true;

  function callback(deps) {
    deps.sort();
    deps.forEach(function(dep) {
      console.log(dep);
      running = false;
    });
  }
  
  function errback(err) {
    throw err;
  }

  var pkg = new Package(args[0], args[1]);
  pkg.get_dependencies(callback, errback);

  
  (function wait () {
    if (running) setTimeout(wait, 1000);
 })()

}
