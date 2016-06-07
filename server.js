var koa = require('koa');
var http = require('http');
var https = require('https');
var fs = require('fs');
var router = require('koa-router')();
var koaBody = require('koa-body')();
var enforceHttps = require('koa-sslify');
var request = require('request');
var validation_token = 'wnlee';
var page_token = "EAAZAfRyoecJwBADHToMPClFNZAgYvMtZA2QhjazXliMKuGyxEHOxeRW9wruXAdMzTIb38mfZCEIdpiba9XLhZApzZBlIPXrB3mSZAYlAyhyZC5DJH3s1yvAVlLeSeMOlSaWjX26VNLoLcgkCDwS0YfSQBQrfiNqLyIiCXcLaTKxkjAZDZD";

var app = koa();
// logger
app.use(function *(next){
  var start = new Date;
  yield next;
  var ms = new Date - start;
  console.log('%s %s - %s', this.method, this.url, ms);
});
app.use(enforceHttps());
app
  .use(router.routes())
  .use(router.allowedMethods());

router.get('/webhook/', function *(next) {
  if (this.request.query['hub.verify_token'] === validation_token) {
      this.body = this.request.query['hub.challenge'];
	  this.response.status = 200;
    } else
	this.body = 'Error, wrong validation token';
})

router.post('/webhook/', koaBody, function *(next) {

  messaging_events = this.request.body.entry[0].messaging;

  for (i = 0; i < messaging_events.length; i++) {
    console.log('Send from bot', JSON.stringify(this.request.body));
    event = this.request.body.entry[0].messaging[i]; 
    sender = event.sender.id;

    if (event.message && event.message.text) {
      text = event.message.text;
      // Handle a text message from this sender
      sendTextMessage(sender, "Text received, echo: "+ text.substring(0, 200));

    }
  }
  this.response.status = 200;
});


function sendTextMessage(sender, text) {
  messageData = {
    text:text
  }
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:page_token},
    method: 'POST',
    json: {
      recipient: {id:sender},
      message: messageData,
    }
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending message: ', error);
    } else if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
  });
}
// SSL options
var options = {
  key: fs.readFileSync('privkey1.pem'),
  cert: fs.readFileSync('cert1.pem'),
  ca: fs.readFileSync('fullchain1.pem'),
}

// start the server
http.createServer(app.callback()).listen(80);
https.createServer(options, app.callback()).listen(443);

