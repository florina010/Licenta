var express = require('express'),
  http = require('http');
var app = express();
var mailOptions;

var nodemailer = require("nodemailer");
var transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true, // use SSL
    auth: {
        user: 'raluca.bugnar@avangarde-software.com',
        pass: '!23qwerty'
    }
});

var directConfig = {
    name: 'DESKTOP-TRPF46U' // must be the same that can be reverse resolved by DNS for your IP
};

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var port = process.env.PORT || 4000;

server.listen(port, function() {
    console.log('Server listening at port %d', port);
});

var router = express.Router();
var mysql = require('mysql');
var bodyParser = require("body-parser");
var bcrypt = require('bcryptjs');
var sha256 = require('js-sha256');
var Holidays = require('date-holidays');


var year = new Date().getFullYear();
var nextyear = year + 1;
var fileUpload = require('express-fileupload');
var moment = require('moment');
hd = new Holidays('RO');
hdm = new Holidays('MD');

hd.getHolidays(year);
hd.getHolidays(nextyear);

hdm.getHolidays(year);
hdm.getHolidays(nextyear);

var legalhol = hd.getHolidays(year).concat(hd.getHolidays(nextyear));
var legalholm = hdm.getHolidays(year).concat(hdm.getHolidays(nextyear));

var pool = mysql.createPool({
    connectionLimit: 100, //important
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'licenta',
    debug: false
});



app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(fileUpload());

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods', "GET, PUT, POST, DELETE");
    res.header('Access-Control-Allow-Headers', "'Origin', 'X-Requested-With', 'Content-Type', 'Accept'");
    next();
});

var router = express.Router();

// Router middleware, mentioned it before defining routes.

router.use(function(req, res, next) {
    console.log("/" + req.method);
    next();
});

// Provide all routes here, this is for Home page.
io.on('connection', function(socket) {
  socket.on('/register', function(data) {
    console.log(data);
    register(data, function(res) {
      io.emit('/resRegister', data);
    });
  }, function(error) {
      res.json({
          "code": 110,
          "status": "Your session has expired and you are loged out. - redirect la index in FE"
      })
  });
});


function register (data, callback) {
  pool.getConnection(function(err, connection) {
      if (err) {
          res.json({
              "code": 100,
              "status": "Error in connection database"
          });
          return;
      }
      connection.query("INSERT INTO users (firstName, lastName, email, password, phone, cars, admin) VALUES ('" + data.firstName + "', '" + data.lastName + "', '" + data.email + "', '" + data.password + "', '" + data.phone + "', '" + data.options + "',   '" + 0 + "')", function(err, rows) {
        connection.release();
          if (err) {
              console.log(err);
          }
          callback(rows);
      });
      connection.on('error', function(err) {
          var err = ({
              "code": 100,
              "status": "Error in connection database"
          });
          callback(err);
      });
  });
}

function login(req, res) {
    var params = req.body,
        response,
        result,
        hash = sha256.create();
        console.log(params);
    hash.update(Math.random().toString(36).substr(2, 5));
    var token = hash.hex();

    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                "code": 100,
                "status": "Error in connection database"
            });
            return;
        }
        connection.query("SELECT * FROM users WHERE email='" + params.email + "' AND password='" + params.password + "'", function(err, rows) {
            connection.release();
            if (rows != "") {
                if (!err) {
                    var user = rows[0];
                    if (!user.token) {
                        setToken(token, user.userId);
                        user.token = token
                    }
                    res.json(user);
                } else {
                    res.json({
                        "code": 100,
                        "status": "Error in connection database"
                    });
                    return;
                }
            } else {
                res.json(rows);
            }
        });
        connection.on('error', function(err) {
            res.json({
                "code": 100,
                "status": "Error in connection database"
            });
            return;
        });
    });
}

function setToken(token, id) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                "code": 100,
                "status": "Error in connection database"
            });
            return;
        }
        connection.query("UPDATE users SET token = '" + token + "' WHERE userID = '" + id + "'", function(err, rows) {
            connection.release();
        });
        connection.on('error', function(err) {
            res.json({
                "code": 100,
                "status": "Error in connection database"
            });
            return;
        });
    });
}

function logout(req, res) {
    var params = req.body;
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                "code": 100,
                "status": "Error in connection database"
            });
            return;
        }
        connection.query("UPDATE user SET token = '' WHERE email ='" + params.email + "'", function(err, rows) {
            connection.release();
            if (!err) {

                res.json(rows);
            }
        });
        connection.on('error', function(err) {
            res.json({
                "code": 100,
                "status": "Error in connection database"
            });
            return;
        });
    });
}

function isValidToken(token) {
    return new Promise((resolve, reject) => {
        pool.getConnection(function(err, connection) {
            if (err) {
                return reject({
                    msg: 'connection error'
                });
            }
            connection.query("SELECT * FROM users WHERE token ='" + token + "'", function(err, rows) {
                connection.release();
                if (!err) {
                    if (rows.length > 0) {
                        return resolve(rows);
                    } else {
                        return reject({
                            msg: 'nu exista token'
                        });
                    }
                }
            });
            connection.on('error', function(err) {
                return reject({
                    msg: 'connection error'
                });
            });
        });
    });
}


app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(fileUpload());

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods', "GET, PUT, POST, DELETE");
    res.header('Access-Control-Allow-Headers', "'Origin', 'X-Requested-With', 'Content-Type', 'Accept'");
    next();
});

var router = express.Router();

// Router middleware, mentioned it before defining routes.

router.use(function(req, res, next) {
    console.log("/" + req.method);
    next();
});

router.post("/login", function(req, res) {
    login(req, res);
});

app.use("/api", router);

// Listen to this Port

app.listen(3000, function() {
    console.log("Live at Port 3000");
});
