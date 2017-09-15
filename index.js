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

var fUrl = 'https://graph.facebook.com/v2.6/me/messages';
var fActionToken = "EAAG1acB8vLYBAD7zbA2tBHH3Cd206vjRHUHcVONYWRWggNOniJQRK3ogF38Xya2UmNSK1f5YaOVjFp3ntKUEMj8xTMHFHn4TtahgV9vo4fAVU83hincjATbZBRCaaW8rpQzCF5ZAisOS2b0l5ZAgmPeeWSxq0UmQuSkqngL9QZDZD";

//app.listen(process.env.PORT || 3000);
var port = process.env.PORT || 8000;
app.listen(port, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

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
            var msgContent = "";
            if (message.postback){
                var payload = message.postback.payload.toLowerCase();
                if (payload == "bắt đầu"){
                    msgContent = "Cảm ơn quý khách đã kết nối với Chatbot CSKH của Tổng công ty Điện lực TP Hà Nội  - EVNHanoi Carebot!"
                                + "\n\nCarebot sẵn sàng hỗ trợ quý khách mọi thông tin xung quanh việc sử dụng điện, liên tục 24x7."
                                + "\n\nKhi tương tác với Carebot, quý khách có thể chat trực tiếp hoặc lựa chọn các menu, nút bấm trên màn hình chat."
                                + "\n\nĐể Carebot có thể phục vụ chu đáo, xin vui lòng cho biết mã khách hàng.";
                    sendMessage(senderId, msgContent);
                }
            }else if (message.message) {
                // Nếu người dùng gửi tin nhắn đến
                if (message.message.text) {
                    senderAction(senderId);
                    var text = message.message.text;
                    if(text == null) text = "";
                    else text = text.trim();
                    var textInLowcase = text.toLowerCase();
                    if(textInLowcase.indexOf("tiền") != -1 || textInLowcase.indexOf("tien") != -1){
                        msgContent = "EVNHanoi thông báo: tiền điện tháng 9/2017 của khách hàng có mã PD100084808 là 243.544 đồng. Vui lòng thanh toán tiền điện trước ngày 20/9/2017";
                        sendButton(senderId, msgContent, "web_url", "http://app.cskh.cpc.vn:8088/OnlinePayment", "Thanh toán ngay", "");
                    }else if(textInLowcase.indexOf("pd") == 0){
                        var makh = textInLowcase.toUpperCase();
                        if (makh.length > 7 && makh.length < 14){
                            msgContent="Cảm ơn, Carebot xác nhận quý khách có mã khác hàng là "+makh+". Kể từ thời điểm này, mọi giao dịch giữa quý khách và Carebot sẽ dựa trên mã khách hàng này. Nếu có thay đổi mã khách hàng vui lòng thông báo cho Carebot.";
                            sendMessage(senderId, msgContent);
                        }else{
                            msgContent="Mã khách hàng không hợp lệ, quý khách có thể tìm thấy mã khách hàng trên hoá đơn tiền điện hàng tháng. Xin cảm ơn";
                            sendMessage(senderId, msgContent);
                        }
                    
                    }else if(textInLowcase == "rate"){
                        sendMessage(senderId, "Cảm ơn Quý khách đã kết nối với Carebot, để nghị cho biết sự hài lòng của quý khách về phiên hỗ trợ vừa qua (từ 1 đến 5 điểm).");
                    }else{
                        sendMenu(senderId);
                    }
                }
            }
        }
    }
    res.status(200).send("OK");
});

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

function senderAction(senderId){
    request({
        url: fUrl,
        qs: {
            access_token: fActionToken,
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
    console.log(senderId);
  request({
    url: fUrl,
    qs: {
          access_token: fActionToken,
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

function sendMenu(senderId){
    request({
        url: fUrl,
        qs: {
            access_token: fActionToken,
        },
    method: 'POST',
    json: {
        recipient: {
            id: senderId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: "Xin lỗi, Carebot chưa rõ yêu cầu của quý khách. Có phải quý khách đang cần cung cấp những thông tin sau:",
                    buttons: [
                        {
                            type: "web_url",
                            url: "https://g3g4.vn",
                            title: "Thông tin tiền điện",
                        },
                        {
                            type: "web_url",
                            url: "https://g3g4.vn",
                            title: "Lịch cắt điện",
                        },
                        {
                            type: "web_url",
                            url: "https://g3g4.vn",
                            title: "Sửa đổi hợp đồng",
                        }
                    ]
                }
            },
        },
    }
  });
  sleep(7000);
  sendButton(senderId, "Nếu không phải như vậy, Carebot sẽ tìm hiểu lại và trả lời trong thời gian sớm nhất. Hoặc quý khách có thể gọi tổng đài để được hỗ trợ trực tiếp", "phone_number", "", "Gọi tổng đài", "+8419001288");
}

function sendButton(senderId, message, _type, _url, _title, _payload){
    request({
        url: fUrl,
        qs: {
            access_token: fActionToken,
        },
    method: 'POST',
    json: {
        recipient: {
            id: senderId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: message,
                    buttons: [
                        {
                            type: _type,
                            url: _url,
                            title: _title,
                            payload : _payload
                        }
                    ]
                }
            },
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

function sendMsg2(senderId, _message){
    var _url = fUrl + "?action_token=" + fActionToken;
    najax({ 
        url: _url, 
        type: 'POST', 
        dataType: "json",
        data : JSON.stringify({ recipient: { id: senderId }, message: { text: _message }})}).success(function (data){
        console.log('response=' + data);
    }).error(function (errorHandler){
        console.log(errorHandler);
    });
}
