var express = require('express');
var router = express.Router();
var redis = require('redis');
var async = require('async');
var redisClient = redis.createClient();

/* GET users listing. */
router.get('/count', function(req, res, next) {
    redisClient.select(2, function(err) {
      if (err){
        console.log("Redis select err!! : " + err);
        res.status(500).json({
            success: false,
            message: "DB ERR"
        });
      } else {
        redisClient.hgetall('ServerClientCnt', function(err, reply) {
          console.log("ServerClientCnt all : " + JSON.stringify(reply));
          var cnt = 1;
          var length = Object.keys(reply).length;
          var leastKey = Object.keys(reply)[0];
          var leastCnt = parseInt(reply[leastKey]);
          async.whilst(function() {
              return length >= cnt;
          }, function(next) {
              var _key = Object.keys(reply)[cnt];
              var _val = parseInt(reply[_key]);
              if(leastCnt > _val){
                  leastCnt = _val;
                  leastKey = _key;
              }
              cnt++;
              next();
          }, function(err){
              if (err) {
                  res.status(500).json({
                      success: false,
                      message: "DB ERR"
                  });
              } else {
                  console.log("leastCnt : " + leastCnt);
                  console.log("leastKey : " + leastKey);
                  res.json({
                      success: true,
                      data: {
                          ip: leastKey
                      }
                  });
              }
          })

        })
      }
    });
});

module.exports = router;
