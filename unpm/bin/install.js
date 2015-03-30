'use strict';

var Package = require('../lib/package').Package;

module.exports = function execute(args) {

  var running = true;

  var count_deps = 0;
  var nb_deps = null;

  function on_dep_installed() {
    count_deps++;
    if (nb_deps == count_deps) {
      running = false;
    }
  }
  
  function install_deps(depname, depver) {
    Package.install(depname, depver, on_dep_installed, errback);
  }
  
  function got_dependencies(deps) {
    var dep_names = Object.keys(deps)
    dep_names.sort();
    nb_deps = dep_names.length;
    dep_names.forEach(function(dep) {
      install_deps(dep, deps[dep]);
    });
  }

  function errback(err) {
    throw err;
  }
  var pkg_name = args[0];
  var version = '*';
  if (args.length > 1) {
    version = args[1];
  }

  var pkg = new Package(args[0], args[1]);
  pkg.get_dependencies(got_dependencies, errback);
  
  (function wait () {
    if (running) setTimeout(wait, 1000);
 })()

}
