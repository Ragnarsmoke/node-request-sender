'use strict';

/**
 * Request sender tester module
 *
 * @author Emil Bertilsson
 */
var RequestSenderTester = function () {

    /**
     * Sets up the base configuration for the request sender
     *
     * @param {RequestSender} requestSender Request sender
     */
    var configureBase = function (requestSender) {
        requestSender.setRequestTimeout(10000);
        requestSender.setIgnoreErrors(true);
        requestSender.setIgnoreTimeout(false);
        requestSender.setDataEncoder("querystring");
        requestSender.setFollowRedirects(true);
        requestSender.setMaxRedirects(10);

        requestSender.setRequestOptions({
            host: "requestb.in",
            method: "POST",
            path: "/",
            headers: {
                "User-Agent": "node-request-sender",
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        requestSender.setRequestData({
            email: "$str(5,7)$num(2,3)@$mail()",
            password: "$str(5,7)$num(2,3)"
        });
    };

    /**
     * Starts the request sender tester
     *
     * @param {RequestSender} requestSender Request sender
     */
    var startTester = function (requestSender) {
        configureBase(requestSender);
        requestSender.startRepeater(1000, 1);
    };

    return {
        startTester: startTester
    };

};

module.exports = RequestSenderTester;
