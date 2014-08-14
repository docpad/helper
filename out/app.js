// Generated by CoffeeScript 1.7.1
(function() {
  var Analytics, CM_API_KEY, CM_LIST_ID, CreateSend, SEGMENT_SECRET, analytics, createSend, spamUsers,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  CreateSend = require('createsend-node');

  Analytics = require('analytics-node');

  SEGMENT_SECRET = process.env.SEGMENT_SECRET || null;

  CM_API_KEY = process.env.CM_API_KEY || null;

  CM_LIST_ID = process.env.CM_LIST_ID || null;

  if (!CM_API_KEY) {
    throw new Error('CM_API_KEY is undefined');
  }

  if (!CM_LIST_ID) {
    throw new Error('CM_LIST_ID is undefined');
  }

  if (!SEGMENT_SECRET) {
    throw new Error('SEGMENT_SECRET is undefined');
  }

  analytics = new Analytics(SEGMENT_SECRET);

  createSend = new CreateSend({
    apiKey: CM_API_KEY
  });

  spamUsers = ['55c7a10d69feeae52b991ba69e820c29aa1da960', 'ef87bc3cbb56a7d48e8a5024f9f33706b8146591'];

  module.exports = require('helper-service').start({
    middleware: function(req, res, next) {
      var ipAddress, logger, sendError, sendResponse, sendSuccess, subscriberData, _base, _base1, _ref;
      ipAddress = req.headers['X-Forwarded-For'] || req.connection.remoteAddress;
      logger = req.logger, sendResponse = req.sendResponse, sendError = req.sendError, sendSuccess = req.sendSuccess;
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
            Name: req.query.name || req.body.name || null,
            Resubscribe: true,
            CustomFields: [
              {
                Key: 'username',
                Value: req.query.username || req.body.username || null
              }
            ]
          };
          return createSend.subscribers.addSubscriber(CM_LIST_ID, subscriberData, function(err, subscriber) {
            var email;
            email = (subscriber != null ? subscriber.emailAddress : void 0) || null;
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
          if (!req.body.userId) {
            req.body.userId = 'undefined';
            logger.log('warn', 'no user on track:', req.url, req.query, req.body);
          } else if (_ref = req.body.userId, __indexOf.call(spamUsers, _ref) >= 0) {
            return sendError('spam user');
          }
          (_base = req.body).context || (_base.context = {});
          (_base1 = req.body.context).ip || (_base1.ip = ipAddress);
          switch (req.query.action) {
            case 'identify':
              analytics.identify(req.body, logError);
              break;
            case 'track':
              analytics.track(req.body, logError);
              break;
            default:
              return sendError('unknown action');
          }
          return sendSuccess();
        default:
          return next();
      }
    }
  });

}).call(this);
