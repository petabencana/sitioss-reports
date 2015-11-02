'use strict';

/* jshint -W079 */ // Ignore this error for this import only, as we get a redefinition problem
var test = require('unit.js');
/* jshint +W079 */
var Harvester = require('../Harvester');

// Create server with empty objects
// We will mock these objects as required for each test suite
var harvester = new Harvester(
	{},
	{},
	{},
	{}
);

// Mocked logger we can use to let code run without error when trying to call logger messages
harvester.logger = {
	error:function(){},
	warn:function(){},
	info:function(){},
	verbose:function(){},
	debug:function(){}
};

// Test harness for CognicityReportsPowertrack object
describe( 'Harvester', function() {
	
	// Test suite for dbQuery function
	describe( 'dbQuery', function() {
		before( function() {
			// Mock required parts of the PG config
			harvester.config = {
				'pg' : {
					'conString' : ''
				}
			};
		});
		
		// Setup a success handler which just flags whether it was run or not
		var successful = false;
		var successHandler = function(result) {
			successful = true;
		};
		
		beforeEach( function(){
			// Reset our success handler state
			successful = false;
			
			// Mock the PG object to let us set error states
			// Mock the connect and query methods to just pass through their arguments
			harvester.pg = {
				connectionErr: null,
				connectionClient: {
					query: function(config, handler) {
						handler(harvester.pg.queryErr, harvester.pg.queryResult);
					}
				},
				connectionDone: function(){},
				queryErr: null,
				queryResult: null,
				connect : function(config, success) {
					success(harvester.pg.connectionErr, harvester.pg.connectionClient, harvester.pg.connectionDone);
				}
			};
		});

		it( 'Connection error does not run success handler', function() {
			harvester.pg.connectionErr = true;
			harvester.dbQuery("", successHandler);
			test.value( successful ).isFalse();
		});
		it( 'Query error does not run success handler', function() {
			harvester.pg.queryErr = true;
			harvester.dbQuery("", successHandler);
			test.value( successful ).isFalse();
		});
		it( 'No error does run success handler', function() {
			harvester.dbQuery("", successHandler);
			test.value( successful ).isTrue();
		});
		
		// Restore/erase mocked functions
		after( function(){
			harvester.config = {};
			harvester.pg = {};
		});
	});
	
	describe( "tweetAdmin", function() {
		var message = 'princess is in another castle';
		
		var notifiedTimes; // Number of times twitter notification was sent

		before( function() {			
			// Capture the number of times we send a message via twitter
			harvester.twitter = {
				updateStatus: function() { notifiedTimes++; }	
			};
		});
		
		beforeEach( function() {
			// Reset capture variables
			notifiedTimes = 0;
		});
		
		it( 'No usernames does not send tweets', function() {
			harvester.config.adminTwitterUsernames = undefined;
			harvester.tweetAdmin( message );
			harvester.config.adminTwitterUsernames = null;
			harvester.tweetAdmin( message );
			harvester.config.adminTwitterUsernames = '';
			harvester.tweetAdmin( message );
			test.value( notifiedTimes ).is ( 0 );
		});
		
		it( 'Notification tweet is sent to a single user', function() {
			harvester.config.adminTwitterUsernames = "mario";
			harvester.tweetAdmin( message );
			test.value( notifiedTimes ).is ( 1 );
		});
		
		it( 'Notification tweet is sent to multiple users', function() {
			harvester.config.adminTwitterUsernames = "mario, peach";
			harvester.tweetAdmin( message );
			test.value( notifiedTimes ).is ( 2 );
		});
		
		// Restore/erase mocked functions
		after( function(){
			harvester.config = {};
			harvester.twitter = {};
		});
		
	});

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
			harvester.config = {
				twitter: {}	
			};
		});
		
		it( 'Non-object properties are not tested', function() {
			harvester.config.twitter = {
				singleProperty : createString(200)
			};
			
			test.value( harvester.areTweetMessageLengthsOk() ).is( true );
		});

		it( 'Single short message is ok', function() {
			harvester.config.twitter = {
				messageObject : {
					'en' : createString(1)
				}
			};
			test.value( harvester.areTweetMessageLengthsOk() ).is( true );
		});

		it( 'Single long message is not ok', function() {
			harvester.config.twitter = {
				messageObject : {
					'en' : createString(124)
				}
			};
			test.value( harvester.areTweetMessageLengthsOk() ).is( false );
		});

		it( 'Message over timestamp boundary is ok when timestamp is off', function() {
			harvester.config.twitter = {
				messageObject : {
					'en' : createString(120)
				},
				addTimestamp : false
			};
			test.value( harvester.areTweetMessageLengthsOk() ).is( true );
		});

		it( 'Message over timestamp boundary is not ok when timestamp is on', function() {
			harvester.config.twitter = {
				messageObject : {
					'en' : createString(120)
				},
				addTimestamp : true
			};
			test.value( harvester.areTweetMessageLengthsOk() ).is( false );
		});

		it( 'Multiple short messages are ok', function() {
			harvester.config.twitter = {
				messageObject1 : {
					'en' : createString(100),
					'fr' : createString(100)
				},
				messageObject2 : {
					'en' : createString(100),
					'fr' : createString(100)
				}
			};
			test.value( harvester.areTweetMessageLengthsOk() ).is( true );
		});

		it( 'Long message and multiple short messages are not ok', function() {
			harvester.config.twitter = {
				messageObject1 : {
					'en' : createString(100),
					'fr' : createString(100)
				},
				messageObject2 : {
					'en' : createString(100),
					'fr' : createString(200)
				}
			};
			test.value( harvester.areTweetMessageLengthsOk() ).is( false );
		});

		after( function(){
			harvester.config = {};
		});
	});
	
	// TODO addDataSource
	// TODO start
	// TODO stop
	// TODO validateConfig
	// TODO enable/disable cache mode
	
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