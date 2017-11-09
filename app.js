'use strict';

var RequestSender = require('./local_modules/request-sender');
var RequestSenderTester = require('./tests/request-sender-tester.js')();
var _ = require("lodash");
var chalk = require("chalk");

var log = console.log;

var requestSender = RequestSender();

requestSender.on("request-start", function (data, requestOptions) {
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

requestSender.on("request-error", function (err, requestOptions) {
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

requestSender.on("request-success", function (data, res, requestOptions) {
    if (res.statusCode === 200) {
        log(
            chalk.greenBright("Request successfully sent! (Recieved 200 status)")
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

requestSender.on("request-fail", function (data, res, requestOptions) {
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

requestSender.on("repeater-start", function (rInterval, count) {
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

requestSender.on("repeater-stop", function (successCount, failCount) {
    log(
        chalk.whiteBright("Stopped request repeater")
        + "\r\n" + chalk.gray("\tSuccess count:\t" + successCount)
        + "\r\n" + chalk.gray("\tFail count:\t" + failCount)
    );
});

RequestSenderTester.startTester(requestSender);
