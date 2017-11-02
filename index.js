var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongo = require('mongodb').MongoClient;

const START_BALANCE = 15000;

mongo.connect('mongodb://127.0.0.1/test', function(err, db){
	if(err) throw err;

	io.sockets.on('connection', function (socket) {
		console.log("Socket connected.");
		var col = db.collection('users');

		col.find().toArray(function(err, res){
			if(err) throw err;
			socket.emit('output', res);
		});
		
		socket.on('user joined', function (data) {
            if(!col.find({user: data.user}).limit(1)){
                col.insertOne({user: data.user, balance: START_BALANCE});
                socket.emit('new user',{user: data.user});
            }
        });

		socket.on('balance change', function(data){
            updateBalance(data.user,data.change,data.if_add);
		});
        socket.on('transfer', function(data){
            updateBalance(data.user_minus,data.change,false);
            updateBalance(data.user_plus,data.change,true);
        });

        function updateBalance(user,change,if_add) {
            var whitespacePattern = /^\s*$/;

            if(whitespacePattern.test(user) || whitespacePattern.test(change)) {
                socket.emit('er', "Wartość i nazwa użytkownika nie może być pusta.");
            }

            else {
                if (if_add) {
                    col.updateOne({user: data.user}, {$add: {balance: data.change}});
                }
                else{
                    col.updateOne({user: data.user}, {$subtract: {balance: data.change}});
                }
                io.emit('to ' + data.user, {
                    change: data.change,
                    add: if_add
                });
            }
        }


	});

});



app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});


// io.on('connection', function(socket){
// 	socket.on('chat message', function(msg,user){
// 		io.emit('chat message', msg, user);
// 	});
// });

http.listen(3000, function(){
	console.log('listening on *:3000');
});