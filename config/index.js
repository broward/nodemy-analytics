config = {
  api_version: 'v1',
}

config.root_url = '/' + config.api_version
config.globalAppRootUrl = config.root_url

require('connect').utils.merge( config, require('./environment') )

module.exports = config
