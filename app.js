var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request');
var serverConfig = require('./config/ChatManage');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var redis = require('redis');
redis.createClient();

var index = require('./routes/index');
var chatserver = require('./routes/chatserver');

var app = express();

exports.chatServerList = serverConfig.healthCheck;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/chatserver', chatserver);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

function healthCheck(opt, ip)
{
    // 짝수 성공 / 홀수 실패
    var p = new Promise(function(resolve, reject)
    {
        var options = opt;
        request(options, function(err, res, body) {
          if(err) {
            reject(ip);
          } else {
            if(res.headers['http_1_1'] === 'ok' && (res.statusCode === 200 || res.statusCode === 304)) {
              resolve(ip);
            } else {
              reject(ip);
            }
          }
        })
    });

    p.then(function(ip)
    {
        console.log('헬스체크 성공 : ' + ip);
        exports.chatServerList[ip] = 1;
    }).catch(function(ip)
    {
        console.log('서버 다운 : ' + ip);
        exports.chatServerList[ip] = 0;
    });

    return p;
}

// healthCheck chatServer
eventEmitter.on('healthCheck', function() {
    setTimeout(function() {
        var promises = [];
        var length = Object.keys(serverConfig.healthCheck).length;
        for (var i = 0 ; i < length; i++)
        {
          var ip = Object.keys(serverConfig.healthCheck)[i];
          var option= {
              url: 'http://' + ip + '/healthcheck',
              method: 'GET'
          };
          promises.push(healthCheck(option, ip));
        }
        Promise.all(promises).then(function(values)
        {
            console.log('모두성공', values);
            console.log(exports.chatServerList);
            eventEmitter.emit('healthCheck');
        }).catch(function(value)
        {
            console.log('실패가 있음', value);
            console.log(exports.chatServerList);
            eventEmitter.emit('healthCheck');
        });

    }, 3000);
});
eventEmitter.emit('healthCheck');


module.exports = app;
