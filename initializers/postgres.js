"use strict";

var config = require('../config'),
    pg = require('pg');

var connect = "postgres://" + config.postgres.user +
              ":" + config.postgres.pass +
              "@" + config.postgres.host +
              ":" + config.postgres.port +
              "/" + config.postgres.database

// Heroku needs SSL enabled
if (process.env.DATABASE_URL) {
              connect = connect + "?ssl=true" +
              "&sslfactory=org.postgresql.ssl.NonValidatingFactory"
}

var client = new pg.Client(connect);
client.connect(function(err) {
  if(err) {
    return console.error('could not connect to postgres', err);
  } else {
    console.log('Postgres db connected');
  }
});

module.exports = {
  client: client,
  queries: {}
}
