// JavaScript request sender script
// By Emil Bertilsson 2017
'use strict';

var requestSender = {
    successCount: 0,
    failCount: 0,
    lockRequests: false,
    intervalID: null
};

/*****************************/
/* Request settings          */
/*****************************/

requestSender.REQUEST_SETTINGS = {
    // Request URL
    url: "",

    // Request type
    type: "POST",

    // Custom headers
    headers: {
        "Content-Type": "application/x-www-form-urlencoded"
    },

    // Request data
    requestData: {
    }
};

/*****************************/
/* Extension/syntax settings */
/*****************************/

requestSender.VALID_CHARS		= "abcdefghijklmnopqrstuvwxyz";
requestSender.VALID_DIGITS		= "1234567890";
requestSender.VALID_MAILDOMAINS	= [
    "aol.com", "att.net", "comcast.net", "facebook.com", "gmail.com", "gmx.com", "googlemail.com",
    "google.com", "hotmail.com", "hotmail.co.uk", "mac.com", "me.com", "mail.com", "msn.com",
    "live.com", "sbcglobal.net", "verizon.net", "yahoo.com", "yahoo.co.uk"
];

/**
 * Returns a random element from an array
 *
 * @param {array} arr Data array
 * @return {string} Random element
 */
requestSender.getRandomElement = function(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
};

/**
 * Returns a random length between the given interval
 *
 * @param {number} min Minimum length
 * @param {number} max Maximum length
 * @return {number} Random length
 */
requestSender.getRandomLength = function(min, max) {
    return min + Math.floor(Math.random() * (max - min));
};

// Text extensions
requestSender.extensions = {
    // Random text sequence generator
    // Usage: $str(minLength,maxLength)
    str: {
        args: 2,
        callback: function(min, max) {
            var result = "";
            var strLen = requestSender.getRandomLength(min, max);

            for (var i = 0; i < strLen; i++) {
                result += requestSender.getRandomElement(requestSender.VALID_CHARS);
            }

            return result;
        }
    },

    // Random number sequence generator
    // Usage: $num(minLength,maxLength)
    num: {
        args: 2,
        callback: function(min, max) {
            var result = "";
            var strLen = requestSender.getRandomLength(min, max);

            for (var i = 0; i < strLen; i++) {
                result += requestSender.getRandomElement(requestSender.VALID_DIGITS);
            }

            return result;
        }
    },

    // Random text selector
    // Usage: $text('text1', 'text2', ...)
    text: {
        args: "var",
        callback: function() {
            return requestSender.getRandomElement(arguments);
        }
    },

    // Random mail domain selector
    // Usage: $mail()
    mail: {
        args: 0,
        callback: function() {
            return requestSender.getRandomElement(requestSender.VALID_MAILDOMAINS);
        }
    }
};

/*****************************/
/* Syntax processor         */
/*****************************/

