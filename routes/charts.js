"use strict";


module.exports = function(app){
  var env = require('../env'),
      config = env.config


 /**
  *   Our chart files.
  */
 app.get(config.root_url + '/charts/:chartFile', function(req, res){
    res.header('Access-Control-Allow-Origin', '*');

    res.render(req.params.chartFile, {}, function(err, html) {
      if(err) {
        res.write('<html><h1>"' + req.params.chartFile + '": page not found</h1></html>'); // File doesn't exists
        res.end();
      } else {
        res.end(html);
      }
    });
 });

}
