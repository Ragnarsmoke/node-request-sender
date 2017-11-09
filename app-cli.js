'use strict';

var _ = require('lodash');
var chalk = require('chalk');
var vorpal = require('vorpal')();
var util = require('util');

var log = console.log;

/**
 * Request sender CLI interface module
 *
 * @author Emil Bertilsson
 */
var AppCli = function () {

    var requestSender;

    var autoConfigureTypes = {
        form: {
            desc: "Configures the request sender to simulate a form request",
            requestOptions: {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
            },
            dataEncoder: 'querystring'
        },
        json: {
            desc: "Configures the request sender to send JSON POST requests",
            requestOptions: {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            },
            dataEncoder: 'json'
        },
        text: {
            desc: "Configures the request sender to send plain text",
            requestOptions: {
                headers: {
                    'Content-Type': 'text/plain'
                }
            },
            dataEncoder: 'text'
        },
        get: {
            desc: "Simple GET request",
            requestOptions: {
                method: 'GET'
            }
        }
    };

    /**
     * Gets the request sender options map
     *
     * @return {Object} Request sender options map
     */
    var getSenderOptionsMap = function () {
        return {
            'ignore-errors': requestSender.isIgnoringErrors(),
            'ignore-timeout': requestSender.isIgnoringTimeout(),
            'follow-redirects': requestSender.isFollowingRedirects(),
            'max-redirects': requestSender.getMaxRedirects(),
            'timeout': requestSender.getRequestTimeout(),
            'encoder': requestSender.getDataEncoder()
        };
    };

    /**
     * Prints out a map with a header
     *
     * @param {string} header Header
     * @param {Object} data Data map
     * @param {array} changed Optional, an array containing changed options
     * @param {array} removed Optional, an array containing removed options
     */
    var printMap = function (header, data, changed = [], removed = []) {
        log(chalk.white(header));
        _.forOwn(data, function (value, key) {
            if (changed !== null
                && _.indexOf(changed, key) !== -1) {
                log("\t" + chalk.green(util.format(
                    "+ %s: %s",
                    key, value
                )));
            } else {
                log("\t" + chalk.gray(util.format(
                    "%s: %s",
                    key, value
                )));
            }
        });

        _.each(removed, function (entry) {
            log("\t" + chalk.redBright(util.format(
                "- %s",
                entry
            )));
        });
    };

    /**
     * Prints out the request options
     *
     * @param {array} changed Optional, an array containing changed options
     * @param {array} removed Optional, an array containing removed options
     */
    var printRequestOptions = function (changed = [], removed = []) {
        printMap(
            "Current request options",
            _.omit(requestSender.getRequestOptions(), 'headers'),
            changed, removed
        );
    };

    /**
     * Prints out the headers
     *
     * @param {array} changed Optional, an array containing changed options
     * @param {array} removed Optional, an array containing removed options
     */
    var printHeaders = function (changed = [], removed = []) {
        printMap(
            "Current headers",
            _.omit(requestSender.getRequestOptions().headers, 'Content-Length'),
            changed, removed
        );
    };

    /**
     * Prints out the request data
     *
     * @param {array} changed Optional, an array containing changed options
     * @param {array} removed Optional, an array containing removed options
     */
    var printData = function (changed = [], removed = []) {
        printMap(
            "Request data",
            requestSender.getRequestData(),
            changed, removed
        );
    };

    /**
     * Prints out all settings
     */
    var printAll = function () {
        printSender();
        log();
        printRequestOptions();
        log();
        printHeaders();
        log();
        printData();
    };

    /**
     * Prints out the sender options
     *
     * @param {array} changed Optional, an array containing changed options
     */
    var printSender = function (changed = []) {
        printMap(
            "Request sender options",
            getSenderOptionsMap(),
            changed
        );
    };

    /**
     * Edits the request headers
     */
    var editHeaders = function (args) {
        if (args.headers.length < 2) {
            log(chalk.redBright("Error! You must specify atleast one header along with one value!"));
        } else if (args.headers.length % 2 != 0) {
            log(chalk.redBright(util.format(
                "Error! Header '%s' does not have a value!",
                _.last(args.headers)
            )));
        } else {
            var requestOptions = requestSender.getRequestOptions();
            var changed = [];

            _.each(_.chunk(args.headers, 2), function (entry) {
                requestOptions.headers[entry[0]] = entry[1];
                changed.push(entry[0]);
            });

            requestSender.setRequestOptions(requestOptions);

            log(chalk.green("Updated headers!"));
            printHeaders(changed, null);
        }
    };

    /**
     * Removes request headers
     */
    var removeHeaders = function (args) {
        var requestOptions = requestSender.getRequestOptions();
        var headers = requestOptions.headers;
        var error = false;

        _.each(args.headers, function (entry) {
            if (headers.hasOwnProperty(entry)) {
                delete requestOptions.headers[entry];
            } else {
                log(chalk.redBright(util.format(
                    "Error! Header '%s' does not exist!",
                    entry
                )));
                error = true;
            }
        });

        if (!error) {
            requestSender.setRequestOptions(requestOptions);

            log(chalk.green("Removed headers!"));
            printHeaders(null, args.headers);
        }
    };

    /**
     * Edits the request data
     */
    var editData = function (args) {
        if (args.data.length < 2) {
            log(chalk.redBright("Error! You must specify atleast one field along with one value!"));
        } else if (args.data.length % 2 != 0) {
            log(chalk.redBright(util.format(
                "Error! Field '%s' does not have a value!",
                _.last(args.data)
            )));
        } else {
            var requestData = requestSender.getRequestData();
            var changed = [];

            _.each(_.chunk(args.data, 2), function (entry) {
                requestData[entry[0]] = entry[1];
                changed.push(entry[0]);
            });

            requestSender.setRequestData(requestData);

            log(chalk.green("Updated data!"));
            printData(changed, null);
        }
    };

    /**
     * Removes request data fields
     */
    var removeData = function (args) {
        var requestData = requestSender.getRequestData();
        var error = false;

        _.each(args.fields, function (entry) {
            if (requestData.hasOwnProperty(entry)) {
                delete requestData[entry];
            } else {
                log(chalk.redBright(util.format(
                    "Error! Field '%s' does not exist!",
                    entry
                )));
                error = true;
            }
        });

        if (!error) {
            requestSender.setRequestData(requestData);

            log(chalk.green("Removed data!"));
            printData(null, args.fields);
        }
    };

    /**
     * Edits the user agent
     */
    var editUserAgent = function (args) {
        var requestOptions = requestSender.getRequestOptions();

        requestSender.setRequestOptions(_.merge(
            requestOptions,
            {
                headers: {
                    'User-Agent': args.useragent
                }
            }
        ));

        log(chalk.green(util.format(
            "Changed the user agent header to '%s'!",
            args.useragent
        )));
    };

    /**
     * Automatically configures request options based for common purposes
     */
    var autoConfigure = function (args) {
        if (!autoConfigureTypes.hasOwnProperty(args.type)) {
            log(chalk.redBright(util.format(
                "Error! Configuration '%s' does not exist!",
                args.type
            )));
        } else {
            var typeConfiguration = autoConfigureTypes[args.type];
            var requestOptions = typeConfiguration.requestOptions;
            var dataEncoder = typeConfiguration.dataEncoder;

            requestSender.setDataEncoder(dataEncoder);
            requestSender.setRequestOptions(_.merge(
                requestSender.getRequestOptions(),
                requestOptions
            ));

            log(chalk.green(util.format(
                "Configured request sender for the '%s' type!",
                args.type
            )));
        }
    };

    /**
     * Sends a single request
     */
    var sendRequest = function (args, callback) {
        requestSender.once('request-error', function () {
            if (typeof callback !== 'undefined') {
                callback();
            }
        });

        requestSender.once('request-success', function () {
            if (typeof callback !== 'undefined') {
                callback();
            }
        });

        requestSender.once('request-fail', function () {
            if (typeof callback !== 'undefined') {
                callback();
            }
        });

        if (!args.hasOwnProperty('data')) {
            requestSender.autoSendRequest();
        } else {
            if (args.data.length < 2) {
                log(chalk.redBright("Error! You must specify atleast one field of data along with one value!"));
                callback();
            } else if (args.data.length % 2 != 0) {
                log(chalk.redBright(util.format(
                    "Error! Field '%s' does not have a value!",
                    _.last(data)
                )));
                callback();
            } else {
                var requestData = {};

                _.each(_.chunk(args.data, 2), function (entry) {
                    requestData[entry[0]] = entry[1];
                });

                requestSender.sendRequest(requestData);
            }
        }
    };

    /**
     * Starts the repeater
     */
    var startRepeater = function (args, callback) {
        requestSender.once('repeater-stop', function () {
            if (typeof callback !== 'undefined') {
                callback();
            }
        });

        var interval = Number(args.interval);
        var count = 0;

        if (args.hasOwnProperty('count')) {
            count = Number(args.count);
        }

        console.log(chalk.green("Press Ctrl+C to stop the repeater"));
        requestSender.startRepeater(interval, count);

        process.prependOnceListener('SIGINT', function () {
            requestSender.stopRepeater();
        });
    };

    /**
     * Edits the request options
     */
    var editOptions = function (args) {
        if (!_.keys(args.options).length) {
        } else {
            var requestOptions = _.merge(
                requestSender.getRequestOptions(),
                args.options
            );

            requestOptions.port = Number(requestOptions.port);

            log(chalk.green("Updated request options!"));
            printRequestOptions(_.keys(args.options), null);
        }
    };

    /**
     * Edits the request sender settings
     */
    var editSender = function (args) {
        var options = args.options;
        var changed = [];

        if (options.hasOwnProperty('encoder')) {
            var validEncoders = requestSender.getValidEncoders();
            var encoder = options['encoder'];

            if (_.indexOf(validEncoders, encoder) !== -1) {
                requestSender.setDataEncoder(encoder);
                changed.push('encoder');
            } else {
                log(chalk.red(util.format(
                    "Error! Encoder '%s' does not exist!",
                    encoder
                )));
                return;
            }
        }

        if (options.hasOwnProperty('ignore-errors')) {
            requestSender.setIgnoreErrors(options['ignore-errors']);
            changed.push('ignore-errors');
        }

        if (options.hasOwnProperty('ignore-timeout')) {
            requestSender.setIgnoreTimeout(options['ignore-timeout']);
            changed.push('ignore-timeout');
        }

        if (options.hasOwnProperty('follow-redirects')) {
            requestSender.setFollowRedirects(options['follow-redirects']);
            changed.push('follow-redirects');
        }

        if (options.hasOwnProperty('timeout')) {
            requestSender.setRequestTimeout(Number(options['timeout']));
            changed.push('timeout');
        }

        if (options.hasOwnProperty('max-redirects')) {
            requestSender.setMaxRedirects(Number(options['max-redirects']));
            changed.push('max-redirects');
        }

        log(chalk.green("Edited the sender settings!"));
        printSender(changed);
    };

    /**
     * Initializes commands
     *
     * @param {RequestSender} requestSender Request sender
     */
    var initCommands = function () {
        // Edit request options
        vorpal
            .command('editoptions', "Edits the basic request options")
            .option('--host <host>', 'Target hostname')
            .option('--method <method>', 'Request method', [
                'GET', 'HEAD', 'POST', 'PUT', 'DELETE',
                'CONNECT', 'OPTIONS', 'TRACE', 'PATCH'
            ])
            .option('--port <port>', 'Request port')
            .option('--path <path>', 'Request path')
            .types({
                string: ['host', 'method', 'path', 'port']
            })
            .action(function (args, callback) {
                editOptions(args);
                callback();
            });

        // Edit headers
        vorpal
            .command(
                'editheaders <headers...>',
                "Edits or adds request headers. Example: editheaders \'Content-Type\' \'application/json\' \'User-Agent\' \'The mighty ragnarok!\'"
            )
            .action(function (args, callback) {
                editHeaders(args);
                callback();
            });

        // Remove headers
        vorpal
            .command(
                'removeheaders <headers...>',
                "Removes the given request headers. Example: removeheaders \'Content-Type\' \'User-Agent\'"
            )
            .action(function (args, callback) {
                removeHeaders(args);
                callback();
            });

        // Edit sender options
        var encoderDescText = "Sets the encoder to use while writing data"
            + "\r\n\r\n  Type can be either of the below:";

        _.each(requestSender.getValidEncoders(), function (entry) {
            encoderDescText += util.format("\r\n\t%s", entry);
        });

        vorpal
            .command('editsender', "Edits the request sender settings")
            .option('--ignore-errors', 'Makes the repeater continue sending requests even if it should encounter a HTTP error (Does not apply to request errors). This is disabled by default')
            .option('--no-ignore-errors', 'Stops the repeater in case of HTTP error. This is enabled by default')
            .option('--ignore-timeout', 'Makes the repeater continue sending requests even if it should encounter a request timeout. This is enabled by default.')
            .option('--no-ignore-timeout', 'Stops the repeater in case of request timeout. This is disabled by default.')
            .option('--follow-redirects', 'Enables following redirects when sending requests. Default is to enable redirects')
            .option('--no-follow-redirects', 'Disables following redirects when sending requests. Default is to enable redirects')
            .option('--max-redirects <redirects>', "Sets the maximum allowed redirects of the sender (Provided that following redirects are allowed)")
            .option('--timeout <timeout>', "Sets the request timeout (in milliseconds)")
            .option('--encoder <encoder>', encoderDescText)
            .action(function (args, callback) {
                editSender(args);
                callback();
            });

        // Edits the request data
        vorpal
            .command(
                'editdata <data...>',
                "Edits or adds request data fields. Example: editdata username 'test123' password 'test123'"
            )
            .action(function (args, callback) {
                editData(args);
                callback();
            });

        // Removes request data fields
        vorpal
            .command(
                'removedata <fields...>',
                "Removes the given request data fields. Example: removeheaders username password"
            )
            .action(function (args, callback) {
                removeData(args);
                callback();
            });

        // Edits the user agent
        vorpal
            .command(
                'edituseragent <useragent>',
                "Sets the user agent header to the given value"
            )
            .action(function (args, callback) {
                editUserAgent(args);
                callback();
            });

        // Autoconfigure
        var autoconfDescText = "Automatically configures request sender for common purposes"
            + "\r\n\r\n  Type can be either of the below:";

        _.forOwn(autoConfigureTypes, function (value, key) {
            autoconfDescText += util.format("\r\n\t%s - %s", key, value.desc);
        });

        vorpal
            .command(
                'autoconfigure <type>',
                autoconfDescText
            )
            .action(function (args, callback) {
                autoConfigure(args);
                callback();
            });

        // Sends a single request
        vorpal
            .command(
                'sendrequest [data...]',
                "Sends a single request with either automatically generated data, or with the given data. Example: sendrequest username 'test' password 'test'"
            )
            .action(function (args, callback) {
                sendRequest(args, callback);
            });

        // Starts request repeater
        vorpal
            .command(
                'startrepeater <interval> [count]',
                "Starts the request repeater with the given interval (in milliseconds). If count is not set, it will run indefinitely until terminated."
            )
            .action(function (args, callback) {
                startRepeater(args, callback);
            });

        // Print request options
        vorpal
            .command(
                'printoptions',
                "Prints out the request options"
            )
            .action(function (args, callback) {
                printRequestOptions();
                callback();
            });

        // Print request headers
        vorpal
            .command(
                'printheaders',
                "Prints out the request headers"
            )
            .action(function (args, callback) {
                printHeaders();
                callback();
            });

        // Print the request sender settings
        vorpal
            .command(
                'printsender',
                "Prints out the request sender options"
            )
            .action(function (args, callback) {
                printSender();
                callback();
            });

        // Print the request data
        vorpal
            .command(
                'printdata',
                "Prints out the request data"
            )
            .action(function (args, callback) {
                printData();
                callback();
            });

        // Print all the data
        vorpal
            .command(
                'printall',
                "Prints out all settings"
            )
            .action(function (args, callback) {
                printAll();
                callback();
            });
    };

    /**
     * Initializes the request sender listeners
     */
    var initListeners = function () {
        requestSender.on('request-start', function (data, requestOptions) {
            var logText = chalk.whiteBright(
                "Attempting to send "
                + requestOptions.method
                + " request to "
                + requestSender.getFullRequestPath()
            );
            var hasData = _.keys(data).length !== 0;

            if (hasData) {
                logText += chalk.whiteBright(" with data:");
            } else {
                logText += chalk.whiteBright(" without data");
            }

            log(logText);

            if (hasData) {
                _.forOwn(data, function (value, key) {
                    log(chalk.gray("\t" + key + ": " + value));
                });
            };
        });

        requestSender.on('request-error', function (err, requestOptions) {
            if (err.code == "ECONNRESET") {
                log(
                    chalk.red("Request timed out or aborted")
                    + "\r\n"
                );
            } else {
                log(
                    chalk.red("Request error (" + err.code + ")")
                    + "\r\n"
                );
            }
        });

        requestSender.on('request-success', function (data, res, requestOptions) {
            if (res.statusCode === 200) {
                log(
                    chalk.green("Request successfully sent! (Recieved 200 status)")
                    + "\r\n"
                );
            } else {
                log(
                    chalk.yellowBright(
                        "Request sent, but recieved "
                        + res.statusCode
                        + " status"
                        + " (" + res.statusMessage + ")"
                    )
                    + "\r\n"
                );
            }
        });

        requestSender.on('request-fail', function (data, res, requestOptions) {
            log(
                chalk.red(
                    "Request failed! Recieved "
                    + res.statusCode
                    + " status"
                    + " (" + res.statusMessage + ")"
                )
                + "\r\n"
            );
        });

        requestSender.on('repeater-start', function (rInterval, count) {
            if (count === 0) {
                log(
                    chalk.whiteBright(
                        "Starting request repeater with indefinite repetitions"
                        + " (" + rInterval + "ms interval)"
                    )
                    + "\r\n"
                );
            } else {
                log(
                    chalk.whiteBright(
                        "Starting request repeater with " + count + " repetitions"
                        + " (" + rInterval + "ms interval)"
                    )
                    + "\r\n"
                );
            }
        });

        requestSender.on('repeater-stop', function (successCount, failCount) {
            log(
                chalk.whiteBright("Stopped request repeater")
                + "\r\n" + chalk.gray("\tSuccess count:\t" + successCount)
                + "\r\n" + chalk.gray("\tFail count:\t" + failCount)
            );
        });
    };

    /**
     * Initializes the CLI interface with the given request sender
     *
     * @param {RequestSender} sender Request sender
     */
    var init = function (sender) {
        requestSender = sender;

        initCommands();
        initListeners();

        log("Type 'help' for command usage");

        vorpal
            .delimiter('Node Request Sender > ')
            .show();
    };

    return {
        init: init
    };

};

module.exports = AppCli;
