'use strict';

// RSVP promises module
var RSVP = require('rsvp');

/**
 * Constructs the base twitter data source.
 * This is not a full data source but should be used as the prototype of a data source object.
 * This object provides some common functions for data sources which have twitter interaction.
 * @constructor
 * @param {Reports} reports An instance of the reports object.
 * @param {object} twitter Configured instance of twitter object from ntwitter module
 */
var BaseTwitterDataSource = function BaseTwitterDataSource(
	reports,
	twitter
		){
	this.reports = reports;
	this.logger = reports.logger;
	this.twitter = twitter;
};

BaseTwitterDataSource.prototype = {
	
	/**
	 * Instance of the reports module that the data source uses to interact with Cognicity Server.
	 * @type {Reports}
	 */
	reports: null,

	/**
	 * Configured instance of twitter object from ntwitter module
	 * @type {object}
	 */
	twitter: null,

	/**
	 * Instance of the Winston logger.
	 */
	logger: null,

	/**
	 * Flag signifying if we are currently able to process incoming data immediately.
	 * Turned on if the database is temporarily offline so we can cache for a short time.
	 * @type {boolean}
	 */
	_cacheMode: false,

	/**
	 * Store data if we cannot process immediately, for later processing.
	 * @type {Array}
	 */
	_cachedData: [],
	
	/**
	 * Validate the data source configuration.
	 * Check twitter credentials and tweet message lengths.
	 * @return {Promise} Validation promise, throws an error on any validation error
	 */
	validateTwitterConfig: function() {
		var self = this;
		
		// Contain separate validation promises in one 'all' promise
		return RSVP.all([
		    self._verifyTwitterCredentials()
		]);
	},

	/**
	 * Verify that the twitter connection was successful.
	 * @return {Promise} Validation promise, throws an error if twitter credentials cannot be verified
	 */
	_verifyTwitterCredentials: function() {
		var self = this;

		return new RSVP.Promise( function(resolve, reject) {
			self.twitter.verifyCredentials(function (err, data) {
				if (err) {
					self.logger.error("twitter.verifyCredentials: Error verifying credentials: " + err);
					self.logger.error("Fatal error: Application shutting down");
					reject("twitter.verifyCredentials: Error verifying credentials: " + err);
				} else {
					self.logger.info("twitter.verifyCredentials: Twitter credentials succesfully verified");
					resolve();
				}
			});
		});
	},
	
	/**
	 * Stop realtime processing of tweets and start caching tweets until caching mode is disabled.
	 */
	enableCacheMode: function() {
		var self = this;

		self.logger.verbose( 'enableCacheMode: Enabling caching mode' );
		self._cacheMode = true;
	},

	/**
	 * Resume realtime processing of tweets.
	 * Also immediately process any tweets cached while caching mode was enabled.
	 */
	disableCacheMode: function() {
		var self = this;

		self.logger.verbose( 'disableCacheMode: Disabling caching mode' );
		self._cacheMode = false;

		self.logger.verbose( 'disableCacheMode: Processing ' + self._cachedData.length + ' cached tweets' );
		self._cachedData.forEach( function(data) {
			self.filter(data);
		});
		self.logger.verbose( 'disableCacheMode: Cached tweets processed' );
		self._cachedData = [];
	}

};

// Export the BaseTwitterDataSource constructor
module.exports = BaseTwitterDataSource;
