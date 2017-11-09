'use strict';

var _ = require('lodash');
var querystring = require('querystring');

/**
 * Request data encoder class
 *
 * @author Emil Bertilsson
 */
var RequestDataEncoder = function () {

    var encoders = {
        // URL format encoder
        querystring: {
            encode: function (data) {
                return querystring.stringify(data);
            }
        },

        // JSON format encoder
        json: {
            encode: function (data) {
                return JSON.stringify(data);
            }
        },

        // Plain text encoder
        text: {
            encode: function (data) {
                if (data.hasOwnProperty('text')) {
                    return data.text;
                } else {
                    return "";
                }
            }
        }
    };

    /**
     * Returns whether the given encoder exists
     *
     * @return {boolean} True if the encoder exists, otherwise false
     */
    var encoderExists = function (type) {
        return encoders.hasOwnProperty(type);
    };

    /**
     * Gets the valid data encoders
     *
     * @return {array} Valid data encoders
     */
    var getValidEncoders = function () {
        return _.keys(encoders);
    };

    /**
     * Encodes the data with the given encoder
     *
     * @param {string} type Encoder type
     * @param {Object} data Data
     * @return {string} Encoded data
     */
    var encode = function (type, data) {
        if (encoderExists(type)) {
            return encoders[type].encode(data);
        } else {
            return "";
        }
    };

    return {
        encode: encode,
        getValidEncoders: getValidEncoders,
        encoderExists: encoderExists
    };

};

module.exports = RequestDataEncoder();
