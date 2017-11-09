'use strict';

var SyntaxProcessor = require("./syntax-processor.js");
var RequestDataEncoder = require("./request-data-encoder.js");

var _ = require("lodash");
var http = require("follow-redirects").http;

/**
 * Request sender class
 *
 * @author Emil Bertilsson
 */
var RequestSender = function () {

    var HTTP_ERROR_CODES = [
        400, 401, 403, 404, 405,
        500, 502, 503, 504
    ];

    var lockRequests = false,
        intervalID = null,
        successCount = 0,
        failCount = 0,
        isRepeating = false,
        ignoreErrors = false,
        ignoreTimeout = true,
        requestTimeout = 5000,
        dataEncoderType = "querystring",
        followRedirects = true,
        maxRedirects = 10;

    var requestData = {};

    var listeners = [];

    var requestOptions = {
        host: "",
        method: "GET",
        port: 80,
        path: "/",
        headers: {}
    };

    /**
     * Adds an event listener to the request sender
     *
     * @param {string} message Event message
     * @param {function} callback Callback function
     */
    var addEventListener = function (message, callback) {
        listeners.push({
            message: message,
            callback: callback
        });
    };

    /**
     * Calls all listeners with the given arguments
     *
     * @param {string} message Event message
     * @param {array} args Event arguments
     */
    var callListeners = function (message, args) {
        _.each(listeners, function (entry) {
            if (entry.message === message) {
                entry.callback.apply(null, args);
            }
        });
    };

    /**
     * Creates a listener for the given message
     */
    var on = function (message, callback) {
        addEventListener(message, callback);
    };

    /**
     * Sets the data encoder for the requests
     *
     * @param {string} encoder Data encoder type
     * @return {boolean} True if the encoder exists, otherwise false
     */
    var setDataEncoder = function (encoder) {
        if (RequestDataEncoder.encoderExists(encoder)) {
            dataEncoderType = encoder;
            return true;
        } else {
            return false;
        }
    };

    /**
     * Sets the current request options
     *
     * @param {Object} options Request options
     */
    var setRequestOptions = function (options) {
        _.assign(requestOptions, options);
    };

    /**
     * Gets the current request options
     *
     * @return {Object} Request options
     */
    var getRequestOptions = function () {
        return requestOptions;
    };

    /**
     * Sets the request timeout for the repeater
     *
     * @param {number} timeout Request timeout
     */
    var setRequestTimeout = function (timeout) {
        requestTimeout = timeout;
    };

    /**
     * Gets the request timeout for the repeater
     *
     * @return {number} Request timeout
     */
    var getRequestTimeout = function () {
        return requestTimeout;
    };

    /**
     * Sets the maximum request redirects
     *
     * @param {number} max Max redirects
     */
    var setMaxRedirects = function (max) {
        maxRedirects = max;
    };

    /**
     * Gets the maximum request redirects
     *
     * @return {number} Request timeout
     */
    var getMaxRedirects = function () {
        return maxRedirects;
    };

    /**
     * Sets whether to follow redirects on the requests
     *
     * @param {number} value Follow redirects
     */
    var setFollowRedirects = function (value) {
        followRedirects = value;
    };

    /**
     * Sets the request data for the repeater
     *
     * @param {Object} data Request data
     */
    var setRequestData = function (data) {
        requestData = data;
    };

    /**
     * Gets the request data for the repeater
     *
     * @return {Object} Request data
     */
    var getRequestData = function () {
        return requestData;
    };

    /**
     * Gets the success count
     *
     * @return {number} Success count
     */
    var getSuccessCount = function () {
        return successCount;
    };

    /**
     * Gets the failure count
     *
     * @return {number} Failure count
     */
    var getFailCount = function () {
        return failCount;
    };

    /**
     * Returns whether new requests are locked from occuring
     *
     * @return {boolean} True if locked, otherwise false
     */
    var isRequestLocked = function () {
        return lockRequests;
    };

    /**
     * Returns whether the requester is repeating
     *
     * @return {boolean} True if repeating, otherwise false
     */
    var isRequestRepeating = function () {
        return isRepeating;
    };

    /**
     * Gets the full request path
     *
     * @return {string} Full request path
     */
    var getFullRequestPath = function () {
        var path = requestOptions.path;

        if (path[0] !== "/") {
            path = "/" + path;
        }

        return requestOptions.host
            + ":" + requestOptions.port
            + path;
    };

    /**
     * Sets whether to ignore errors, whether to terminate
     * the repeater on a HTTP error code
     *
     * @param {boolean} value Ignore errors
     */
    var setIgnoreErrors = function (value) {
        ignoreErrors = value;
    };

    /**
     * Sets whether to ignore timeouts, whether to terminate
     * the repeater on a timeout
     *
     * @param {boolean} value Ignore timeout
     */
    var setIgnoreTimeout = function (value) {
        ignoreTimeout = value;
    };

    /**
     * Returns whether the repeater is currently ignoring
     * HTTP error codes
     *
     * @return {boolean} True if errors are ignored, otherwise false
     */
    var isIgnoringErrors = function () {
        return ignoreErrors;
    };

    /**
     * Returns whether the repeater is currently ignoring
     * timeouts
     *
     * @return {boolean} True if timeouts are ignored, otherwise false
     */
    var isIgnoringTimeout = function () {
        return ignoreTimeout;
    };

    /**
     * Attempts to send a request with the given data
     *
     * @param {Object} data Data map
     */
    var sendRequest = function (data) {
        if (lockRequests) {
            return;
        }

        lockRequests = true;

        callListeners("request-start", [data, requestOptions]);
        var writeData = "";

        if (_.keys(data).length > 0) {
            var writeData = RequestDataEncoder.encode(
                dataEncoderType,
                data
            );
        }

        var fixedRequestOptions = _.merge(
            requestOptions,
            {
                followAllRedirects: followRedirects,
                maxRedirects: maxRedirects,
                headers: {
                    "Content-Length": Buffer.byteLength(writeData)
                }
            }
        );

        var request = http.request(
            fixedRequestOptions,
            function (res) {
                if (_.indexOf(HTTP_ERROR_CODES, res.statusCode) !== -1) {
                    failCount++;
                    callListeners("request-fail", [data, res, requestOptions]);

                    if (isRepeating && !ignoreErrors) {
                        stopRepeater();
                    }
                } else {
                    successCount++;
                    callListeners("request-success", [data, res, requestOptions]);
                }

                lockRequests = false;
            }
        );

        if (writeData.length) {
            request.write(writeData);
        }

        request.on('error', function (err) {
            failCount++;
            callListeners("request-error", [err, requestOptions]);

            // Stop the repeater only if the resource was not found
            if (isRepeating && err.code == "ENOTFOUND") {
                stopRepeater();
            }

            lockRequests = false;
        });

        request.on('socket', function (socket) {
            if (requestTimeout !== 0) {
                socket.setTimeout(requestTimeout);
                socket.on('timeout', function () {
                    request.abort();

                    if (isRepeating && !ignoreTimeout) {
                        setTimeout(stopRepeater, 1);
                    }
                });
            }
        });

        request.end();
    };

    /**
     * Attempts to send an automatic request based on the given
     * request options
     */
    var autoSendRequest = function () {
        if (lockRequests) {
            return;
        }

        var data = {};

        _.forOwn(requestData, function (value, key) {
            data[key] = SyntaxProcessor.processSyntax(value);
        });

        sendRequest(data);
    };

    /**
     * Starts the request repeater
     *
     * @param {number} rInterval Interval (in milliseconds)
     * @param {number} count Repeat count
     */
    var startRepeater = function (rInterval = 1000, count = 0) {
        isRepeating = true;
        var requestCount = 0;

        intervalID = setInterval(
            function () {
                if (lockRequests) {
                    return;
                }

                if (count > 0) {
                    if (requestCount < count) {
                        autoSendRequest();
                        requestCount++;
                    } else {
                        stopRepeater();
                    }
                } else {
                    autoSendRequest();
                }
            },
            rInterval
        );

        callListeners("repeater-start", [rInterval, count]);
    };

    /**
     * Stops the request repeater
     */
    var stopRepeater = function () {
        if (intervalID !== null) {
            isRepeating = false;

            clearInterval(intervalID);

            callListeners("repeater-stop", [successCount, failCount]);

            successCount = 0;
            failCount = 0;
        }
    };

    return {
        setRequestOptions: setRequestOptions,
        setRequestData: setRequestData,
        setRequestTimeout: setRequestTimeout,
        setMaxRedirects: setMaxRedirects,
        setDataEncoder: setDataEncoder,
        setIgnoreTimeout: setIgnoreTimeout,
        setIgnoreErrors: setIgnoreErrors,
        setIgnoreTimeout: setIgnoreTimeout,
        setFollowRedirects: setFollowRedirects,

        getRequestOptions: getRequestOptions,
        getRequestData: getRequestData,
        getRequestTimeout: getRequestTimeout,
        getMaxRedirects: getMaxRedirects,
        getSuccessCount: getSuccessCount,
        getFailCount: getFailCount,
        getFullRequestPath: getFullRequestPath,

        isIgnoringErrors: isIgnoringErrors,
        isIgnoringTimeout: isIgnoringTimeout,
        isRequestLocked: isRequestLocked,
        isRequestRepeating: isRequestRepeating,

        on: on,

        sendRequest: sendRequest,
        autoSendRequest: autoSendRequest,
        startRepeater: startRepeater,
        stopRepeater: stopRepeater,
    };

};

module.exports = RequestSender;
