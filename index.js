var express = require('express'), app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongo = require('mongodb').MongoClient;
var path = require('path');

const START_BALANCE = 15000;

app.use(express.static(path.join(__dirname, '/public')));

io.sockets.on('connection', function (socket) {
    //console.log("Socket connected.");
    mongo.connect('mongodb://127.0.0.1/test', function (err, db) {
        if (err) throw err;
        var col = db.collection('users');
        col.find().toArray(function (err, res) {
            if (err) throw err;
            socket.emit('output', res);
        });
        db.close();
    });

    socket.on('user joined', function (data) {
        mongo.connect('mongodb://127.0.0.1/test', function (err, db) {
            if (err) throw err;
            var col = db.collection('users');
            col.insertOne({user: data.user, balance: START_BALANCE}, function (err) {
                if (!err) {
                    io.emit('output', [{user: data.user}]);
                    console.log("new user " + data.user + " joined");
                }
                else {
                    console.log("user " + data.user + " joined");
                }
            });
            db.close();
        });
        mongo.connect('mongodb://127.0.0.1/test', function (err, db) {
            if (err) throw err;
            var col = db.collection('users');
            col.findOne({user: data.user}, function (err, result) {
                if (err) throw err;
                socket.emit('update: ' + data.user, {
                    balance: result.balance
                });
            });
            db.close();
        });
    });

    socket.on('balance change', function (data) {
        if (data.change !== null) {
            updateBalance(data.user, data.change, data.if_add);
            console.log(data.user + " " + (data.if_add ? "+" : "-") + data.change);
        }
    });
    socket.on('transfer', function (data) {
        if (data.change !== null) {
            updateBalance(data.user_minus, data.change, false);
            updateBalance(data.user_plus, data.change, true);
            console.log(data.user_minus + " ---" + data.change + "--> " + data.user_plus);
        }
    });

    function updateBalance(user, change, if_add) {


        mongo.connect('mongodb://127.0.0.1/test', function (err, db) {
            if (err) throw err;
            var col = db.collection('users');
            if (if_add) {
                col.updateOne({user: user}, {$inc: {balance: change}});
            }
            else {
                col.updateOne({user: user}, {$inc: {balance: -change}});
            }
            db.close();
        });
        mongo.connect('mongodb://127.0.0.1/test', function (err, db) {
            if (err) throw err;
            var col = db.collection('users');
            col.findOne({user: user}, function (err, result) {
                if (err) throw err;
                io.emit('update: ' + user, {
                    balance: result.balance
                });
            });
            db.close();
        });

    }


})
;


app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});


// io.on('connection', function(socket){
// 	socket.on('chat message', function(msg,user){
// 		io.emit('chat message', msg, user);
// 	});
// });

http.listen(3000, function () {
    console.log('listening on *:3000');
});


process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', function (text) {
    var words = text.match(/[^\s]+/g);
    switch(words[0]) {
        case 'quit':
            done();
            break;
        case 'drop':
            drop();
            break;
        case 'remove':
            if(words[1]!==null){remove(words[1]);}
            break;
        default:
    }
});

function done() {
    console.log('>bye');
    process.exit();
}
function drop() {
    mongo.connect('mongodb://127.0.0.1/test', function (err, db) {
        if (err) throw err;
        var col = db.collection('users');
        col.drop(function (err) {
            if (err) throw err;
        });

    });
    mongo.connect('mongodb://127.0.0.1/test', function (err, db) {
        if (err) throw err;
        var col = db.collection('users');
        col.createIndex({user: 1},{unique: true}, function (err) {
            if (err) throw err;
        });
        db.close();
    });
    console.log(">all users removed");
}
function remove(user) {
    mongo.connect('mongodb://127.0.0.1/test', function (err, db) {
        if (err) throw err;
        var col = db.collection('users');
        col.removeOne({user: user}, function (err) {
            if (err) throw err;
            console.log(">"+user+" was removed");
        });
        db.close();
    });
}