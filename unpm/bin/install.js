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

  var splitted_args = args[0].split('@')
  var pkg_name = splitted_args.shift();
  var version = '*';
  if (splitted_args) {
    version = splitted_args.shift();
  }

  var pkg = new Package(pkg_name, version);
  pkg.get_dependencies(got_dependencies, errback);
  
  (function wait () {
    if (running) setTimeout(wait, 1000);
 })()

}
