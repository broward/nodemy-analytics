"use strict";

var rel_data = require('./relational_data'),
    postgres = require('./initializers/postgres')

postgres.queries = rel_data.queries

module.exports = {
  config: require('./config'),
  // event_log: require('./initializers/event_log'),
  postgres: postgres
}
