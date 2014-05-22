"use strict";

// this file overwritten by jenkins at deploy time.
// do not add any configuration settings in here.

var environment_config
if (process.env.DATABASE_URL) {
  environment_config = './environments/production'
  console.log("CONNECTED TO PRODUCTION DATABASE");
} else {
  environment_config = './environments/development'
  console.log("CONNECTED TO LOCAL DATABASE");
}

var config = require(environment_config)
module.exports = config
