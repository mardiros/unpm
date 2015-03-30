#!/usr/bin/env node
'use strict';

;(function () {


process.title = 'unpm';
var args = process.argv.slice(2);
var command = args.shift(args)
var commands = ['install', 'help'];

if (commands.indexOf(command) < 0) {
	console.log('Invalid command '+ command);
	command = 'help'
}

if (command == 'help') {
	console.log('unpm {' +  commands.join() + '}');
}
else {
	var command = require('./bin/' + command);
	command(args);
}

})()
