var express = require('express'), app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongo = require('mongodb').MongoClient;
var path = require('path');

const START_BALANCE = 15000;

app.use(express.static(path.join(__dirname, '/public')));

mongo.connect('mongodb://127.0.0.1/test', function (err, db) {
    console.log("connected to database");
    if (err) throw err;
    var col = db.collection('users');

    io.sockets.on('connection', function (socket) {
        console.log("Socket connected.");
        col.find().toArray(function (err, res) {
            if (err) throw err;
            socket.emit('output', res);
        });
        socket.on('user joined', function (data) {
            col.findOne({user: data.user}, function (err, result) {
                if (result!==null) {
                    socket.emit('simple update', {
                        user: result.user,
                        balance: result.balance
                    });
                    console.log("user " + data.user + " joined");
                }
                else {
                    col.insertOne({user: data.user, balance: START_BALANCE});
                    socket.emit('simple update', {
                        user: data.user,
                        balance: START_BALANCE
                    });
                    io.emit('output', [{user: data.user}]);
                    console.log("new user " + data.user + " joined");
                }
            });

        });
        socket.on('balance change', function (data) {
            if (data.change !== null) {
                updateBalance(data.user, data.change);
                console.log(data.user + " " + (data.change > 0 ? "+" : "") + data.change);
            }
        });
        socket.on('transfer', function (data) {
            if (data.change !== null) {
                updateBalance(data.user_minus, -data.change);
                updateBalance(data.user_plus, data.change);
                console.log(data.user_minus + " ---" + data.change + "--> " + data.user_plus);
            }
        });

        function updateBalance(user, change) {
            col.findOneAndUpdate({user: user}, {$inc: {balance: change}}, function (err, result) {
                io.emit('simple update', {
                    user: user,
                    balance: result.value.balance + change
                });
            });
        }

        socket.on('disconnect', function () {
            console.log('Got disconnect!');
        });
    });
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
app.get('/screen', function (req, res) {
    res.sendFile(__dirname + '/screen.html');
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});


process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', function (text) {
    var words = text.match(/[^\s]+/g);
    switch (words[0]) {
        case 'quit':
            done();
            break;
        case 'drop':
            drop();
            break;
        case 'remove':
            if (words[1]) {
                remove(words[1]);
            }
            break;
        case 'list':
            list();
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
        col.createIndex({user: 1}, {unique: true}, function (err) {
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
            console.log(">" + user + " was removed");
        });
        db.close();
    });
}

function list() {
    mongo.connect('mongodb://127.0.0.1/test', function (err, db) {
        if (err) throw err;
        var col = db.collection('users');
        col.find().toArray(function (err, res) {
            if (err) throw err;
            console.log(res);
        });
        db.close();
    });
}