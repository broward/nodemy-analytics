"use strict";

var express = require('express'),
    http = require('http'),
    path = require('path'),
    EventEmitter = require('events').EventEmitter,
    util = require('util'),
    server

util.inherits(Web, EventEmitter)
function Web(config, cb) {
  var app = this.app = express()

  app.set('port', config.app.port);
  app.set('views', path.join(__dirname, '../../charts'));
  app.engine('html', require('ejs').renderFile);
  app.set('view engine', 'ejs');

  if ('development' == app.get('env')) {
    app.use(express.errorHandler());
  }

  app.use(express.favicon());
  app.use(express.bodyParser());
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(require('stylus').middleware(path.join(__dirname, '../../public')));
  app.use(express.static(path.join(__dirname, '../../public')));

  this.http = null;

  this.start = function(cb) {
    if (this.http === null) {
      this.http = http.createServer(app).listen(app.get('port'), cb)
      this.emit('boot')
    }
  }

  this.kill = function(cb){
    this.http.close(cb)
  }
}

module.exports = function( config ) {
  if (typeof config === 'undefined') config = {}
  return (new Web(config))
}
