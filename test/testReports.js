'use strict';

/* jshint -W079 */ // Ignore this error for this import only, as we get a redefinition problem
var test = require('unit.js');
/* jshint +W079 */
var Reports = require('../Reports');

// Create server with empty objects
// We will mock these objects as required for each test suite
var reports = new Reports(
	{},
	{},
	{},
	{}
);

// Mocked logger we can use to let code run without error when trying to call logger messages
reports.logger = {
	error:function(){},
	warn:function(){},
	info:function(){},
	verbose:function(){},
	debug:function(){}
};

// Test harness for CognicityReportsPowertrack object
describe( 'Reports', function() {

	// Test suite for dbQuery function
	describe( 'dbQuery', function() {
		before( function() {
			// Mock required parts of the PG config
			reports.config = {
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
			reports.pg = {
				connectionErr: null,
				connectionClient: {
					query: function(config, handler) {
						handler(reports.pg.queryErr, reports.pg.queryResult);
					}
				},
				connectionDone: function(){},
				queryErr: null,
				queryResult: null,
				connect : function(config, success) {
					success(reports.pg.connectionErr, reports.pg.connectionClient, reports.pg.connectionDone);
				}
			};
		});

		it( 'Connection error does not run success handler', function() {
			reports.pg.connectionErr = true;
			reports.dbQuery("", successHandler);
			test.value( successful ).isFalse();
		});
		it( 'Query error does not run success handler', function() {
			reports.pg.queryErr = true;
			reports.dbQuery("", successHandler);
			test.value( successful ).isFalse();
		});
		it( 'No error does run success handler', function() {
			reports.dbQuery("", successHandler);
			test.value( successful ).isTrue();
		});

		// Restore/erase mocked functions
		after( function(){
			reports.config = {};
			reports.pg = {};
		});
	});

	describe( "tweetAdmin", function() {
		var message = 'princess is in another castle';

		var notifiedTimes; // Number of times twitter notification was sent

		before( function() {
			// Capture the number of times we send a message via twitter
			reports.twitter = {
				updateStatus: function() { notifiedTimes++; }
			};
		});

		beforeEach( function() {
			// Reset capture variables
			notifiedTimes = 0;
		});

		it( 'No usernames does not send tweets', function() {
			reports.config.adminTwitterUsernames = undefined;
			reports.tweetAdmin( message );
			reports.config.adminTwitterUsernames = null;
			reports.tweetAdmin( message );
			reports.config.adminTwitterUsernames = '';
			reports.tweetAdmin( message );
			test.value( notifiedTimes ).is ( 0 );
		});

		it( 'Notification tweet is sent to a single user', function() {
			reports.config.adminTwitterUsernames = "mario";
			reports.tweetAdmin( message );
			test.value( notifiedTimes ).is ( 1 );
		});

		it( 'Notification tweet is sent to multiple users', function() {
			reports.config.adminTwitterUsernames = "mario, peach";
			reports.tweetAdmin( message );
			test.value( notifiedTimes ).is ( 2 );
		});

		// Restore/erase mocked functions
		after( function(){
			reports.config = {};
			reports.twitter = {};
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
			reports.config = {
				twitter: {}
			};
		});

		it( 'Non-object properties are not tested', function() {
			reports.config.twitter = {
				singleProperty : createString(200)
			};

			test.value( reports.areTweetMessageLengthsOk() ).is( true );
		});

		it( 'Single short message is ok', function() {
			reports.config.twitter = {
				messageObject : {
					'en' : createString(1)
				}
			};
			test.value( reports.areTweetMessageLengthsOk() ).is( true );
		});

		it( 'Single long message is not ok', function() {
			reports.config.twitter = {
				messageObject : {
					'en' : createString(148)
				}
			};
			test.value( reports.areTweetMessageLengthsOk() ).is( false );
		});

		it( 'Message over timestamp boundary is ok when timestamp is off', function() {
			reports.config.twitter = {
				messageObject : {
					'en' : createString(120)
				},
				addTimestamp : false
			};
			test.value( reports.areTweetMessageLengthsOk() ).is( true );
		});

		it( 'Message over timestamp boundary is not ok when timestamp is on', function() {
			reports.config.twitter = {
				messageObject : {
					'en' : createString(134)
				},
				addTimestamp : true
			};
			test.value( reports.areTweetMessageLengthsOk() ).is( false );
		});

		it( 'Multiple short messages are ok', function() {
			reports.config.twitter = {
				messageObject1 : {
					'en' : createString(100),
					'fr' : createString(100)
				},
				messageObject2 : {
					'en' : createString(100),
					'fr' : createString(100)
				}
			};
			test.value( reports.areTweetMessageLengthsOk() ).is( true );
		});

		it( 'Long message and multiple short messages are not ok', function() {
			reports.config.twitter = {
				messageObject1 : {
					'en' : createString(100),
					'fr' : createString(100)
				},
				messageObject2 : {
					'en' : createString(100),
					'fr' : createString(200)
				}
			};
			test.value( reports.areTweetMessageLengthsOk() ).is( false );
		});

		after( function(){
			reports.config = {};
		});
	});

	describe( "addDataSource", function() {

		var ds1 = {
			id: 1
		};
		var ds2 = {
			id: 2
		};

		it( 'ds1 is added', function() {
			test.value( reports._dataSources.length ).is ( 0 );
			reports.addDataSource(ds1);
			test.value( reports._dataSources.length ).is ( 1 );
			test.value( reports._dataSources[0].id ).is ( 1 );
		});

		it( 'ds2 is added', function() {
			reports.addDataSource(ds2);
			test.value( reports._dataSources.length ).is ( 2 );
			test.value( reports._dataSources[0].id ).is ( 1 );
			test.value( reports._dataSources[1].id ).is ( 2 );
		});

		// Restore/erase mocked functions
		after( function(){
			reports._dataSources = [];
		});

	});

	describe( "start", function() {

		var ds1Started = false;
		var ds2Started = false;
		var ds1 = {
			start: function() {
				ds1Started = true;
			}
		};
		var ds2 = {
			start: function() {
				ds2Started = true;
			}
		};

		before( function() {
			reports.addDataSource(ds1);
			reports.addDataSource(ds2);
		});

		it( 'start() is called on all data sources', function() {
			reports.start();
			test.value( ds1Started ).is ( true );
			test.value( ds2Started ).is ( true );
		});

		// Restore/erase mocked functions
		after( function(){
			reports.config = {};
			reports.twitter = {};
			reports._dataSources = [];
		});

	});

	describe( "stop", function() {

		var ds1Stopped = false;
		var ds2Stopped = false;
		var ds1 = {
			stop: function() {
				ds1Stopped = true;
			}
		};
		var ds2 = {
			stop: function() {
				ds2Stopped = true;
			}
		};

		before( function() {
			reports.addDataSource(ds1);
			reports.addDataSource(ds2);
		});

		it( 'stop() is called on all data sources', function() {
			reports.stop();
			test.value( ds1Stopped ).is ( true );
			test.value( ds2Stopped ).is ( true );
		});

		// Restore/erase mocked functions
		after( function(){
			reports.config = {};
			reports.twitter = {};
			reports._dataSources = [];
		});

	});

	describe( "enableCacheMode", function() {

		var ds1EnableCacheModeCalled = false;
		var ds2EnableCacheModeCalled = false;
		var ds1 = {
			enableCacheMode: function() {
				ds1EnableCacheModeCalled = true;
			}
		};
		var ds2 = {
			enableCacheMode: function() {
				ds2EnableCacheModeCalled = true;
			}
		};

		before( function() {
			reports.addDataSource(ds1);
			reports.addDataSource(ds2);
		});

		it( 'enableCacheMode() is called on all data sources', function() {
			reports.enableCacheMode();
			test.value( ds1EnableCacheModeCalled ).is ( true );
			test.value( ds2EnableCacheModeCalled ).is ( true );
		});

		// Restore/erase mocked functions
		after( function(){
			reports.config = {};
			reports.twitter = {};
			reports._dataSources = [];
		});

	});

	describe( "disableCacheMode", function() {

		var ds1DisableCacheModeCalled = false;
		var ds2DisableCacheModeCalled = false;
		var ds1 = {
			disableCacheMode: function() {
				ds1DisableCacheModeCalled = true;
			}
		};
		var ds2 = {
			disableCacheMode: function() {
				ds2DisableCacheModeCalled = true;
			}
		};

		before( function() {
			reports.addDataSource(ds1);
			reports.addDataSource(ds2);
		});

		it( 'disableCacheMode() is called on all data sources', function() {
			reports.disableCacheMode();
			test.value( ds1DisableCacheModeCalled ).is ( true );
			test.value( ds2DisableCacheModeCalled ).is ( true );
		});

		// Restore/erase mocked functions
		after( function(){
			reports.config = {};
			reports.twitter = {};
			reports._dataSources = [];
		});

	});

	// TODO validateConfig

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
