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
var BaseTwitterDataSource = new BaseTwitterDataSource(
	reports,
	{}
);

// Mocked logger we can use to let code run without error when trying to call logger messages
BaseTwitterDataSource.logger = {
	error:function(){},
	warn:function(){},
	info:function(){},
	verbose:function(){},
	debug:function(){}
};
BaseTwitterDataSource.reports.logger = BaseTwitterDataSource.logger;

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
			BaseTwitterDataSource.config = {
				twitter: {}
			};
		});

		it( 'Non-object properties are not tested', function() {
			BaseTwitterDataSource.config.twitter = {
				singleProperty : createString(200)
			};

		    test.promise
		    	.given( BaseTwitterDataSource._areTweetMessageLengthsOk() )
		    	.then(function(value) {
		    		// pass
		    	})
		    	.catch(function(err){
		    		test.fail(err.message);
		    	})
		      	.done();
		});

		it( 'Single short message is ok', function() {
			BaseTwitterDataSource.config.twitter = {
				messageObject : {
					'en' : createString(1)
				}
			};
			
		    test.promise
		    	.given( BaseTwitterDataSource._areTweetMessageLengthsOk() )
		    	.then(function(value) {
		    		// pass
		    	})
		    	.catch(function(err){
		    		test.fail(err.message);
		    	})
		      	.done();
		});

		it( 'Single long message is not ok', function() {
			BaseTwitterDataSource.config.twitter = {
				messageObject : {
					'en' : createString(124)
				}
			};
			
		    test.promise
		    	.given( BaseTwitterDataSource._areTweetMessageLengthsOk() )
		    	.then(function(value) {
		    		test.fail(value);
		    	})
		    	.catch(function(err){
		    		// Error / validation failure case
		    	})
		      	.done();
		});

		it( 'Message over timestamp boundary is ok when timestamp is off', function() {
			BaseTwitterDataSource.config.twitter = {
				messageObject : {
					'en' : createString(120)
				},
				addTimestamp : false
			};
			
		    test.promise
		    	.given( BaseTwitterDataSource._areTweetMessageLengthsOk() )
		    	.then(function(value) {
		    		// pass
		    	})
		    	.catch(function(err){
		    		test.fail(err.message);
		    	})
		      	.done();
		});

		it( 'Message over timestamp boundary is not ok when timestamp is on', function() {
			BaseTwitterDataSource.config.twitter = {
				messageObject : {
					'en' : createString(120)
				},
				addTimestamp : true
			};
			
		    test.promise
		    	.given( BaseTwitterDataSource._areTweetMessageLengthsOk() )
		    	.then(function(value) {
		    		test.fail(value);
		    	})
		    	.catch(function(err){
		    		// Error / validation failure case
		    	})
		      	.done();
		});

		it( 'Multiple short messages are ok', function() {
			BaseTwitterDataSource.config.twitter = {
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
		    	.given( BaseTwitterDataSource._areTweetMessageLengthsOk() )
		    	.then(function(value) {
		    		// pass
		    	})
		    	.catch(function(err){
		    		test.fail(err.message);
		    	})
		      	.done();
		});

		it( 'Long message and multiple short messages are not ok', function() {
			BaseTwitterDataSource.config.twitter = {
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
		    	.given( BaseTwitterDataSource._areTweetMessageLengthsOk() )
		    	.then(function(value) {
		    		test.fail(value);
		    	})
		    	.catch(function(err){
		    		// Error / validation failure case
		    	})
		      	.done();
		});

		it( 'Message with one URL passes when under size limit', function() {
			BaseTwitterDataSource.config.twitter = {
				url_length: 1,
				messageObject1 : {
					'en' : createString(121) + " http://example.com"
				}
			};
			
		    test.promise
		    	.given( BaseTwitterDataSource._areTweetMessageLengthsOk() )
		    	.then(function(value) {
		    		// pass
		    	})
		    	.catch(function(err){
		    		test.fail(err.message);
		    	})
		      	.done();
		});

		it( 'Message with one URL fails when over size limit', function() {
			BaseTwitterDataSource.config.twitter = {
				url_length: 2,
				messageObject1 : {
					'en' : createString(121) + " http://example.com"
				}
			};
			
		    test.promise
		    	.given( BaseTwitterDataSource._areTweetMessageLengthsOk() )
		    	.then(function(value) {
		    		test.fail(value);
		    	})
		    	.catch(function(err){
		    		// Error / validation failure case
		    	})
		      	.done();

		});

		it( 'Message with two URLs passes when under size limit', function() {
			BaseTwitterDataSource.config.twitter = {
				url_length: 1,
				messageObject1 : {
					'en' : createString(119) + " http://example" + " https://example.com.au/foo/bar.html?a=1&b=2"
				}
			};
			
		    test.promise
		    	.given( BaseTwitterDataSource._areTweetMessageLengthsOk() )
		    	.then(function(value) {
		    		// pass
		    	})
		    	.catch(function(err){
		    		test.fail(err.message);
		    	})
		      	.done();
		});

		it( 'Message with two URLs fails when over size limit', function() {
			BaseTwitterDataSource.config.twitter = {
				url_length: 2,
				messageObject1 : {
					'en' : createString(119) + " http://example" + " https://example.com.au/foo/bar.html?a=1&b=2"
				}
			};
			
		    test.promise
		    	.given( BaseTwitterDataSource._areTweetMessageLengthsOk() )
		    	.then(function(value) {
		    		test.fail(value);
		    	})
		    	.catch(function(err){
		    		// Error / validation failure case
		    	})
		      	.done();

		});

		after( function(){
			BaseTwitterDataSource.config = {};
		});
	});
	
	describe( "_verifyTwitterCredentials", function() {
		var oldTwitter;
		var failVerify;
		
		before( function() {
			oldTwitter = BaseTwitterDataSource.twitter;
			BaseTwitterDataSource.twitter = {
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
		    	.given( BaseTwitterDataSource._verifyTwitterCredentials() )
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
		    	.given( BaseTwitterDataSource._verifyTwitterCredentials() )
		    	.then(function(value) {
		    		test.fail(value);
		    	})
		    	.catch(function(err){
		    		// failure case expected
		    	})
		      	.done();
		});

		after( function(){
			BaseTwitterDataSource.twitter = oldTwitter;
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
