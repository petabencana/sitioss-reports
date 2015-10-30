'use strict';

/**
 * The base data source class.
 * This class needs to be 'extended' by an object with specific data source behaviour.
 * @constructor
 * @param {Harvester} harvester An instance of the harvester object.
 * @param {object} logger Configured instance of logger object from Winston module.
 */
var BaseDataSource = function(
		harvester
	){
	this.harvester = harvester;
	this.logger = harvester.logger;
};
	
BaseDataSource.prototype = {
		
	/**
	 * Instance of the harvester that the data source uses to interact with Cognicity Server.
	 * @type {Harvester}
	 */
	harvester: null,
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
	 * Process the incoming data.
	 * Decide if the data is appropriate and act on it, interacting with Cognicity Server as necessary.
	 * @abstract
	 * @param {object} data The incoming data to process
	 */
	filter: function(data) {
		// TODO must be overridden
		console.log("base data source filter");
	},
	
	/**
	 * Start this data source processing incoming data.
	 * Setup the connection to the external data source and begin processing data with the filter method.
	 * @see {@link BaseDataSource.filter}
	 * @abstract
	 */
	start: function() {
		// TODO must be overridden
		console.log("base data source start");
	},
	
	/**
	 * Stop this data source processing incoming data.
	 * If there are shutdown actions that this data source should take, override this method
	 * and perform those actions here.
	 * @abstract
	 */
	stop: function() {
		// TODO must be overridden
		console.log("base data source stop");
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
	},

};

// Export the BaseDataSource constructor
module.exports = BaseDataSource;