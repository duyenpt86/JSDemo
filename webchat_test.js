var restify = require("restify");
var builder = require("botbuilder");

var server = restify.createServer();
server.listen(process.env.PORT || 3978, function(){
    console.log("%s listening to %s", server.name, server.url);
});


// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: "89ede9c1-54b8-46b1-b907-db9ac9cd52a1",// process.env.MICROSOFT_APP_ID,//89ede9c1-54b8-46b1-b907-db9ac9cd52a1
    appPassword: "rksrjhSQ4BDncsyGvyOb73F"// process.env.MICROSOFT_APP_PASSWORD//rksrjhSQ4BDncsyGvyOb73F
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, function (session) {
    console.log(JSON.stringify(session.message));
    console.log("User said: " + session.message.text);
    session.send("You said: %s", session.message.text);
});
