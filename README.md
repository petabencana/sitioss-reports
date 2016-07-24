# cognicity-reports
Master module for collecting reports for the [CogniCity framework](http://cognicity.info/cognicity/)

[![Build Status](https://travis-ci.org/smart-facility/cognicity-reports.svg?branch=master)](https://travis-ci.org/smart-facility/cognicity-reports)

DOI for current stable release [v2.0.0](https://github.com/smart-facility/cognicity-reports/releases/tag/v2.0.0):
[![DOI](https://zenodo.org/badge/19201/smart-facility/cognicity-reports.svg)](https://zenodo.org/badge/latestdoi/19201/smart-facility/cognicity-reports)

### API Documentation
[http://cognicity.info/cognicity/api-docs/cognicity-reports/index.html](http://cognicity.info/cognicity/api-docs/cognicity-reports/index.html)

### Dependencies
* [NodeJS](http://nodejs.org) version 4.2.1 or compatible
* [PostgreSQL](http://www.postgresql.org) version 9.2 or later, with [PostGIS](http://postgis.org/) version 2.0 or compatible

#### Node Modules
* Check package.json for details

If you're going to commit changes to the JavaScript, be sure to run 'npm test' first - and fix any issues that it complains about, otherwise the build will fail when you push the commit.

### Installation
Download the source code for cognicity-reports from github: [http://github.com/smart-facility/cognicity-reports](https://github.com/smart-facility/cognicity-reports) or view the CogniCity installation documentation at [http://cognicity.info](http://cognicity.info).

Install the node dependencies in package.json using NPM: `npm install`. You will need to repeat that for each of the submodules (in the submodule directories).

#### Platform-specific notes ####
To build on OS X we recommend using [homebrew](http://brew.sh) to install node, npm, and required node modules as follows:
```shell
brew install node
npm install
```

To build on Windows we recommend installing all dependencies (making sure to use all 32 bit or all 64 bit, depending on your architecture) plus following the instructions (for Windows 7 follow the Windows 7/8 instructions) for [node-gyp](https://github.com/TooTallNate/node-gyp) and then:
* You need to add *C:\Program Files\PostgreSQL\9.3\bin* (modifying that location if necessary to point to the installed version of PostgreSQL) to path so the build script finds `pg_config`, and
* You need to create the *%APPDATA%\npm* folder and run cmd (and hence npm) as administrator. *%APPDATA%* is usually under *C:\Users\your_username\AppData\Remote*.
* You may need to specify the version of the build tools installed by adding the argument `--msvs_version=2013` to the `npm` command (substituting the appropriate version)
Then you can run `npm install`.

### Data Sources
You will need at least one data source configured to run the reports module.

Cognicity data sources are included as submodules of this master reports module.

You will need to configure the reports module to use at least one of them (see Configuration section below).

#### Data Source Structure
Data sources must have the following properties:

##### index.js
An index.js file must be present in the top level of the module.

The file must export a function which constructs a new instance of the data source. The method takes an instance of the
reports object as an argument, and the method signature is:
```javascript
function constructor( reports ) {
    // Return new instance - e.g.: return new PowertrackDataSource( reports, config );
}
```
The index.js file in turn can specify a config file specific to the submodule.

##### Data Source Object
The data source object must implement the following method to start receiving data:

```javascript
/** Begin receiving data from the source */
function start() {}
```

And optionally can implement the following method to shutdown:

```javascript
/** Stop receiving data from the source */
function stop() {}
```

The data source can implement caching behaviour, used to continue processing if the database is temporarily offline, by
implementing both of the following methods:

```javascript
/** Stop realtime processing, continue to retrieve data but delay processing */
function enableCacheMode() {}

/** Resume realtime processing and immediately process any cached data */
function disableCacheMode() {}

```

### Configuration
App configuration parameters are stored in a configuration file which is parsed by app.js. See sample-reports-config.js for an example configuration.

#### Data Sources
* dataSources - List of data source folder names which the module will run when started

#### Logging parameters
* level - info or debug are most useful here, debug will give you more verbose logging output
* maxFileSize - max size (in bytes) of each log file before a new one is created
* maxFiles - number of log files to retain
* logDirectory - Specify a full path to the log directory. If not specified, the application directory will be used.

#### Postgres connection
* conString - PostgreSQL connection details string (see node-postgres module documenation)[https://github.com/brianc/node-postgres]
* postgres tables as defined in database schema
* reconnectionDelay - Delay between reconnection attempts if postgres connection lost
* reconnectionAttempts - Number of times to attempt to reconnect before dying

### PostgreSQL/PostGIS schema
* see the [cognicity-schema](https://github.com/smart-facility/cognicity-schema) project for schema files

### Run
During development, the app can be run using node like so:
```shell
node app.js config.js
```

For deployment, the app can be run as a background process using the [pm2 process manager](https://github.com/Unitech/pm2).

To install pm2, run:
```shell
sudo npm install pm2 -g
```
The app can then be started using
```shell
pm2 start processes.json
```
To have pm2 started on OS startup run
```shell
pm2 startup
```
and then run the command as per the instructions that prints out. If that command errors then you may have to specify the system (note that systemd should be used on CentOS 7). Note that if the process is not running as root (recommended) you will need to change `/etc/init.d/pm2-init.sh` to set `export PM2_HOME="/path/to/user/home/.pm2"`, as per [these instructions](
http://www.buildsucceeded.com/2015/solved-pm2-startup-at-boot-time-centos-7-red-hat-linux/)

The file [processes.json](processes.json) contains a number of options that can be set, including the name of the process (default: "harvester") and the watch list. At the moment any paths or files starting with . (including .git), node_modules, git, test folders, and all \*.log files will be ignored, but any other changes (e.g. to a config file, or to the code itself) will automatically result in a restart of the process. Refer to the [documentation](http://pm2.keymetrics.io/docs/usage/application-declaration/) for more options in the [processes.json](processes.json) file.

For further details refer to the [README for pm2](https://github.com/Unitech/PM2/blob/master/README.md).

### Logging
* Winston writes to project-name.log (and project-name#.log if configured for multiple files)
* The log directory can be configured, by default it is the project directory

### Development

#### Testing

Note that the documentation here is for this master reports module, and each submodule has their own set of tests run in a similar manner. Please refer to the submodule documentation for further information.

To run the full set of tests, run:

```shell
npm test
```

This will run the following tests:

##### JSHint

JSHint will run on all JavaScript files in the root folder and test folders.

Running the script:

```shell
npm run jshint
```

This will print an error to the screen if any problems are found.

##### Mocha

Mocha will run all unit tests in the test folder and can be run with the following script:

```shell
npm run mocha
```

The test output will tell you how many tests passed and failed.

#### Git Hooks

There is a git pre-commit hook which will run the 'npm test' command before your commit and will fail the commit if testing fails.

To use this hook, copy the file from 'git-hooks/pre-commit' to '.git/hooks/pre-commit' in your project folder.

```shell
cp git-hooks/pre-commit .git/hooks/
```

#### Documentation

To build the JSDoc documentation run the following npm script:

```shell
npm run build-docs
```

This will generate the API documentation in HTML format in the `docs` folder, where you can open it with a web browser.

#### Test Coverage

To build test code coverage documentation, run the following npm script:

```shell
npm run coverage
```

This will run istanbul code coverage over the full mocha test harness and produce HTML documentation in the directory `coverage` where you can open it with a web browser.

#### Release

The release procedure is as follows:
* Update the CHANGELOG.md file with the newly released version, date, and a high-level overview of changes. Commit the change.
* Create a tag in git from the current head of master. The tag version should be the same as the version specified in the package.json file - this is the release version.
* Update the version in the package.json file and commit the change.
* Further development is now on the updated version number until the release process begins again.

### License
This software is released under the GPLv3 License. See License.txt for details.
