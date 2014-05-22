module.exports = {
  env: 'development',

  app: {
    port: 3000
  },

  postgres: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    pass: 'postgres',
    database: 'postgres'
  },

  event_log: './log/events.log'
}
