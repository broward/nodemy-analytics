"use strict";

module.exports = function(app){
  var env = require('../env'),
      config   = env.config,
      postgres = env.postgres

  var async = require("async");


  /**
   *  Show duration time.
   **/
  app.get(config.globalAppRootUrl + '/data/MedianResponseTime', function(req, res){
    res.header('Access-Control-Allow-Origin', '*');

    try {
      medianResponseTime(req, res);
    } catch(err) {
      genericErrorHandler(res, err.message);
    }
  });


  /**
   *  Show Host response time
   */
  function medianResponseTime(req, res) {
    var options = createOptions();

    // clear series data so we can add multiple series.
    options.series = [];
    options.chart.type = 'column';
    options.yAxis.title.text = 'Median Response Time (Seconds)'
    var ids = [];
    var titles = [];
    var hosts = [];

    // force execution of functions in sequential order
    async.series([

      // get id, title and current # of hosts.
      function(callback) {
        
        postgres.client.query(postgres.queries.MedianData(), function(err, result) {
          var hostid = 1;
          for (var i = 0; i < result.rows.length; i++) {
            if (parseInt(result.rows[i]['hosts']) > 4) {
              hostid = hostid + 1;
              ids.push(result.rows[i]['id']);
              titles.push(result.rows[i]['title'] + ' ' + hostid);
              hosts.push(result.rows[i]['hosts']);
            } 
          }

          // we're done, issue callback.
          callback();
        });
      },

      // execute median calculation query
      function(callback) { 
        var index = 0;
        var showall = true;
        
        ids.forEach(function (item) {
          postgres.client.query(postgres.queries.MedianResponseTime(item), function(err, result) {

            // Convert time to days for now
            var data = [];
            var x = parseInt(result.rows[0]['median'])/2400000;  // arbitrary value to make graph look good
            data.push(parseFloat(x.toFixed(2)));

            // display all series or none, initially.
            if (req.query.showall) {
              if (req.query.showall == 'false') {
                showall = false;
              }
            }

            // add this series to highcharts
            var label = titles[index];
            options.series.push({name: label, data: data, visible: showall});

            // issue callback on final array element
            index++;
            if (index >= ids.length) {
              callback();
            }
          });
        });
      }

      // send back highcharts output
      ], function(err) { 
        res.json(options);
    });
  }


  /**
   *  Show overall activity for a host.
   **/
  app.get(config.globalAppRootUrl + '/data/ActivityByHost', function(req, res){
    res.header('Access-Control-Allow-Origin', '*');

    var hostId = req.query.host;
    if (hostId === undefined) {
      genericErrorHandler(res, 'no hostId parameter');
    }

    try {
      multipleQuery(postgres.queries.ActivityByHostId, req, res);
    } catch(err) {
      genericErrorHandler(res, err.message);
    }
  });


  /**
   *    multiple host query.
   */
  function multipleQuery(query, req, res) {
    var options = getOptions();

    // clear series data so we can add multiple series.
    options.series = [];

    var hostId = req.query.host;
    var names = [];
    var ids = [];

    if (hostId === undefined) {
      genericErrorHandler(res, 'no hostId parameter');
    }

    // force execution of functions in sequential order
    async.series([

      // get top host name
      function(callback) {
        postgres.client.query(postgres.queries.HostName(hostId), function(err, result) {
            ids.push(hostId);
            names.push(result.rows[0]['name']);

          // we're done, issue callback.
          callback();
        });
      },

      // get subhosts and their names
      function(callback) {
        postgres.client.query(postgres.queries.SubhostNames(hostId), function(err, result) {
          for (var i = 0; i < result.rows.length; i++) {
            ids.push(result.rows[i]['subhost_id']);
            names.push(result.rows[i]['name']);
          }

          // we're done, issue callback.
          callback();
        });
      },

      // execute query for id
      function(callback) { 
        var index = 0;
        var showall = true;
        ids.forEach(function (item) {

          postgres.client.query(query(item), function(err, result) {
            var data = formatResult(result);

            // do accumulative data if user requested ('accum=true')
            if (req.query.accum) {
              if (req.query.accum == 'true') {
                data = accumulativeData(data);
              } 
            }

            if (req.query.showall) {
              if (req.query.showall == 'false') {
                showall = false;
              }
            }
            // add this series to highcharts
            options.series.push({name: names[index], data: data, visible: showall});

            // issue callback on final array element
            index++;
            if (index >= ids.length) {
              callback();
            }
          });
        });
      }

      // send back highcharts output
      ], function(err) { 
        res.json(options);
    });
  }


  /**
   *  Format postgres results into high-charts data object.
   **/
  function formatResult(result) {
    var data = [];
    var point = [];

    for (var i = 0; i < result.rows.length; i++) {
      point = [];
      point.push(parseInt(result.rows[i]['epoch'])*1000);
      point.push(parseInt(result.rows[i]['count']));
      data.push(point);
    }

    return data;
  }


  /**
   *   Build option object for highcharts
   */
  function getOptions() {
    var options = {

            chart: {
                zoomType: 'x',
                spacingRight: 20,
                renderTo: 'container'
            },
        
            title: {
                text: ''
            },
            subtitle: {
              text: 'Source: nodemy-analytics.herokuapp.com'
            },
            xAxis: {
                type: 'datetime',
                labels: {
                  rotation: -60,
                  align: 'right',
                  style: {
                    fontSize: '10px',
                    fontFamily: 'Verdana, sans-serif'
                  }
                },
                dateTimeLabelFormats: { 
                    month: '%b %Y'
                },
                //tickInterval: 24 * 3600 * 1000 * 7  // default to one week
                tickInterval: 30 * 24 * 3600 * 1000
            },
            
            yAxis: {
                title: {
                    text: "Application Events"
                },
                min: 0,
                allowDecimals: false,
                maxPadding: 0.2
            },
        
            plotOptions: {
              column: {
                pointPadding: 5.0,
                borderWidth: 0
              }
            },

            series: [{
              name: 'Generic Series Message',
              data: new Array({}),
              dataLabels: {
                enabled: false,
                rotation: -90,            
                color: '#000000',
                align: 'middle',
                x: 0,
                y: -25,
                style: {
                  fontSize: '13px',
                  fontFamily: 'Verdana, sans-serif',
                  textShadow: '0 0 0px black'
                }
              }
            }]
          }

    return options;
  }
  

  /**
   *   Convert core data set to accumulative
   */  
  function accumulativeData(data) {
    var total = 0;

    for (var i = 0; i < data.length; i++) {
      total = data[i][1] + total;
      data[i][1] = total;
    }

    return data
  }


  /*
   *  Build a more complex highcharts options object.
   */
  function createOptions(range, data, message) {
    var options = {
      chart: {
        zoomType: 'x',
        spacingRight: 20,
        type: 'column',
        renderTo: 'container'
      },
      title: {
        text: ''
      },
      subtitle: {
      text: 'Source: nodemy-analytics.herokuapp.com'
      },
      xAxis: {
        categories: range,
        labels: {
          rotation: -60,
          align: 'right',
          style: {
            fontSize: '10px',
            fontFamily: 'Verdana, sans-serif'
          }
        }
      },
      yAxis: {
        title: {
          text: 'Application Events'
        },
        min: 0,
        allowDecimals: false,
        maxPadding: 0.2
      },
      plotOptions: {
        column: {
          pointPadding: 0.2,
          borderWidth: 0
        }
      },
      series: [{
        name: message,
        data: data,
        dataLabels: {
          enabled: true,
          rotation: -90,            
          color: '#000000',
          align: 'middle',
          x: 0,
          y: -4,
          style: {
            fontSize: '13px',
            fontFamily: 'Verdana, sans-serif',
            textShadow: '0 0 0px black'
          }
        }
      }]
    };

    return options;
  }


  /**
   *     Return something back to web page
   **/
  function genericErrorHandler(res, err) {
    console.error('error running postgres query', err);
    var options = getOptions();
    options.series[0].name = err;
    res.json(options);
  } 
}
