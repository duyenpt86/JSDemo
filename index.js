var logger = require('morgan');
var http = require('http');
var bodyParser = require('body-parser');
var express = require('express');
var request = require('request');
var router = express();
var najax = require('najax');

var builder = require("botbuilder");

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

// Đoạn code xử lý khi có người nhắn tin cho bot facebook
app.post('/webhook', function(req, res) {
	var entries = req.body.entry;
	for (var entry of entries) {
		try{
			//console.log("============================"+JSON.stringify(entry));
			var messaging = entry.messaging; 
			for (var message of messaging) {
				var senderId = message.sender.id;
				if (message.postback){
					var payload = ""; 
					try{ payload = message.postback.title; } catch(e) { payload = message.postback.payload;}
					if(payload == null) payload = "";
					payload = payload.toLowerCase();
					console.log(payload);
					if (payload == "facebook_welcome" || payload == "bắt đầu" || payload.indexOf("start") != -1){
						MessageProcessing("", "fbmessenger", "welcome", senderId);
					}
				}else if (message.message) {
					// Nếu người dùng gửi tin nhắn đến
					if (message.message.text) {
						senderAction(senderId);
						var text = message.message.text;
						if(text == null) text = "";
						else text = text.trim();
						MessageProcessing(text, "fbmessenger", "", senderId);
					}
				}
			}
		}catch(e){
		}
	}
	res.status(200).send("OK");
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: "89ede9c1-54b8-46b1-b907-db9ac9cd52a1",
    appPassword: "rksrjhSQ4BDncsyGvyOb73F"
});

// Listen for messages from users 
app.post('/api/messages', connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, function (session) {
    session.sendTyping();
    setTimeout(function(){
        MessageProcessing(session.message.text, "webchat", "", session.message.address);
    }, 2000);
});
/*bot.dialog("tbtiendien",[
    function(session){
        builder.Prompts.choice(session, "Thanh toán tiền điện", "Thanh toán ngay|Bỏ qua", { listStyle: builder.ListStyle.button });
    },
    function(session, results){
        console.log(results);
        session.endConversation("Tks");
    }
]);*/

//Xu ly tin nhan
function MessageProcessing(inMessage, source, type, senderId){
    var reply = "";
    if(type == "welcome") {
        reply = "Cảm ơn quý khách đã kết nối với Chatbot CSKH của Tổng công ty Điện lực TP Hà Nội - EVNHanoi Carebot!"
					+ "\n\nCarebot sẵn sàng hỗ trợ quý khách mọi thông tin xung quanh việc sử dụng điện, liên tục 24x7."
					+ "\n\nKhi tương tác với Carebot, quý khách có thể chat trực tiếp hoặc lựa chọn các menu, nút bấm trên màn hình chat."
					+ "\n\nĐể Carebot có thể phục vụ chu đáo, xin vui lòng cho biết mã khách hàng.";
		if(source == "fbmessenger") sendMessage(senderId, reply);
	    else{
	        sendWebChatMessage(reply, senderId);
	        //dialogWebChat(reply,"");
	    } 
    }else{
        var text = inMessage.toLowerCase();
        if(text.indexOf("tiền") != -1 || text.indexOf("tien") != -1){
			reply = "EVNHanoi thông báo: tiền điện tháng 9/2017 của khách hàng có mã PD100084808 là 243.544 đồng. Vui lòng thanh toán tiền điện trước ngày 20/9/2017";
			if(source == "fbmessenger") sendButton(senderId, reply, "web_url", "http://app.cskh.cpc.vn:8088/OnlinePayment", "Thanh toán ngay", "");
			else{
			    sendWebChatMessage(reply, senderId);
			    dialogWebChat("","");
			} 
		}else if(text.indexOf("pd") == 0){
			var makh = text.toUpperCase();
			if (makh.length > 7 && makh.length < 14){
				reply = "Cảm ơn, Carebot xác nhận quý khách có mã khác hàng là "+makh+". Kể từ thời điểm này, mọi giao dịch giữa quý khách và Carebot sẽ dựa trên mã khách hàng này. Nếu có thay đổi mã khách hàng vui lòng thông báo cho Carebot.";
			}else{
				reply = "Mã khách hàng không hợp lệ, quý khách có thể tìm thấy mã khách hàng trên hoá đơn tiền điện hàng tháng. Xin cảm ơn";
			}
			if(source == "fbmessenger") sendMessage(senderId, reply);
			else sendWebChatMessage(reply, senderId);
		}else{
			if(source == "fbmessenger") sendMenu(senderId);
			else sendWebChatMessage("Xin lỗi, Carebot chưa rõ yêu cầu của Quý khách. Quý khách có thể gọi tổng đài CSKH 19001288 để được hỗ trợ trực tiếp", senderId);
		}
    }
}

//Send text message to webchat
function sendWebChatMessage(message, address){
    bot.send(new builder.Message().address(address).text(message));
}

// Send welcome when conversation with bot is started
bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                MessageProcessing("", "webchat", "welcome", message.address);
            }/*else{
                // User is joining conversation (they sent message)
                console.log("sent message");
                var address = Object.create(message.address);
                address.user = identity;
                var reply = new builder.Message()
                        .address(address)
                        .text("Hello %s", identity.name);
                bot.send(reply);
            }*/
        });
    }
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
    //console.log(senderId);
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
