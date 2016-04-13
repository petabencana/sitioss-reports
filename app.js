'use strict';

// app.js - cognicity-reports-powertrack application setup

/**
 * @file Collect unconfirmed reports from data sources & send report verification tweets
 * @copyright (c) Tomas Holderness & SMART Infrastructure Facility January 2014
 * @license Released under GNU GPLv3 License (see LICENSE.txt).
 * @example
 * Usage:
 *     node app.js cognicity-reports-config.js
 */


// Node dependencies
var path = require('path');
// Node.js fs filesystem module
var fs = require('fs');

// Modules

// Postgres interface module
var pg = require('pg');
// Winston logger module
var logger = require('winston');

// Verify expected arguments
if (process.argv[2]) {
	var config = require( __dirname + path.sep + process.argv[2] );
} else {
	throw new Error('No config file. Usage: node app.js config.js');
}

// Logging configuration
var logPath = ( config.logger.logDirectory ? config.logger.logDirectory : __dirname );
// Check that log file directory can be written to
try {
	fs.accessSync(logPath, fs.W_OK);
} catch (e) {
	console.log( "Log directory '" + logPath + "' cannot be written to"  );
	throw e;
}
logPath += path.sep;
logPath += config.logger.filename + ".log";

logger
	// Configure custom File transport to write plain text messages
	.add(logger.transports.File, {
		filename: logPath, // Write to projectname.log
		json: false, // Write in plain text, not JSON
		maxsize: config.logger.maxFileSize, // Max size of each file
		maxFiles: config.logger.maxFiles, // Max number of files
		level: config.logger.level // Level of log messages
	})
	// Console transport is no use to us when running as a daemon
	.remove(logger.transports.Console);

// FIXME This is a workaround for https://github.com/flatiron/winston/issues/228
// If we exit immediately winston does not get a chance to write the last log message.
// So we wait a short time before exiting.
function exitWithStatus(exitStatus) {
	logger.info( "Exiting with status " + exitStatus );
	setTimeout( function() {
		process.exit(exitStatus);
	}, 500 );
}

logger.info("Application starting...");

// Verify DB connection is up
pg.connect(config.pg.conString, function(err, client, done){
	if (err){
		logger.error("DB Connection error: " + err);
		logger.error("Fatal error: Application shutting down");
		done();
		exitWithStatus(1);
	} else {
		logger.info("DB connection successful");
	}
});

var Reports = require('./Reports');
/**
 * Instance of reports module.
 * @type {Reports}
 */
var reports = new Reports( config, pg, logger, exitWithStatus );

// Handle postgres idle connection error (generated by RDS failover among other possible causes)
pg.on('error', function(err) {
	logger.error('Postgres connection error: ' + err);

	logger.info('Enabling caching mode and attempting to reconnect at intervals');
	reports.enableCacheMode();

	var reconnectionAttempts = 0;
	var reconnectionFunction = function() {
		// Try and reconnect
		pg.connect(config.pg.conString, function(err, client, done){
			if (err) {
				reconnectionAttempts++;
				if (reconnectionAttempts >= config.pg.reconnectionAttempts) {
					// We have tried the maximum number of times, tweet admin and exit in failure state
					logger.error( 'Postgres reconnection failed' );
					logger.error( 'Maximum reconnection attempts reached, exiting' );
					exitWithStatus(1);
				} else {
					// If we failed, try and reconnect again after a delay
					logger.error( 'Postgres reconnection failed, queuing next attempt for ' + config.pg.reconnectionDelay + 'ms' );
					setTimeout( reconnectionFunction, config.pg.reconnectionDelay );
				}
			} else {
				// If we succeeded, disable reports caching mode
				logger.info( 'Postgres reconnection succeeded, re-enabling real time processing' );
				reports.disableCacheMode();
			}
		});
	};

	reconnectionFunction();
});

// Catch unhandled exceptions, log, and exit with error status
process.on('uncaughtException', function (err) {
	logger.error('uncaughtException: ' + err.message + ", " + err.stack);
	logger.error("Fatal error: Application shutting down");
	exitWithStatus(1);
});

// Catch kill and interrupt signals and log a clean exit status
process.on('SIGTERM', function() {
	logger.info('SIGTERM: Application shutting down');
	exitWithStatus(0);
});
process.on('SIGINT', function() {
	logger.info('SIGINT: Application shutting down');
	exitWithStatus(0);
});

// Load a data source plugin
function loadDataSource( dataSourceFolder ) {
	logger.info("Loading data source from: " + dataSourceFolder );

	// Find data source descriptor file (containing class name & config file name)
	var dataSourceModule = require( "./" + dataSourceFolder );
	// Construct instance of data source
	var dataSource = dataSourceModule( reports );
	// Add data source to reports
	reports.addDataSource( dataSource );

	logger.info("Data source '" + dataSource.constructor.name + "' loaded");
}

config.dataSources.forEach( function( dataSourceFolder ){
	loadDataSource( dataSourceFolder );
});

// Start reports module
reports.start();
