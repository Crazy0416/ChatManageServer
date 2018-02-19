var redis = require('redis');
var config = require('../config/chatManageServer');

module.exports = redis.createClient({
    host: config.redis['host'],
    port: config.redis['port']
});