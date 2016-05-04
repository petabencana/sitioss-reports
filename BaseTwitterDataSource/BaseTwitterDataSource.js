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
	 * Only execute the success callback if the user is not currently in the all users table.
	 * @param {string} user The twitter screen name to check if exists
	 * @param {DbQuerySuccess} callback Callback to execute if the user doesn't exist
	 */
	_ifNewUser: function(user, success) {
		var self = this;

		self.reports.dbQuery(
			{
				text: "SELECT user_hash FROM " + self.config.pg.table_all_users + " WHERE user_hash = md5($1);",
				values: [ user ]
			},
			function(result) {
				if (result && result.rows && result.rows.length === 0) {
					success(result);
				} else {
					self.logger.debug("Not performing callback as user already exists");
				}
			}
		);
	},
	
	/**
	 * Validate the data source configuration.
	 * Check twitter credentials and tweet message lengths.
	 * @return {Promise} Validation promise, throws an error on any validation error
	 */
	validateConfig: function() {
		var self = this;
		
		// Contain separate validation promises in one 'all' promise
		return RSVP.all([
		    self._verifyTwitterCredentials(),
		    self._areTweetMessageLengthsOk()
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
	 * Check that all tweetable message texts are of an acceptable length.
	 * This is 109 characters max if timestamps are enabled, or 123 characters max if timestamps are not enabled.
	 * @see {@link https://dev.twitter.com/overview/api/counting-characters} (max tweet = 140 chars)
	 * @see {@link https://support.twitter.com/articles/14609-changing-your-username} (max username = 15 chars)
	 * @return {Promise} Validation promise, throws an error if any message lengths are not acceptable
	 */
	_areTweetMessageLengthsOk: function() {
		var self = this;
		
		return new RSVP.Promise( function(resolve, reject) {
			var valid = true;
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
						// Twitter shortens (or in some cases lengthens) all URLs to a length, which slowly varies over time.
						// We use config.twitter.url_length to keep track of the current length, and here replace url length
						// with the resulting t.co output length in calculations for checking tweet length
						var length = message.length;
						var matches = message.match(/http[^ ]*/g);
						if (matches) {
							for (var i = 0; i < matches.length; i++) {
								length += self.config.twitter.url_length - matches[i].length;
							}
						}

						if ( length > maxLength ) {
							valid = false;
							self.logger.error( "Message " + configItemKey + "." + messageKey + " '" + message + "' is too long (" + message.length + " chars)" );
							reject( "Message " + configItemKey + "." + messageKey + " '" + message + "' is too long (" + message.length + " chars)" );
						}
					});
				}
			});
			
			if (valid) {
				self.logger.info("_areTweetMessageLengthsOk: Tweet lengths verified");
				resolve();
			}
		});
	},
	
	/**
	 * Send @reply Twitter message
	 * @param {string} username Twitter username of user to send reply to
	 * @param {string} tweetId ID of tweet to send reply to
	 * @param {string} message The tweet text to send
	 * @param {function} success Callback function called on success
	 */
	_baseSendReplyTweet: function(username, tweetId, message, success) {
		var self = this;

		var usernameInBlacklist = false;
		if (self.config.twitter.usernameReplyBlacklist) {
			self.config.twitter.usernameReplyBlacklist.split(",").forEach( function(blacklistUsername){
				if ( username === blacklistUsername.trim() ) usernameInBlacklist = true;
			});
		}

		if ( usernameInBlacklist ) {
			// Never send tweets to usernames in blacklist
			self.logger.info( '_sendReplyTweet: Tweet user is in usernameReplyBlacklist, not sending' );
		} else {
			// Tweet is not to ourself, attempt to send
			var params = {
				in_reply_to_status_id: tweetId
			};

			message = '@' + username + ' ' + message;
			if ( self.config.twitter.addTimestamp ) message = message + " " + new Date().getTime();

			if (self.config.twitter.send_enabled === true){
				self.twitter.updateStatus(message, params, function(err, data){
					if (err) {
						self.logger.error( 'Tweeting "' + message + '" with params "' + JSON.stringify(params) + '" failed: ' + err );
					} else {
						self.logger.debug( 'Sent tweet: "' + message + '" with params ' + JSON.stringify(params) );
						if (success) success();
					}
				});
			} else { // for testing
				self.logger.info( '_sendReplyTweet: In test mode - no message will be sent. Callback will still run.' );
				self.logger.info( '_sendReplyTweet: Would have tweeted: "' + message + '" with params ' + JSON.stringify(params) );
				if (success) success();
			}
		}
	},
	
	/**
	 * Insert an invitee - i.e. a user we've invited to participate.
	 * @param {string} username Twitter username to log as invited user
	 */
	_baseInsertInvitee: function(username) {
		var self = this;

		self.reports.dbQuery(
			{
				text : "INSERT INTO " + self.config.pg.table_invitees + " (user_hash) VALUES (md5($1));",
				values : [ username ]
			},
			function(result) {
				self.logger.info('Logged new invitee - @' + username);
			}
		);
	},
	
	/**
	 * Insert an unconfirmed report - i.e. has geo coordinates but is not addressed.
	 * @param {string} createdAt ISO8601 timestamp tweet was created at
	 * @param {string} coordinates TODO
	 */
	_baseInsertUnConfirmed: function(createdAt, coordinates) {
		var self = this;

		self.reports.dbQuery(
			{
				text : "INSERT INTO " + self.config.pg.table_unconfirmed + " " +
					"(created_at, the_geom) " +
					"VALUES ( " +
					"$1, " +
					"ST_GeomFromText('POINT(' || $2 || ')',4326)" +
					");",
				values : [
				    createdAt,
				    coordinates
				]
			},
			function(result) {
				self.logger.info('Logged unconfirmed tweet report');
			}
		);
	},
	
	/**
	 * Resolve message code from config.twitter using passed language codes.
	 * Will fall back to trying to resolve message using default language set in configuration.
	 * @param {string} code Message code to lookup in config.twitter
	 * @param {Array} langs Array of language codes to try and resolve in order of preference
	 * @returns {?string} Message text, or null if not resolved.
	 */
	_baseGetMessage: function(code, langs) {
		var self = this;

		// Find a matching code if we can
		if (self.config.twitter[code]) {
			for (var i=0; i<langs.length; i++) {
				var lang = langs[i];
				if (self.config.twitter[code][lang]) return self.config.twitter[code][lang];
			}
			// If we haven't found a code, try the default language
			if (self.config.twitter[code][self.config.twitter.defaultLanguage]) return self.config.twitter[code][self.config.twitter.defaultLanguage];
		}

		self.logger.warn( "_getMessage: Code could not be resolved for '" + code + "' and langs '" + langs +"'" );
		return null;
	},
	
	/**
	 * Insert a non-spatial tweet report - i.e. we got an addressed tweet without geo coordinates.
	 * @param {GnipTweetActivity} tweetActivity Gnip PowerTrack tweet activity object
	 */
	_baseInsertNonSpatial: function(username, createdAt, text, hashtags, urls, userMentions, lang) {
		var self = this;

		self.reports.dbQuery(
			{
				text : "INSERT INTO " + self.config.pg.table_nonspatial_tweet_reports + " " +
					"(created_at, text, hashtags, urls, user_mentions, lang) " +
					"VALUES (" +
					"$1, " +
					"$2, " +
					"$3, " +
					"$4, " +
					"$5, " +
					"$6" +
					");",
				values : [
					createdAt,
					text,
					hashtags,
					urls,
					userMentions,
					lang
				]
			},

			function(result) {
				self.logger.info('Inserted non-spatial tweet');
				
				self._ifNewUser( username, function(result) {
					self.reports.dbQuery(
						{
							text : "INSERT INTO " + self.config.pg.table_nonspatial_users + " (user_hash) VALUES (md5($1));",
							values : [ username ]
						},
						function(result) {
							self.logger.info("Inserted non-spatial user");
						}
					);
				});
			}
		);
	},
	
	/**
	 * Insert a confirmed report - i.e. has geo coordinates and is addressed.
	 * Store both the tweet information and the user hash.
	 * TODO
	 */
	_baseInsertConfirmed: function(username, langs, tweetId, createdAt, text, hashtags, textUrls, userMentions, lang, url, theGeom) {
		var self = this;

		//insertUser with count -> upsert
		self.reports.dbQuery(
			{
				text : "INSERT INTO " + self.config.pg.table_tweets + " " +
					"(created_at, text, hashtags, text_urls, user_mentions, lang, url, tweet_id, the_geom) " +
					"VALUES (" +
					"$1, " +
					"$2, " +
					"$3, " +
					"$4, " +
					"$5, " +
					"$6, " +
					"$7, " +
					"$8, " +
					"ST_GeomFromText('POINT(' || $9 || ')',4326)" +
					") RETURNING pkey;",
				values : [
				    createdAt,
				    text,
				    hashtags,
				    textUrls,
				    userMentions,
				    lang,
					url,
					tweetId,
				    theGeom
				]
			},
			function(result) {
				var report_id_foreign_key = result.rows[0].pkey; // primary key for tweet reports = foreign key for all_reports table
				self.logger.info('Logged confirmed tweet report');
				self.reports.dbQuery(
					{
						text : "SELECT upsert_tweet_users(md5($1));",
						values : [
						    username
						]
					},
					function(result) {
						self.logger.info('Logged confirmed tweet user');
						self.reports.dbQuery(
							{
								text: "SELECT pkey FROM "+self.config.pg.table_all_reports+" WHERE fkey = $1 AND source = 'twitter';",
								values : [
									report_id_foreign_key
								]
							},
							function(result) {
								self.logger.info('Logged confirmed tweet user');
								// Get correct response message
								var message = self._getMessage('thanks_text', langs);
								// Append ID of user's report
								message += result.rows[0].pkey;
								// Send the user a thank-you tweet; send this for every confirmed report, timestamp not needed because of unique url
								self._baseSendReplyTweet( username, tweetId, message );
							}
						);
					}
				);
			}
		);
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
