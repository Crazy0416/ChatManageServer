var express = require('express');
var router = express.Router();
var redis = require('redis');
var async = require('async');
var config = require('../config/chatManageServer');
var chatServerConfig = require('../app');
var redisClient = redis.createClient({
    host: config.redis['host'],
    port: config.redis['port']
});

/* GET home page. */
router.get('/list', function (req, res, next) {
    res.send(JSON.stringify(chatServerConfig.chatServerList));
});

/* GET users listing. */
router.get('/count', function (req, res, next) {
    var tagName = req.cookies.tagName;

    redisClient.select(2, function (err) {
        if (err) {
            console.log("Redis select err!! : " + err);
            res.status(500).append("Access-Control-Allow-Origin", "*")
                .append("Access-Control-Allow-Headers", "origin, x-requested-with, content-type, accept")
                .set()
                .json({
                    success: false,
                    message: "DB ERR"
                });
        } else {
            redisClient.hgetall('ServerClientCnt', function (err, reply) {
                console.log("ServerClientCnt all : " + JSON.stringify(reply));
                var cnt = 0;
                var length = Object.keys(reply).length;
                var leastKey = null;
                var leastCnt = null;
                async.whilst(function () {
                    return length > cnt;
                }, function (next) {
                    var _key = Object.keys(reply)[cnt];
                    var _val = parseInt(reply[_key]);
                    console.log(chatServerConfig.chatServerList);
                    console.log("_key: ", _key);
                    console.log("_val: ", _val);
                    console.log('chatServerList[_key]: ' + chatServerConfig.chatServerList[_key]);
                    if(chatServerConfig.chatServerList[_key] === 0) {        // 서버가 죽은 경우 넘김
                        console.log('skip!!!!');
                        cnt++;
                        next();
                    } else {
                        if(leastKey === null){      // leastCnt, leastKey가 최초할당을 받지 못한 경우
                            leastKey = Object.keys(reply)[cnt];
                            leastCnt = parseInt(reply[leastKey]);
                        }
                        if (leastCnt > _val) {      // 최소값 비
                            console.log("바꾸기전 최소값 : " + leastCnt);
                            leastCnt = _val;
                            leastKey = _key;
                            console.log("바꾼 후 최소값 : " + leastCnt);
                        }
                        cnt++;
                        next();
                    }
                }, function (err) {
                    if (err) {
                        res.status(500).append("Access-Control-Allow-Origin", "*")
                            .append("Access-Control-Allow-Headers", "origin, x-requested-with, content-type, accept")
                            .set()
                            .json({
                                success: false,
                                message: "DB ERR"
                            });
                    } else {
                        console.log("leastCnt : " + leastCnt);
                        console.log("leastKey : " + leastKey);
                        res.append("Access-Control-Allow-Origin", "*")
                            .append('Access-Control-Allow-Methods', "POST, GET, OPTIONS, DELETE")
                            .append("Access-Control-Allow-Headers", "origin, x-requested-with, content-type, accept")
                            .set()
                            .json({
                                success: true,
                                data: {
                                    ip: leastKey,
                                    //TODO: tagName에 대한 번호키 값
                                    tagName: tagName
                                }
                            });
                    }
                })

            })
        }
    });
});

module.exports = router;
