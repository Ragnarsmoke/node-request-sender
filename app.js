'use strict';

var RequestSender = require('./local_modules/request-sender');
var RequestSenderTester = require('./tests/request-sender-tester.js')();
var _ = require("lodash");

var requestSender = RequestSender();

requestSender.on("request-start", function (data, requestOptions) {
    var logText = "Attempting to send "
        + requestOptions.method
        + " request to "
        + requestSender.getFullRequestPath();
    var hasData = _.keys(data).length !== 0;

    if (hasData) {
        logText += " with data:";
    } else {
        logText += " without data";
    }

    console.log(logText);

    if (hasData) {
        _.forOwn(data, function (value, key) {
            console.log("\t" + key + ": " + value);
        });
    };
});

requestSender.on("request-error", function (err, requestOptions) {
    if (err.code == "ECONNRESET") {
        console.log(
            "Request timed out or aborted"
            + "\r\n"
        );
    } else {
        console.log(
            "Request error (" + err.code + ")"
            + "\r\n"
        );
    }
});

requestSender.on("request-success", function (data, res, requestOptions) {
    if (res.statusCode === 200) {
        console.log(
            "Request successfully sent! (Recieved 200 status)"
            + "\r\n"
        );
    } else {
        console.log(
            "Request sent, but recieved "
            + res.statusCode
            + " status"
            + " (" + res.statusMessage + ")"
            + "\r\n"
        );
    }
});

requestSender.on("request-fail", function (data, res, requestOptions) {
    console.log(
        "Request failed! Recieved "
        + res.statusCode
        + " status"
        + " (" + res.statusMessage + ")"
        + "\r\n"
    );
});

requestSender.on("repeater-start", function (rInterval, count) {
    if (count === 0) {
        console.log(
            "Starting request repeater with indefinite repetitions"
            + " (" + rInterval + "ms interval)"
            + "\r\n"
        );
    } else {
        console.log(
            "Starting request repeater with " + count + " repetitions"
            + " (" + rInterval + "ms interval)"
            + "\r\n"
        );
    }
});

requestSender.on("repeater-stop", function (successCount, failCount) {
    console.log("Stopped request repeater");
    console.log("\tSuccess count:\t" + successCount);
    console.log("\tFail count:\t" + failCount);
});

RequestSenderTester.startTester(requestSender);
