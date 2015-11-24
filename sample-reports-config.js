'use strict';

// sample-config.js - sample configuration file for cognicity-reports module

/**
 * Configuration for cognicity-reports-powertrack
 * @namespace {object} config
 * @property {object} dataSources Array of datasource folder paths relative to the reports module
 * @property {?string} adminTwitterUsernames Twitter usernames (without @, comma separated for multiples) to send a notification tweet on error conditions
 * @property {object} logger Configuration object for logging module
 * @property {string} logger.level Logging level - info, verbose or debug are most useful. Levels are (npm defaults): silly, debug, verbose, info, warn, error.
 * @property {number} logger.maxFileSize Max file size in bytes of each log file
 * @property {number} logger.maxFiles Max number of log files kept
 * @property {?string} logger.logDirectory Full path to directory for log files - if null, logs will be written to the application directory
 * @property {string} logger.filename Name of log file
 * @property {object} twitter Configuration object for Twitter interface
 * @property {string} twitter.usernameReplyBlacklist Twitter usernames (without @, comma separated for multiples) which will never be responded to as part of tweet processing
 * @property {string} twitter.consumer_key Take from the twitter dev admin interface
 * @property {string} twitter.consumer_secret Take from the twitter dev admin interface
 * @property {string} twitter.access_token_key Take from the twitter dev admin interface
 * @property {string} twitter.access_token_secret Take from the twitter dev admin interface
 * @property {string} twitter.defaultLanguage The default language code to use if we can't resolve one from the tweet
 * @property {object} twitter.invite_text Object of twitter message texts mapping a language code to a message
 * @property {string} twitter.invite_text.(name) Language code to resolve
 * @property {string} twitter.invite_text.(value) Message to be tweeted
 * @property {object} twitter.askforgeo_text Object of twitter message texts mapping a language code to a message
 * @property {string} twitter.askforgeo_text.(name) Language code to resolve
 * @property {string} twitter.askforgeo_text.(value) Message to be tweeted
 * @property {object} twitter.thanks_text Object of twitter message texts mapping a language code to a message
 * @property {string} twitter.thanks_text.(name) Language code to resolve
 * @property {string} twitter.thanks_text.(value) Message to be tweeted
 * @property {boolean} twitter.addTimestamp If true, append a timestamp to each sent tweet
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

// Notification settings
config.adminTwitterUsernames = null; // Enter twitter usernames here (without @, comma separated for multiples) to send a notification tweet on error conditions

// Logging configuration
config.logger = {};
config.logger.level = "info"; // What level to log at; info, verbose or debug are most useful. Levels are (npm defaults): silly, debug, verbose, info, warn, error.
config.logger.maxFileSize = 1024 * 1024 * 100; // Max file size in bytes of each log file; default 100MB
config.logger.maxFiles = 10; // Max number of log files kept
config.logger.logDirectory = null; // Set this to a full path to a directory - if not set logs will be written to the application directory.
config.logger.filename = 'cognicity-reports'; // base filename to use

// Twitter app authentication details
config.twitter = {};
config.twitter.usernameReplyBlacklist = ''; // Twitter usernames (without @, comma separated for multiples) which will never be sent to in response to tweet processing
config.twitter.consumer_key = ''; // Take from the twitter dev admin interface
config.twitter.consumer_secret = ''; // Take from the twitter dev admin interface
config.twitter.access_token_key = ''; // Take from the twitter dev admin interface
config.twitter.access_token_secret = ''; // Take from the twitter dev admin interface

// Twitter parameters
config.twitter.send_enabled = false; // Enable sending of tweets?

// Twitter message texts
// Note we use IN and ID because twitter and Gnip return different language codes for Indonesian
// The messages should be no longer than 109 characters if timestamps are enabled, or 123 characters if timestamps are disabled
config.twitter.defaultLanguage = 'en'; // The default language code to use if we can't resolve one from the tweet
// Message codes. The name of the object (config.twitter.foo) is the name of the message type, that object should contain key value pairs
// where the key is the language code to resolve and the value is the message as a string.
// Note we have both ID and IN for indonesian
config.twitter.invite_text = {
	'in' : 'Invite/Verification Tweet Text [IN]',
	'id' : 'Invite/Verification Tweet Text [ID]',
	'en' : 'Invite/Verification Tweet Text [EN]'
};
config.twitter.askforgeo_text = {
	'in' : 'Location-enabled reminder Tweet Text [IN]',
	'id' : 'Location-enabled reminder Tweet Text [ID]',
	'en' : 'Location-enabled reminder Tweet Text [EN]'
};
config.twitter.thanks_text = {
	'in' : 'Thank-you Tweet Text [IN]',
	'id' : 'Thank-you Tweet Text [ID]',
	'en' : 'Thank-you Tweet Text [EN]'
};
// Append a timestamp to each sent tweet except response to confirmed reports with unique urls
config.twitter.addTimestamp = true;

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
