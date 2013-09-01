// Generated by CoffeeScript 1.6.3
var CM_API_KEY, CM_LIST_ID, PORT, SEGMENT_SECRET, analytics, app, cmApi, connect, createsend, extendr, human, logger, spamUsers,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

createsend = require('createsend');

analytics = require('analytics-node');

extendr = require('extendr');

connect = require('connect');

logger = new (require('caterpillar').Logger)();

human = new (require('caterpillar-human').Human)();

logger.pipe(human).pipe(process.stdout);

analytics.on('error', function(err) {
  return logger.log('err', err.message);
});

process.on('uncaughtException', function(err) {
  return logger.log('err', err.message);
});

SEGMENT_SECRET = process.env.SEGMENT_SECRET || null;

CM_API_KEY = process.env.CM_API_KEY || null;

CM_LIST_ID = process.env.CM_LIST_ID || null;

PORT = process.env.PORT || 8000;

spamUsers = ['55c7a10d69feeae52b991ba69e820c29aa1da960', 'ef87bc3cbb56a7d48e8a5024f9f33706b8146591'];

if (!CM_API_KEY) {
  throw new Error('CM_API_KEY is undefined');
}

if (!CM_LIST_ID) {
  throw new Error('CM_LIST_ID is undefined');
}

if (!SEGMENT_SECRET) {
  throw new Error('SEGMENT_SECRET is undefined');
}

analytics.init({
  secret: SEGMENT_SECRET
});

cmApi = new createsend(CM_API_KEY);

app = connect();

app.use(connect.limit('200kb'));

app.use(connect.timeout());

app.use(connect.compress());

app.use(connect.query());

app.use(connect.json());

app.use(function(req, res) {
  var ipAddress, sendError, sendResponse, sendSuccess, subscriberData, _base, _base1, _ref;
  ipAddress = req.headers['X-Forwarded-For'] || req.connection.remoteAddress;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Request-Method', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  sendResponse = function(data, code) {
    var level, str;
    if (code == null) {
      code = 200;
    }
    str = null;
    res.writeHead(code, {
      'Content-Type': 'application/json'
    });
    if (req.query.callback) {
      str = req.query.callback + '(' + JSON.stringify(data) + ')';
    } else {
      str = JSON.stringify(data);
    }
    level = code === 200 ? 'info' : 'warning';
    logger.log(level, "" + code + " response:", str);
    res.write(str);
    return res.end();
  };
  sendError = function(message, data, code) {
    var responseData;
    if (data == null) {
      data = {};
    }
    if (code == null) {
      code = 400;
    }
    responseData = extendr.extend({
      success: false,
      error: message
    }, data);
    return sendResponse(responseData, code);
  };
  sendSuccess = function(data, code) {
    var responseData;
    if (data == null) {
      data = {};
    }
    if (code == null) {
      code = 200;
    }
    responseData = extendr.extend({
      success: true
    }, data);
    return sendResponse(responseData, code);
  };
  logger.log('info', 'received request:', req.url, req.query, req.body);
  if (!req.query.method) {
    return sendError('missing method');
  }
  switch (req.query.method) {
    case 'ping':
      return sendSuccess();
    case 'add-subscriber':
      subscriberData = {
        EmailAddress: req.query.email || req.body.email,
        Name: req.query.name || req.body.name,
        Resubscribe: true,
        CustomFields: [
          {
            Key: 'username',
            Value: req.query.username || req.body.username
          }
        ]
      };
      return cmApi.subscriberAdd(CM_LIST_ID, subscriberData, function(err, email) {
        if (err) {
          return sendError(err.message, {
            email: email
          });
        }
        return sendSuccess({
          email: email
        });
      });
    case 'analytics':
      if (Object.keys(req.body).length === 0) {
        return sendError('missing body', req.body);
      }
      if (_ref = req.body.userId, __indexOf.call(spamUsers, _ref) >= 0) {
        return sendError('spam user');
      }
      (_base = req.body).context || (_base.context = {});
      (_base1 = req.body.context).ip || (_base1.ip = ipAddress);
      switch (req.query.action) {
        case 'identify':
          analytics.identify(req.body);
          break;
        case 'track':
          analytics.track(req.body);
          break;
        default:
          return sendError('unknown action');
      }
      return sendSuccess();
    default:
      return sendError('unknown method');
  }
});

app.listen(PORT, function() {
  return logger.log('info', 'opened server on', PORT);
});

module.exports = app;
