'use strict';

var https = require('https'),
  util = require('util');

var semver = require('../../vendors/semver');

var REGISTRY_ROOT = 'https://registry.npmjs.org/';


var VERBOSE = 0;

function _log(msg) {
  if (VERBOSE) {
    console.log(msg)
  }
}

/**
 * Represent a package version
 */
var Version = function(name, version, dependencies) {
  this.name = name;
  this.version = version;
  this.dependencies = dependencies;
}

Version.prototype.get_dependencies = function(callback, errback, _currents, _for) {
  var self = this;
  var result = _currents;

  if (self.name in result) {
    if (result[self.name].indexOf(self.version) >= 0) {
      callback(result);
      return
    }
    result[self.name].push(self.version)
  }
  else {
    result[self.name] = [self.version];
  }

  var dependencies = [];
  Object.keys(self.dependencies).forEach(function(depname) {
    var depver = self.dependencies[depname];
    dependencies.push(new Package(depname, depver))
  });
  
  function build_dependency(dependencies) {
    if (dependencies.length > 0) {
      var pkg = dependencies.pop();
      if (_for) {
        var __for = self.name + '==' + self.version + ' <- ' + _for;
      }
      else {
        var __for = self.name + '==' + self.version;
      }
      pkg.get_dependencies(
        function(dep_result) {
          Object.keys(dep_result).forEach(function(key) {
            if (key in result) {
              dep_result[key].forEach(function(version) {
                if (result[key].indexOf(version) < 0) {
                  result[key].push(version);
                }
              });
            }
            else {
              result[key] = dep_result[key];
            }
          });
          build_dependency(dependencies);
        },
        errback,
        result,
        __for);
    }
    else {
      //if (result.indexOf((self.name + '==' + self.version)) < 0) {
      //  result.push(self.name + '==' + self.version);
      //}
      callback(result);
    }
  }
  build_dependency(dependencies);
}


/**
 * Represent a package
 */
var Package = function(name, required_version) {
  this.name = name;
  this.required_version = required_version || '*';
  this.versions = [];
}

Package.metadatas = {}

Package.prototype.get_metadata = function(callback, errback) {

  _log('GET ' + REGISTRY_ROOT + this.name + '/');
  https.get(REGISTRY_ROOT + this.name + '/', function(res) {
    var response = '';
    res.on('data', function (chunk) {
      response += chunk;
    });

    res.on('end', function () {
      // console.log('Got response: ' + res.statusCode);
      var json = null;
      try {
        json = JSON.parse(response);  
      }
      catch (exc) {
        errback(exc);  
      }
      if (json  !== null) {
        callback(json);
      }
      
    });

  }).on('error', function(e) {
    _log('Got error: ' + e.message);
    throw Error('Package {} deleted from {}'.format(this.name, registry_root))
  });

}

Package.prototype.build_versions = function(required_version) {
  var metadata = Package.metadatas[this.name];
  var versions = [];

  Object.keys(metadata['versions']).forEach(function(version) {
    if (semver.satisfies(version, required_version)) {
      var ver_data = metadata['versions'][version];
      versions.push([version, ver_data['dependencies'] || {}]);
    }
  });

  if (versions.length == 0) {
    throw Error(util.format('%s has no valid version', this.name));
  }

  // newest version first
  versions.sort(function(el0, el1) { return semver.compare(el1[0], el0[0]) });
  var self = this;
  versions.forEach(function(version){
    self.versions.push(new Version(self.name, version[0], version[1]));
  });
}

Package.prototype.get_dependencies = function(callback, errback, _currents, _for) {

  var self = this;

  _log(util.format('\n\nLoading dependencies of %s', self.name));
  if (_for) {
    _log('for ' + _for);
  }
  
  var on_version_loaded = function(result) {
    // _log(util.format('Dependencies of %s are loaded: %s', self.name));
    callback(result);
  }

  var build_with_next_version = function(versions) {
    var version = versions.shift();  // initialize with the on_metadata
    if (version) {
      _log(util.format('Build %s with %s',
                  version.name, version.version));
      version.get_dependencies(on_version_loaded,
                               function (error) {
                                 // test errors
                                 build_with_next_version(versions);
                               },
                               _currents || {},
                               _for || '');
    }
    else {
      throw Error(util.format('No available version for %s %s',
                  self.name, self.required_version));
    }
  }

  var on_metadata = function() {
    self.build_versions(self.required_version);
    build_with_next_version(self.versions.slice());
  }

  if (self.name in Package.metadatas) {
    on_metadata();
  }
  else {
    this.get_metadata(
      function(metadata) {
        Package.metadatas[self.name] = metadata;
        on_metadata();
      },
      errback);
  }
}


module.exports = {'Package': Package};
