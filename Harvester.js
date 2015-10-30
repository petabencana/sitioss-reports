'use strict';

/**
 * The Cognicity Reports data harvester.
 * Uses data source plugins to retrieve data from external sources and store in the Cognicity Server
 * database.
 * @constructor
 * @param {config} config Configuration object
 * @param {object} pg Configured instance of pg object from pg module
 * @param {object} twitter Configured instance of twitter object from ntwitter module
 * @param {object} logger Configured instance of logger object from Winston module
 */
var Harvester = function(
	config,
	pg,
	twitter,
	logger
	){
	
	this.config = config;
	this.pg = pg;
	this.twitter = twitter;
	this.logger = logger;
};

Harvester.prototype = {
	
	/**
	 * Configuration object
	 * @type {config}
	 */
	config: null,
	
	/**
	 * Configured instance of twitter object from ntwitter module
	 * @type {object}
	 */
	twitter: null,
	
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
	 * Tweet the admin usernames defined in 'adminTwitterUsernames' in config.
	 * @param {string} warningMessage The message to tweet
	 * @param {function} callback Callback to execute after tweet sending
	 */
	tweetAdmin: function(warningMessage, callback) {
		var self = this;

		// Send notification tweet if we have a configured username
		if (self.config.adminTwitterUsernames) {
			// Construct the notification messages for each user.
			self.config.adminTwitterUsernames.split(",").forEach( function(username){
				var trimmedUsername = username.trim();
				// Always timestamp this, otherwise the messages will always look the same and won't post.
				var message = '@' + trimmedUsername +
					' ' + warningMessage +
					" " + new Date().getTime();

				self.logger.warn( 'tweetAdmin: Tweeting warning: "' + message + '"' );
				self.twitter.updateStatus(message, function(err, data){
					if (err) self.logger.error('tweetAdmin: Tweeting failed: ' + err);
					if (callback) callback();
				});
			});
		} else {
			if (callback) callback();
		}
	},
	
	/**
	 * Verify that all necessary configuration has been supplied and is correct.
	 * Exit with error if not.
	 */
	validateConfig: function() {
		// TODO check areTweetMessageLengthsOk
	},
	
	/**
	 * Start harvesting data.
	 * This will call start() on each data source.
	 * @see {@link BaseDataSource.start}
	 */
	start: function() {
		var self = this;
		
		// TODO validate config
		
		//TODOconsole.log("starting datasources: " + self._dataSources);
		self._dataSources.forEach( function(dataSource) {
			//TODOconsole.log("starting datasource "+dataSource);
			dataSource.start();
		});
	},
	
	/**
	 * Stop the harvester.
	 * This will call stop() on each data source.
	 * @see {@link BaseDataSource.stop}
	 */
	stop: function() {
		var self = this;
		
		// TODO Do we need to delay or check when these have finished?
		self._dataSources.forEach( function(dataSource) {
			dataSource.stop();
		});
	},
	
	/**
	 * Add the supplied data source to the harvester's list of data sources.
	 * @param {BaseDataSource} Data source to add.
	 */
	addDataSource: function(dataSource) {
		var self = this;
		self._dataSources.push( dataSource );
	},
	
	/**
	 * Check that all tweetable message texts are of an acceptable length.
	 * This is 109 characters max if timestamps are enabled, or 123 characters max if timestamps are not enabled.
	 * @see {@link https://dev.twitter.com/overview/api/counting-characters} (max tweet = 140 chars)
	 * @see {@link https://support.twitter.com/articles/14609-changing-your-username} (max username = 15 chars)
	 * @return {boolean} True if message texts are all okay, false if any are not.
	 */
	areTweetMessageLengthsOk: function() {
		var self = this;
		var lengthsOk = true;
		
		Object.keys( self.config.twitter ).forEach( function(configItemKey) {
			// We only want to process the objects containing language/message pairs here,
			// not the single properties.
			var configItem = self.config.twitter[configItemKey];
			if (typeof configItem === "object") {
				var maxLength = 140; // Maximum tweet length
				maxLength -= 17; // Minus username, @ sign and space = 123
				if ( self.config.twitter.addTimestamp ) maxLength -= 14; // Minus 13 digit timestamp + space = 109 (13 digit timestamp is ok until the year 2286)
				Object.keys( configItem ).forEach( function(messageKey) {
					var message = configItem[messageKey];
					if ( message.length > maxLength ) {
						self.logger.error( "Message " + configItemKey + "." + messageKey + " '" + message + "' is too long (" + message.length + " chars)" );
						lengthsOk = false;
					}
				});
			}
		});
		
		return lengthsOk;
	}
	
};

// Export the Harvester constructor
module.exports = Harvester;