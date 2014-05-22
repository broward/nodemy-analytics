"use strict";

process.on('uncaughtException', function(err) {
    // handle the error safely
    console.log(err);
});

var env = require('./env'),
    config = env.config,
    web = require('./lib/web')(config)

web.on('boot', function(){
  console.log('App root url is http://localhost:' + config.app.port + '/' + config.root_url);
})

require('./routes/charts.js')(web.app)
require('./routes/data.js')(web.app)
console.log('doing web start')
web.start()

module.exports = web
