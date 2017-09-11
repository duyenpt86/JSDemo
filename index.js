var logger = require('morgan');
var http = require('http');
var bodyParser = require('body-parser');
var express = require('express');
var request = require('request');
var router = express();
var najax = require('najax');

var app = express();
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
var server = http.createServer(app);

app.listen(process.env.PORT || 3000);

app.get('/', (req, res) => {
  res.send("Server ok");
});

app.get('/webhook', function(req, res) {
  if (req.query['hub.verify_token'] === 'duyenpt86') {
    res.send(req.query['hub.challenge']);
  }
  res.send('Error, wrong validation token');
});

// Đoạn code xử lý khi có người nhắn tin cho bot
app.post('/webhook', function(req, res) {
    var entries = req.body.entry;
    for (var entry of entries) {
        var messaging = entry.messaging;
        for (var message of messaging) {
            var senderId = message.sender.id;
            if (message.message) {
                // Nếu người dùng gửi tin nhắn đến
                if (message.message.text) {
                    var fwToServer = false;
                    var text = message.message.text;
                    if(text == null) text = "";
                    else text = text.trim();
                    var msgContent = "", textInLowcase = text.toLowerCase();
                    if(textInLowcase == "" || textInLowcase == 'hi' || textInLowcase == "hello" || textInLowcase.indexOf("chao") != -1 || textInLowcase.indexOf("chào") != -1){
                        msgContent = "Kính chào Quý khách hàng. CareBot có thể giúp gì cho quý khách?";
                    }else if(text.indexOf("tiền") != -1 || text.indexOf("tien") != -1){
                        msgContent = "Quý khách vui lòng nhập số điện thoại hoặc mã khách hàng";
                    }else{
                        fwToServer = true;
                    }
                    if(fwToServer){
                        senderAction(senderId);
                        postToServer(senderId, text);  
                    } 
                    else sendMessage(senderId, msgContent);
                }
            }
        }
    }
    res.status(200).send("OK");
});

function senderAction(senderId){
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: "EAAG1acB8vLYBAD7zbA2tBHH3Cd206vjRHUHcVONYWRWggNOniJQRK3ogF38Xya2UmNSK1f5YaOVjFp3ntKUEMj8xTMHFHn4TtahgV9vo4fAVU83hincjATbZBRCaaW8rpQzCF5ZAisOS2b0l5ZAgmPeeWSxq0UmQuSkqngL9QZDZD",
        },
        method: 'POST',
        json: {
            recipient: {
                id: senderId
            },
            sender_action: "typing_on",
        }
    });
}

// Gửi thông tin tới REST API để Bot tự trả lời
function sendMessage(senderId, message) {
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {
          access_token: "EAAG1acB8vLYBAD7zbA2tBHH3Cd206vjRHUHcVONYWRWggNOniJQRK3ogF38Xya2UmNSK1f5YaOVjFp3ntKUEMj8xTMHFHn4TtahgV9vo4fAVU83hincjATbZBRCaaW8rpQzCF5ZAisOS2b0l5ZAgmPeeWSxq0UmQuSkqngL9QZDZD",
    },
    method: 'POST',
    json: {
      recipient: {
        id: senderId
      },
      message: {
        text: message
      },
    }
  });
}

function postToServer(senderId, message){
    najax({ url: 'https://g3g4.vn/monitor/webhooks/', type: 'POST', data : message}).success(function (data){
        sendMessage(senderId, data);
    }).error(function (errorHandler){
        console.log(errorHandler);
    });
}