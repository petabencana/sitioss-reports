'use strict';

/**
 * The Cognicity Reports data collection application.
 * Uses data source plugins to retrieve data from external sources and store in the Cognicity Server
 * database.
 * @constructor
 * @param {config} config Configuration object
 * @param {object} pg Configured instance of pg object from pg module
 * @param {object} logger Configured instance of logger object from Winston module
 */
var Reports = function(
	config,
	pg,
	logger
	){

	this.config = config;
	this.pg = pg;
	this.logger = logger;
};

Reports.prototype = {

	/**
	 * Configuration object
	 * @type {config}
	 */
	config: null,

	/**
	 * Configured instance of pg object from pg module
	 * @type {object}
	 */
	pg: null,

	/**
	 * Configured instance of logger object from Winston module
	 * @type {object}
	 */
	logger: null,

	/**
	 * The data sources used to retrieve data from external sources.
	 * @type {Array}
	 */
	_dataSources: [],

	/**
	 * DB query success callback
	 * @callback DbQuerySuccess
	 * @param {object} result The 'pg' module result object on a successful query
	 */

	/**
	 * Execute the SQL against the database connection. Run the success callback on success if supplied.
	 * @param {object} config The pg config object for a parameterized query, e.g. {text:"select * from foo where a=$1", values:['bar']}
	 * @param {string} config.text The SQL query to execute
	 * @param {Array} config.values Parameterized values to use for the SQL query
	 * @param {DbQuerySuccess} success Callback function to execute on success.
	 */
	dbQuery: function(config, success){
		var self = this;

		self.logger.debug( "dbQuery: executing query: " + JSON.stringify(config) );
		self.pg.connect(self.config.pg.conString, function(err, client, done){
			if (err){
				self.logger.error("dbQuery: " + JSON.stringify(config) + ", " + err);
				done();
				return;
			}
			client.query(config, function(err, result){
				if (err){
					self.logger.error("dbQuery: " + JSON.stringify(config) + ", " + err);
					done();
					return;
				}
				done();
				self.logger.debug( "dbQuery: success: " + JSON.stringify(config) );
				if (success) {
					try {
						success(result);
					} catch(error) {
						self.logger.error("dbQuery: Error in success callback: " + error.message + ", " + error.stack);
					}
				}
			});
		});
	},

	/**
	 * Verify that all necessary configuration has been supplied and is correct.
	 * Exit with error if not.
	 */
	validateConfig: function() {
		// TODO check areTweetMessageLengthsOk
		// TODO validate config on data sources?
	},
	
	/**
	 * Start collecting data.
	 * This will call start() on each data source.
	 */
	start: function() {
		var self = this;

		self.validateConfig();

		self._dataSources.forEach( function(dataSource) {
			dataSource.start();
		});
	},

	/**
	 * Stop collecting data.
	 * This will call stop() on each data source.
	 */
	stop: function() {
		var self = this;

		// TODO Do we need to delay or check when these have finished?
		self._dataSources.forEach( function(dataSource) {
			if (dataSource.stop) {
				dataSource.stop();
			}
		});
	},

	/**
	 * Enable caching mode, ask each data source to hold processing until DB is ready.
	 * This will call enableCacheMode() on each data source.
	 */
	enableCacheMode: function() {
		var self = this;

		self._dataSources.forEach( function(dataSource) {
			if (dataSource.enableCacheMode) {
				dataSource.enableCacheMode();
			}
		});
	},

	/**
	 * Disable caching mode, ask each data source to hold processing until DB is ready.
	 * This will call enableCacheMode() on each data source.
	 */
	disableCacheMode: function() {
		var self = this;

		self._dataSources.forEach( function(dataSource) {
			if (dataSource.disableCacheMode) {
				dataSource.disableCacheMode();
			}
		});
	},

	/**
	 * Add the supplied data source to the reports object's list of data sources.
	 * @param {BaseDataSource} Data source to add.
	 */
	addDataSource: function(dataSource) {
		var self = this;
		self._dataSources.push( dataSource );
	}

};

// Export the Reports constructor
module.exports = Reports;