requestSender.REGEX_FUNCTION	= /\$(\w+)\(([^\(\)]*)\)/;
requestSender.REGEX_ARG			= /(\'[^\']*\'|\d+)\,?\s*/g
requestSender.REGEX_STR			= /\'([^\']*)\'/g;

/**
 * Replaces a string range with a substitute
 *
 * @param {string} str Input string
 * @param {number} start Start index
 * @param {number} end End index
 * @param {string} substitute Substitute string
 * @return {string} Output string
 */
requestSender.replaceRange = function(str, start, end, substitute) {
    return str.substring(0, start) + substitute + str.substring(end);
};

/**
 * processes an extension with the given arguments and returns the result
 *
 * @param {string} func Function name
 * @param {array} args Function arguments
 * @return {string} Output string
 */
requestSender.processExtension = function(func, args) {
    if (!requestSender.extensions.hasOwnProperty(func)) {
        console.log("Request sender error: Extension '" + func + "' does not exist!");
        return null;
    } else {
        var extension = requestSender.extensions[func];

        if (args.length !== extension.args && extension.args !== "var") {
            console.log(
                "Request sender error: Extension '" + func
                + "' requires " + extension.args + " arguments!"
            );
            return null;
        } else {
            var result = extension.callback.apply(null, args);
            return result;
        }
    }
};

/**
 * Processes an input syntax
 *
 * @param {string} str Input syntax
 * @return {string} Output string
 */
requestSender.processSyntax = function(str) {
    var result = str;
    var fMatch, aMatch, asMatch, fText,
        fIndex, func, argStr, arg, funcResult;
    var args = [];

    while ((fMatch = requestSender.REGEX_FUNCTION.exec(result)) !== null) {
        fText = fMatch[0];
        fIndex = result.indexOf(fText);
        func = fMatch[1];

        while ((aMatch = requestSender.REGEX_ARG.exec(fMatch[2])) !== null) {
            argStr = aMatch[1];

            if (argStr.match(requestSender.REGEX_STR) !== null) {
                arg = argStr.replace(/\'/g, "");
            } else {
                arg = Number(argStr);
            }

            args.push(arg);
        }

        if ((funcResult = requestSender.processExtension(func, args)) !== null) {
            result = requestSender.replaceRange(result, fIndex, fIndex + fText.length, funcResult);
        }

        args = [];
    };

    return result;
};

/*****************************/
/* Request sender            */
/*****************************/

/**
 * Encodes the input data
 *
 * @param {Object} data Data map
 * @return {string} Encoded data
 */
requestSender.urlEncodeData = function(data) {
    var result = "";
    var i = 0;

    for (var key in data) {
        if (!data.hasOwnProperty(key)) {
            continue;
        }

        if (i !== 0) {
            result += "&";
        }

        result += key + "=" + encodeURIComponent(data[key]);
        i++;
    }

    return result;
};

/**
 * Neatly prints out a data map
 *
 * @param {Object} data Data map
 */
requestSender.printData = function(data) {
    for (var key in data) {
        console.log("\t" + key + ": " + data[key]);
    }
};

/**
 * Attempts to send a request with the given data
 *
 * @param {Object} data Data map
 */
requestSender.sendRequest = function(data) {
    if (requestSender.lockRequests) {
        return;
    }

    requestSender.lockRequests = true;

    var settings = requestSender.REQUEST_SETTINGS;

    console.log("Attempting to send request to '" + settings.url + "' with data:");
    requestSender.printData(data);

    var xhr = new XMLHttpRequest();
    xhr.open(settings.type, settings.url, true);

    for (var key in settings.headers) {
        if (!settings.headers.hasOwnProperty(key)) {
            continue;
        }

        xhr.setRequestHeader(key, settings.headers[key]);
    }

    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                requestSender.successCount++;
                console.log(
                    "Success! Recieved HTTP 200 status! Success count: "
                    + requestSender.successCount
                );
            } else {
                requestSender.failCount++;
                console.log(
                    "Error! Recieved HTTP " + xhr.status + " status! Fail count: "
                    + requestSender.failCount
                );
            }

            console.log("\r\n");
            requestSender.lockRequests = false;
        }
    };

    xhr.send(requestSender.urlEncodeData(data));
};

/**
 * Attempts to send an automatic request based on the given settings
 */
requestSender.autoSendRequest = function() {
    if (reqeustSender.lockRequests) {
        return;
    }

    var requestData = requestSender.REQUEST_SETTINGS.requestData;
    var data = {};

    for (var key in requestData) {
        if (!requestData.hasOwnProperty(key)) {
            continue;
        }

        data[key] = requestSender.processSyntax(requestData[key]);
    }

    requestSender.sendRequest(data);
};

/**
 * Starts the request spammer
 *
 * @param {number} rInterval Interval (in milliseconds)
 */
requestSender.startSpammer = function(rInterval) {
    console.log(
        "Starting request spammer with an interval of "
        + rInterval + " milliseconds!"
    );
    console.log("------------------------------------------\r\n")

    requestSender.intervalID = setInterval(
        requestSender.autoSendRequest,
        rInterval
    );
};

/**
 * Stops the request spammer
 */
requestSender.stopSpammer = function() {
    if (requestSender.intervalID === null) {
        console.log("Request spammer is not active");
    } else {
        clearInterval(requestSender.intervalID);

        console.log("Stopped request spammer");
        console.log("\tSuccess count:\t" + requestSender.successCount);
        console.log("\tFail count:\t" + requestSender.failCount);

        requestSender.successCount = 0;
        requestSender.failCount = 0;
    }
};
