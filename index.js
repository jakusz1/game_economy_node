var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongo = require('mongodb').MongoClient;

// var MongoClient = require('mongodb').MongoClient
// , assert = require('assert');

// Connection URL

// Use connect method to connect to the server
mongo.connect('mongodb://127.0.0.1/test', function(err, db){
	if(err) throw err;

	io.sockets.on('connection', function (socket) {
		console.log("Socket connected.");
		var col = db.collection('users');

		col.find().toArray(function(err, res){
			if(err) throw err;
			socket.emit('output', res);
		});

		socket.on('chat message', function(msg){

			var whitespacePattern = /^\s*$/;

			if(whitespacePattern.test(msg.user) || whitespacePattern.test(msg.message)) {
				socket.emit('er', "Wiadomość i nazwa użytkownika nie może być pusta.");
			}

			else {
				col.insert( { user: msg.user, message: msg.message} )
				io.emit('chat message', {
					message: msg.message,
					user: msg.user
				});
			}

		});
		socket.on('plus change', function(data){

			var whitespacePattern = /^\s*$/;

			if(whitespacePattern.test(msg.user) || whitespacePattern.test(msg.message)) {
				socket.emit('er', "Wiadomość i nazwa użytkownika nie może być pusta.");
			}

			else {
				if(col.find(data.user))
				col.insert( { user: msg.user, message: msg.message} )

				io.emit('to ' + data.user, {
					change: data.change,
					add: true
				});
			}

		});

	});

});

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});
app.get('/screen', function(req, res){
	res.sendFile(__dirname + '/screen.html');
});

// io.on('connection', function(socket){
// 	socket.on('chat message', function(msg,user){
// 		io.emit('chat message', msg, user);
// 	});
// });

http.listen(3000, function(){
	console.log('listening on *:3000');
});