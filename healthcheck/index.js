'use strict';

var toobusy = require('toobusy-js');
var debug = require('debug')('gateway:healthcheck');
var portastic = require('portastic')
var request = require('request');

const HEALTHCHECK_URL = '/healthcheck';

module.exports.init = function(config, logger, stats) {
  return {
   onrequest: function(req, res, next) {
    console.log(req.url);
     var healthcheck_url = config['healthcheck_url'] ||  HEALTHCHECK_URL
      if(healthcheck_url == req.url) {
        var statusCode = (toobusy() ? 503 : 200)
        debug(statusCode)
        var healthInfo = {
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
          uptime: process.uptime(),
          pid: process.pid
        }
        
        //Check target healthcheck
        var target_health_resp;
        var check_target = config['check_target'] || false; 

        if (check_target == true) {
          var check_target_url = config['check_target_url'] || '/healthcheck';
          if(1==req.targetSecure)var a="https://"+req.targetHostname+":"+req.targetPort+check_target_url;else a="http://"+req.targetHostname+":"+req.targetPort+check_target_url;
          
          request(a, { json: true }, (err, resp, body) => {
            if (err) { 
              statusCode = 500
              var errorDescription = 'Target is not available'
              healthInfo.message = errorDescription
              debug(errorDescription)
              debug(statusCode)
            }
            else { healthInfo.message = body }
            res.writeHead(statusCode, { 'Content-Type': 'application/json' })
            res.write(JSON.stringify(healthInfo))
            res.end()
          });
        }

        //Check for cloud foundry healthcheck
        else if(req.targetPort != '' && process.env.EDGEMICRO_DECORATOR){
          var port = req.targetPort
          portastic.test(port)
          .then(function(isOpen){
            if (isOpen){
              statusCode = 500
              var errorDescription = 'Application is not running on specified applicaiton port: ' + port
              healthInfo.decoratorError = errorDescription
              debug(errorDescription)
              debug(statusCode)
            }
            res.writeHead(statusCode, { 'Content-Type': 'application/json' })
            res.write(JSON.stringify(healthInfo))
            res.end()
          });
        }
        else{
          res.writeHead(statusCode, { 'Content-Type': 'application/json' })
          res.write(JSON.stringify(healthInfo))
          res.end()
        }
      }
      else {
        next()
      }
    }
  }
}