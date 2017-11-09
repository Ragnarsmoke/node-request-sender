'use strict';

var RequestSender = require('./local_modules/request-sender');
var AppCli = require('./app-cli')();

var requestSender = RequestSender();
AppCli.init(requestSender);

