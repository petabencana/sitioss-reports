'use strict';

// sample-config.js - sample configuration file for cognicity-reports module

/**
 * Configuration for cognicity-reports-powertrack
 * @namespace {object} config
 * @property {object} dataSources Array of datasource folder paths relative to the reports module
 * @property {object} logger Configuration object for logging module
 * @property {string} logger.level Logging level - info, verbose or debug are most useful. Levels are (npm defaults): silly, debug, verbose, info, warn, error.
 * @property {number} logger.maxFileSize Max file size in bytes of each log file
 * @property {number} logger.maxFiles Max number of log files kept
 * @property {?string} logger.logDirectory Full path to directory for log files - if null, logs will be written to the application directory
 * @property {string} logger.filename Name of log file
 * @property {object} pg Configuration object for PostGres interface
 * @property {string} pg.conString PostGres connection string
 * @property {string} pg.table_all_reports Database table for reports from all sources
 * @property {string} pg.table_tweets Database table name for tweets
 * @property {string} pg.table_users Database table name for user information
 * @property {string} pg.table_invitees Database table name for users who have been tweeted
 * @property {string} pg.table_unconfirmed Database table name for unconfirmed reports
 * @property {string} pg.table_nonspatial_users Database table name for users who have had a non-spatial report received
 * @property {string} pg.table_nonspatial_tweet_reports Database table name for nonspatial tweets
 * @property {string} pg.table_all_users Database table name for user hashes
 * @property {number} pg.reconnectionDelay Delay before attempting a reconnection in ms
 * @property {number} pg.reconnectionAttempts Number of times to attempt reconnection before notifying admin and exiting
 */
var config = {};

config.dataSources = [ 'detik' ];

// Logging configuration
config.logger = {};
config.logger.level = "info"; // What level to log at; info, verbose or debug are most useful. Levels are (npm defaults): silly, debug, verbose, info, warn, error.
config.logger.maxFileSize = 1024 * 1024 * 100; // Max file size in bytes of each log file; default 100MB
config.logger.maxFiles = 10; // Max number of log files kept
config.logger.logDirectory = null; // Set this to a full path to a directory - if not set logs will be written to the application directory.
config.logger.filename = 'cognicity-reports'; // base filename to use

// Postgres database connection
config.pg = {};
config.pg.conString = "postgres://postgres:password@localhost:5432/cognicity";
// Database tables
config.pg.all_reports = 'all_reports';
config.pg.table_tweets = 'tweet_reports';
config.pg.table_users = 'tweet_users';
config.pg.table_invitees = 'tweet_invitees';
config.pg.table_unconfirmed = 'tweet_reports_unconfirmed';
config.pg.table_nonspatial_users = 'nonspatial_tweet_users';
config.pg.table_nonspatial_tweet_reports = 'nonspatial_tweet_reports';
config.pg.table_all_users = 'tweet_all_users';
// Database reconnection settings
config.pg.reconnectionDelay = 1000 * 60 * 3; // Delay before attempting a reconnection in ms
config.pg.reconnectionAttempts = 5; // Number of times to attempt reconnection before notifying admin and exiting

module.exports = config;
