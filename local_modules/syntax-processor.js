'use strict';

/**
 * Text syntax processor
 *
 * @author Emil Bertilsson
 */
var SyntaxProcessor = function () {

    var REGEX_FUNCTION = /\$(\w+)\(([^\(\)]*)\)/;
    var REGEX_ARG = /(\'[^\']*\'|\d+)\,?\s*/g;
    var REGEX_STR = /\'([^\']*)\'/g;
    var VALID_CHARS = "abcdefghijklmnopqrstuvwxyz";
    var VALID_DIGITS = "1234567890";
    var VALID_MAILDOMAINS = [
        "aol.com", "att.net", "comcast.net", "facebook.com", "gmail.com", "gmx.com", "googlemail.com",
        "google.com", "hotmail.com", "hotmail.co.uk", "mac.com", "me.com", "mail.com", "msn.com",
        "live.com", "sbcglobal.net", "verizon.net", "yahoo.com", "yahoo.co.uk"
    ];

    var extensions = {
        str: {
            args: 2,
            doc: {
                description: "Generates a random character sequence of desired length",
                args: [
                    { name: 'min',
                        type: "number",
                        desc: "Minimum length" },
                    { name: 'max',
                        type: "number",
                        desc: "Maximum length" }
                ],
                sampleUsage: "$str(5,7) generates a random character sequence between 5-7 characters"
            },
            callback: function (min, max) {
                var result = "";
                var strLen = getRandomLength(min, max);

                for (var i = 0; i < strLen; i++) {
                    result += getRandomElement(VALID_CHARS);
                }

                return result;
            }
        },

        num: {
            args: 2,
            doc: {
                description: "Generates a random number sequence of desired length",
                args: [
                    { name: 'min',
                        type: "number",
                        desc: "Minimum length" },
                    { name: 'max',
                        type: "number",
                        desc: "Maximum length" }
                ],
                sampleUsage: "$num(2,3) generates a random number sequence between 2-3 digits"
            },
            callback: function (min, max) {
                var result = "";
                var strLen = getRandomLength(min, max);

                for (var i = 0; i < strLen; i++) {
                    result += getRandomElement(VALID_DIGITS);
                }

                return result;
            }
        },

        text: {
            args: 'var',
            doc: {
                description: "Picks a random text element from a list of texts",
                sampleUsage: "$text('text1', 'text2', 'text3') picks a random text from the list, text2 for example"
            },
            callback: function () {
                return getRandomElement(arguments);
            }
        },

        mail: {
            args: 0,
            doc: {
                description: "Generates a random mail domain",
                sampleUsage: "$mail() generates a random mail domain, gmail.com for example"
            },
            callback: function () {
                return getRandomElement(VALID_MAILDOMAINS);
            }
        }
    };

    /**
     * Gets the extensions
     */
    var getExtensions = function () {
        return extensions;
    };

    /**
     * Returns a random element from an array
     *
     * @param {array} arr Data array
     * @return {string} Random element
     */
    var getRandomElement = function (arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    };

    /**
     * Returns a random length between the given interval
     *
     * @param {number} min Minimum length
     * @param {number} max Maximum length
     * @return {number} Random length
     */
    var getRandomLength = function (min, max) {
        return min + Math.floor(Math.random() * (max - min));
    };

    /**
     * Replaces a string range with a substitute
     *
     * @param {string} str Input string
     * @param {number} start Start index
     * @param {number} end End index
     * @param {string} substitute Substitute string
     * @return {string} Output string
     */
    var replaceRange = function (str, start, end, substitute) {
        return str.substring(0, start) + substitute + str.substring(end);
    };

    /**
     * processes an extension with the given arguments and returns the result
     *
     * @param {string} func Function name
     * @param {array} args Function arguments
     * @return {string} Output string
     */
    var processExtension = function (func, args) {
        if (!extensions.hasOwnProperty(func)) {
            return null;
        } else {
            var extension = extensions[func];

            if (args.length !== extension.args && extension.args !== "var") {
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
    var processSyntax = function (str) {
        var result = str;
        var fMatch, aMatch, asMatch, fText,
            fIndex, func, argStr, arg, funcResult;
        var args = [];

        while ((fMatch = REGEX_FUNCTION.exec(result)) !== null) {
            fText = fMatch[0];
            fIndex = result.indexOf(fText);
            func = fMatch[1];

            while ((aMatch = REGEX_ARG.exec(fMatch[2])) !== null) {
                argStr = aMatch[1];

                if (argStr.match(REGEX_STR) !== null) {
                    arg = argStr.replace(/\'/g, "");
                } else {
                    arg = Number(argStr);
                }

                args.push(arg);
            }

            if ((funcResult = processExtension(func, args)) !== null) {
                result = replaceRange(result, fIndex, fIndex + fText.length, funcResult);
            }

            args = [];
        };

        return result;
    };

    return {
        getExtensions: getExtensions,
        processSyntax: processSyntax
    };

};

module.exports = SyntaxProcessor();
