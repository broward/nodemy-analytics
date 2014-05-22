"use strict";

var config = require('../config'),
    log_stream, logfile_open = false, backlog = []

// set internal state to write messages and
// open a new file handle
var open_log = function (){
  if (logfile_open) {
    close_log();
  }

  log_stream = require('fs').createWriteStream(config.event_log, {'flags': 'a'})

  log_stream.on('error', function(){
    console.log('Event logger has died. Does the log directory exist and is it writeable?')
  })

  // Order is important here.
  //
  // We want the messages to appear in order, so we'll let
  // the logger function keep pushing things into the
  // backlog until we've flushed it.
  //
  // (As an aside, I'm not sure if this will actually work or
  //  if node isn't capable of handling this type of volatility.)
  flush_backlog()
  logfile_open = true
}

// set internal state to hold messages and
// close the file handle
var close_log = function (){
  if (logfile_open) {
    logfile_open = false
    log_stream.end()
  }
}

// called when someone wants to log something
var logger = function(){
  var args = [].slice.call(arguments)

  // if we have an open log stream, send it to be written
  if (logfile_open) {
    log.apply(null, args)

  // we don't have a log stream, hold it for later
  } else {
    backlog.push(args)
  }
}
logger.log = logger


// actually log a message set to the log
var log = function(/* args... */){
  var args = [].slice.call(arguments)
  args.forEach(function(e){
    log_stream.write(e)
  })

  // if the last message didn't have a \n at the end, add one
  if ('\n' != args[args.length -1].slice(-1)) {
    log_stream.write("\n")
  }
}

// one by one, shift messages off of the top of the backlog
var flush_backlog = function(){
  while (backlog.length > 0 && logfile_open){
    log.apply(null, backlog.shift())
  }
}

process.on('SIGUSR2', function(){
    console.log('SIGUSR2: closing logfile')
    close_log()
})
process.on('SIGHUP', function(){
    console.log('SIGHUP: opening log (backlog has ' + backlog.length + ' messages)')
    open_log()
})

module.exports = logger

open_log()
console.log('Event logger connected');
