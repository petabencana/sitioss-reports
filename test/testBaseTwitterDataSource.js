'use strict';

/* jshint -W079 */ // Ignore this error for this import only, as we get a redefinition problem
var test = require('unit.js');
/* jshint +W079 */
var BaseTwitterDataSource = require('../BaseTwitterDataSource/BaseTwitterDataSource');

// Mock reports
var reports = {
	logger: {},
	tweetAdmin: function(){}
};

// Create server with empty objects
// We will mock these objects as required for each test suite
var baseTwitterDataSource = new BaseTwitterDataSource(
	reports,
	{}
);

// Mocked logger we can use to let code run without error when trying to call logger messages
baseTwitterDataSource.logger = {
	error:function(){},
	warn:function(){},
	info:function(){},
	verbose:function(){},
	debug:function(){}
};
baseTwitterDataSource.reports.logger = baseTwitterDataSource.logger;

// Test harness for CognicityReportsPowertrack object
describe( 'BaseTwitterDataSource', function() {
	
	describe( "areTweetMessageLengthsOk", function() {
		function createString(length) {
			var s = "";
			for (var i = 0; i<length; i++) {
				s += "a";
			}
			return s;
		}

		before( function() {
		});

		beforeEach( function() {
			baseTwitterDataSource.config = {
				twitter: {}
			};
		});

		it( 'Non-object properties are not tested', function() {
			baseTwitterDataSource.config.twitter = {
				singleProperty : createString(200)
			};

		    test.promise
		    	.given( baseTwitterDataSource._areTweetMessageLengthsOk() )
		    	.then(function(value) {
		    		// pass
		    	})
		    	.catch(function(err){
		    		test.fail(err.message);
		    	})
		      	.done();
		});

		it( 'Single short message is ok', function() {
			baseTwitterDataSource.config.twitter = {
				messageObject : {
					'en' : createString(1)
				}
			};
			
		    test.promise
		    	.given( baseTwitterDataSource._areTweetMessageLengthsOk() )
		    	.then(function(value) {
		    		// pass
		    	})
		    	.catch(function(err){
		    		test.fail(err.message);
		    	})
		      	.done();
		});

		it( 'Single long message is not ok', function() {
			baseTwitterDataSource.config.twitter = {
				messageObject : {
					'en' : createString(124)
				}
			};
			
		    test.promise
		    	.given( baseTwitterDataSource._areTweetMessageLengthsOk() )
		    	.then(function(value) {
		    		test.fail(value);
		    	})
		    	.catch(function(err){
		    		// Error / validation failure case
		    	})
		      	.done();
		});

		it( 'Message over timestamp boundary is ok when timestamp is off', function() {
			baseTwitterDataSource.config.twitter = {
				messageObject : {
					'en' : createString(120)
				},
				addTimestamp : false
			};
			
		    test.promise
		    	.given( baseTwitterDataSource._areTweetMessageLengthsOk() )
		    	.then(function(value) {
		    		// pass
		    	})
		    	.catch(function(err){
		    		test.fail(err.message);
		    	})
		      	.done();
		});

		it( 'Message over timestamp boundary is not ok when timestamp is on', function() {
			baseTwitterDataSource.config.twitter = {
				messageObject : {
					'en' : createString(120)
				},
				addTimestamp : true
			};
			
		    test.promise
		    	.given( baseTwitterDataSource._areTweetMessageLengthsOk() )
		    	.then(function(value) {
		    		test.fail(value);
		    	})
		    	.catch(function(err){
		    		// Error / validation failure case
		    	})
		      	.done();
		});

		it( 'Multiple short messages are ok', function() {
			baseTwitterDataSource.config.twitter = {
				messageObject1 : {
					'en' : createString(100),
					'fr' : createString(100)
				},
				messageObject2 : {
					'en' : createString(100),
					'fr' : createString(100)
				}
			};
			
		    test.promise
		    	.given( baseTwitterDataSource._areTweetMessageLengthsOk() )
		    	.then(function(value) {
		    		// pass
		    	})
		    	.catch(function(err){
		    		test.fail(err.message);
		    	})
		      	.done();
		});

		it( 'Long message and multiple short messages are not ok', function() {
			baseTwitterDataSource.config.twitter = {
				messageObject1 : {
					'en' : createString(100),
					'fr' : createString(100)
				},
				messageObject2 : {
					'en' : createString(100),
					'fr' : createString(200)
				}
			};
			
		    test.promise
		    	.given( baseTwitterDataSource._areTweetMessageLengthsOk() )
		    	.then(function(value) {
		    		test.fail(value);
		    	})
		    	.catch(function(err){
		    		// Error / validation failure case
		    	})
		      	.done();
		});

		it( 'Message with one URL passes when under size limit', function() {
			baseTwitterDataSource.config.twitter = {
				url_length: 1,
				messageObject1 : {
					'en' : createString(121) + " http://example.com"
				}
			};
			
		    test.promise
		    	.given( baseTwitterDataSource._areTweetMessageLengthsOk() )
		    	.then(function(value) {
		    		// pass
		    	})
		    	.catch(function(err){
		    		test.fail(err.message);
		    	})
		      	.done();
		});

		it( 'Message with one URL fails when over size limit', function() {
			baseTwitterDataSource.config.twitter = {
				url_length: 2,
				messageObject1 : {
					'en' : createString(121) + " http://example.com"
				}
			};
			
		    test.promise
		    	.given( baseTwitterDataSource._areTweetMessageLengthsOk() )
		    	.then(function(value) {
		    		test.fail(value);
		    	})
		    	.catch(function(err){
		    		// Error / validation failure case
		    	})
		      	.done();

		});

		it( 'Message with two URLs passes when under size limit', function() {
			baseTwitterDataSource.config.twitter = {
				url_length: 1,
				messageObject1 : {
					'en' : createString(119) + " http://example" + " https://example.com.au/foo/bar.html?a=1&b=2"
				}
			};
			
		    test.promise
		    	.given( baseTwitterDataSource._areTweetMessageLengthsOk() )
		    	.then(function(value) {
		    		// pass
		    	})
		    	.catch(function(err){
		    		test.fail(err.message);
		    	})
		      	.done();
		});

		it( 'Message with two URLs fails when over size limit', function() {
			baseTwitterDataSource.config.twitter = {
				url_length: 2,
				messageObject1 : {
					'en' : createString(119) + " http://example" + " https://example.com.au/foo/bar.html?a=1&b=2"
				}
			};
			
		    test.promise
		    	.given( baseTwitterDataSource._areTweetMessageLengthsOk() )
		    	.then(function(value) {
		    		test.fail(value);
		    	})
		    	.catch(function(err){
		    		// Error / validation failure case
		    	})
		      	.done();

		});

		after( function(){
			baseTwitterDataSource.config = {};
		});
	});
	
	describe( "_verifyTwitterCredentials", function() {
		var oldTwitter;
		var failVerify;
		
		before( function() {
			oldTwitter = baseTwitterDataSource.twitter;
			baseTwitterDataSource.twitter = {
				verifyCredentials: function(callback) {
					if (failVerify) callback(true, null);
					else callback(null, []);
				}	
			};
		});

		beforeEach( function() {
			failVerify = false;
		});

		it( 'VerifyCredentials success resolves promise', function() {			
		    test.promise
		    	.given( baseTwitterDataSource._verifyTwitterCredentials() )
		    	.then(function(value) {
		    		// success case expected
		    	})
		    	.catch(function(err){
		    		test.fail(err);
		    	})
		      	.done();
		});

		it( 'VerifyCredentials failure rejects promise', function() {
			failVerify = true;
			
		    test.promise
		    	.given( baseTwitterDataSource._verifyTwitterCredentials() )
		    	.then(function(value) {
		    		test.fail(value);
		    	})
		    	.catch(function(err){
		    		// failure case expected
		    	})
		      	.done();
		});

		after( function(){
			baseTwitterDataSource.twitter = oldTwitter;
		});
	});
	
	describe( "sendReplyTweet", function() {
		var successCallbackRan;
		var updateStatusRan;
		var updateStatusParams;
		var updateStatusMessage;
		var tweetId = "5377776775";

		function createTweetActivity(username) {
			return {
				id : 'tag:search.twitter.com,2005:'+tweetId,
				actor: {
					preferredUsername: username
				}
			};
		}
		function success(){
			successCallbackRan = true;
		}
		var message = 'pan galactic gargle blaster';

		before( function() {
			baseTwitterDataSource.twitter = {
				updateStatus: function(message,params,callback) {
					updateStatusMessage = message;
					updateStatusRan = true;
					updateStatusParams = params;
					callback( baseTwitterDataSource.twitter.tweetSendWillError, {} );
				}
			};
		});

		beforeEach( function() {
			baseTwitterDataSource.twitter.tweetSendWillError = false;
			successCallbackRan = false;
			updateStatusRan = false;
			updateStatusParams = {};
			updateStatusMessage = null;
			baseTwitterDataSource.config = {
				twitter: {
					usernameReplyBlacklist : 'zaphod, ford,arthur',
					send_enabled: true,
					addTimestamp: false
				}
			};
		});

		it( "sendReplyTweet calls updateStatus and executes callback", function() {
			baseTwitterDataSource._baseSendReplyTweet( 'trillian', tweetId, message, success );
			test.value( successCallbackRan ).is( true );
			test.value( updateStatusRan ).is( true );
		});


		it( "Tweet not sent to usernames in usernameReplyBlacklist", function() {
			baseTwitterDataSource._baseSendReplyTweet( 'zaphod', tweetId, message, success );
			test.value( successCallbackRan ).is( false );

			baseTwitterDataSource._baseSendReplyTweet( 'ford', tweetId, message, success );
			test.value( successCallbackRan ).is( false );

			baseTwitterDataSource._baseSendReplyTweet( 'arthur', tweetId, message, success );
			test.value( successCallbackRan ).is( false );
		});

		it( 'Tweet not sent if send_enabled is false', function() {
			baseTwitterDataSource.config.twitter.send_enabled = false;
			baseTwitterDataSource._baseSendReplyTweet( 'trillian', tweetId, message, success );
			test.value( updateStatusRan ).is( false );
		});

		it( 'Callback executed if send_enabled is false', function() {
			baseTwitterDataSource.config.twitter.send_enabled = false;
			baseTwitterDataSource._baseSendReplyTweet( 'trillian', tweetId, message, success );
			test.value( successCallbackRan ).is( true );
		});

		it( 'Callback not executed if error tweeting occurs', function() {
			baseTwitterDataSource.twitter.tweetSendWillError = true;
			baseTwitterDataSource._baseSendReplyTweet( 'trillian', tweetId, message, success );
			test.value( successCallbackRan ).is( false );
		});

		it( 'Tweet is reply to ID from tweetActivity', function() {
			baseTwitterDataSource._baseSendReplyTweet( 'trillian', tweetId, message, success );
			test.value( updateStatusParams.in_reply_to_status_id ).is( tweetId );
		});

		it( 'Timestamp is added to tweet', function() {
			baseTwitterDataSource.config.twitter.addTimestamp = false;
			baseTwitterDataSource._baseSendReplyTweet( 'trillian', tweetId, message, success );
			test.string( updateStatusMessage ).contains( message );
			test.string( updateStatusMessage ).notMatch( / [0-9]*$/ );
			
			baseTwitterDataSource.config.twitter.addTimestamp = true;
			baseTwitterDataSource._baseSendReplyTweet( 'trillian', tweetId, message, success );
			test.string( updateStatusMessage ).contains( message );
			test.string( updateStatusMessage ).match( / [0-9]*$/ );
		});
		
		after( function(){
			baseTwitterDataSource.twitter = {};
			baseTwitterDataSource.config = {};
		});
	});
	
	// TODO _ifNewUser
	// TODO _insertConfirmed
	// TODO _insertInvitee
	// TODO _insertUnConfirmed
	// TODO _insertNonSpatial

// Test template
//	describe( "suite", function() {
//		before( function() {
//		});
//
//		beforeEach( function() {
//		});
//
//		it( 'case', function() {
//		});
//
//		after( function(){
//		});
//	});

});
