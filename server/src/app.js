var express = require('express'),
  http = require('http');
var app = express();

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

hd.getHolidays(year);
hd.getHolidays(nextyear);

var legalhol = hd.getHolidays(year).concat(hd.getHolidays(nextyear));

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
    next();
});

// Provide all routes here, this is for Home page.
io.on('connection', function(socket) {
  socket.on('/register', function(data) {
    register(data, function(res) {
      io.emit('/resRegister', data);
    });
  }, function(error) {
      res.json({
          "code": 110,
          "status": "Your session has expired and you are loged out. - redirect la index in FE"
      })
  });

  socket.on('/addService', function(data) {
    isValidToken(data.token).then(function(result) {
      addService(data, function(res) {
        io.emit('/resAddService', data);
      });
    }, function(error) {
        res.json({
            "code": 110,
            "status": "Your session has expired and you are loged out. - redirect la index in FE"
        })
    });
  }, function(error) {
      res.json({
          "code": 110,
          "status": "Your session has expired and you are loged out. - redirect la index in FE"
      })
  });

  socket.on('/editService', function(data) {
    isValidToken(data.token).then(function(result) {
      editService(data, function(res) {
        io.emit('/resEditService', data);
      });
    }, function(error) {
        res.json({
            "code": 110,
            "status": "Your session has expired and you are loged out. - redirect la index in FE"
        })
    });
  }, function(error) {
      res.json({
          "code": 110,
          "status": "Your session has expired and you are loged out. - redirect la index in FE"
      })
  });

  socket.on('/addUser', function(data) {
    isValidToken(data.token).then(function(result) {
      register(data, function(res) {
        io.emit('/resAddUser', data);
      });
    }, function(error) {
        res.json({
            "code": 110,
            "status": "Your session has expired and you are loged out. - redirect la index in FE"
        })
    });
  }, function(error) {
      res.json({
          "code": 110,
          "status": "Your session has expired and you are loged out. - redirect la index in FE"
      })
  });

  socket.on('/editUser', function(data) {
    isValidToken(data.token).then(function(result) {
      editUser(data, function(res) {
        io.emit('/resEditUser', data);
      });
    }, function(error) {
        res.json({
            "code": 110,
            "status": "Your session has expired and you are loged out. - redirect la index in FE"
        })
    });
  }, function(error) {
      res.json({
          "code": 110,
          "status": "Your session has expired and you are loged out. - redirect la index in FE"
      })
  });

  socket.on('/editProfile', function(data) {
    isValidToken(data.token).then(function(result) {
      editUser(data, function(res) {
        io.emit('/resEditProfile', data);
      });
    }, function(error) {
        res.json({
            "code": 110,
            "status": "Your session has expired and you are loged out. - redirect la index in FE"
        })
    });
  }, function(error) {
      res.json({
          "code": 110,
          "status": "Your session has expired and you are loged out. - redirect la index in FE"
      })
  });

  socket.on('/addReservation', function(data) {
    isValidToken(data.token).then(function(result) {
      addReservation(data, function(res) {
        io.emit('/resAddReservation', data);
      });
    }, function(error) {
        res.json({
            "code": 110,
            "status": "Your session has expired and you are loged out. - redirect la index in FE"
        })
    });
  }, function(error) {
      res.json({
          "code": 110,
          "status": "Your session has expired and you are loged out. - redirect la index in FE"
      })
  });
});

function editService (data, callback) {
  var query, id;
  pool.getConnection(function(err, connection) {
      if (err) {
          res.json({
              "code": 100,
              "status": "Error in connection database"
          });
          return;
      }
      id = data.serviceId.substring(4);

      query = "UPDATE services SET title='" + data.title + "', description='" + data.description +"', price='" + data.price +"' WHERE serviceId=" + id;

      connection.query(query, function(err, rows) {
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

function addService (data, callback) {
  var query;
  pool.getConnection(function(err, connection) {
      if (err) {
          res.json({
              "code": 100,
              "status": "Error in connection database"
          });
          return;
      }

      query = "INSERT INTO services (title, description, price) VALUES ('" + data.title + "', '" + data.description + "', '" + data.price + "')";

      connection.query(query, function(err, rows) {
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

function register (data, callback) {
  var query;
  pool.getConnection(function(err, connection) {
      if (err) {
          res.json({
              "code": 100,
              "status": "Error in connection database"
          });
          return;
      }
      if (data.token) {
       query = "INSERT INTO users (firstName, lastName, isActive, email, password, phone, admin) VALUES ('" + data.firstName + "', '" + data.lastName + "', 1, '" + data.email + "', '" + data.password + "', '" + data.phone + "',   '" + 1 + "')";
      } else {
        query = "INSERT INTO users (firstName, lastName, isActive, email, password, phone, cars, admin) VALUES ('" + data.firstName + "', '" + data.lastName + "', 1, '" + data.email + "', '" + data.password + "', '" + data.phone + "', '" + data.cars + "',   '" + 0 + "')";
      }
      connection.query(query, function(err, rows) {
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

function editUser (data, callback) {
  var query, response;
  pool.getConnection(function(err, connection) {
      if (err) {
          res.json({
              "code": 100,
              "status": "Error in connection database"
          });
          return;
      }

      if (!data.isActive) {
        response = 'profile';
        query = "UPDATE users SET firstName = '" + data.firstName + "', lastName = '" + data.lastName + "', email = '" + data.email  + "', phone = '" + data.phone + "', cars = '" + data.cars + "'  WHERE userId = '" + data.id + "'";
      } else {
        response = 'user';
        query = "UPDATE users SET firstName = '" + data.firstName + "', lastName = '" + data.lastName + "', email = '" + data.email  + "', phone = '" + data.phone + "', isActive = '" + data.isActive + "'  WHERE userId = '" + data.id + "'";
      }


      connection.query(query, function(err, rows) {
        connection.release();
          callback(response);
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

function changePassword(req, res) {
    var params = req.body,
        response,
        result,
        hash = sha256.create();

    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                "code": 100,
                "status": "Error in connection database"
            });
            return;
        }
        connection.query("UPDATE users SET password = '" +  params.password + "' WHERE email = '" + params.email + "' ", function(err, rows) {
            connection.release();
            if (rows != "") {
                if (!err) {
                    res.json(rows);
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

function addReservation (data, callback) {
  var query;
  pool.getConnection(function(err, connection) {
      if (err) {
          res.json({
              "code": 100,
              "status": "Error in connection database"
          });
          return;
      }

      query = `INSERT INTO reservations (userId, userFirstName, userLastName, userEmail, userPhone, serviceId, carNr, date, mentions, status) VALUES
      ('` + data.userId + `', '` + data.firstName + `', '` + data.lastName + `', '` + data.email + `', '` + data.phone + `', '` + data.serviceId + `', '` + data.carNr + `', '` + data.date
      + `', '` + data.mentions + `', 'Pending')`;

      connection.query(query, function(err, rows) {
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

function getAllEmployees(req, res) {
  var params = req.query;
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                "code": 100,
                "status": "Error in connection database"
            });
            return;
        }

        var queryString = "SELECT * FROM users WHERE token != '" + params.token + "' AND users.admin = 1  ORDER BY users.isActive DESC";

        connection.query(queryString, function(err, rows) {
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

function getAllServices(req, res) {
  var params = req.query;
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                "code": 100,
                "status": "Error in connection database"
            });
            return;
        }

        var queryString = "SELECT * FROM services";

        connection.query(queryString, function(err, rows) {
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

function getMyReservations(req, res) {
  var params = req.query;
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                "code": 100,
                "status": "Error in connection database"
            });
            return;
        }

        var queryString = "SELECT * FROM reservations WHERE userId ='" + params.userId + "'";

        connection.query(queryString, function(err, rows) {
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

function setToken(token, id) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                "code": 100,
                "status": "Error in connection database"
            });
            return;
        }
        connection.query("UPDATE users SET token = '" + token + "' WHERE userId = '" + id + "'", function(err, rows) {
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

router.use(function(req, res, next) {
    console.log("/" + req.method);
    next();
});

router.post("/login", function(req, res) {
    login(req, res);
});

router.post("/changePassword", function(req, res) {
  var token = req.body.token;
    isValidToken(token).then(function(result) {
        changePassword(req, res);
    }, function(error) {
        res.json({
            "code": 110,
            "status": "Your session has expired and you are loged out. - redirect la index in FE"
        })
    });
});

router.get("/getAllEmployees", function(req, res) {
  var token = req.query.token;
    isValidToken(token).then(function(result) {
        getAllEmployees(req, res);
    }, function(error) {
        res.json({
            "code": 110,
            "status": "Your session has expired and you are loged out. - redirect la index in FE"
        })
    });
});

router.get("/getAllServices", function(req, res) {
  var token = req.query.token;
    isValidToken(token).then(function(result) {
        getAllServices(req, res);
    }, function(error) {
        res.json({
            "code": 110,
            "status": "Your session has expired and you are loged out. - redirect la index in FE"
        })
    });
});

router.get("/getMyReservations", function(req, res) {
  var token = req.query.token;
    isValidToken(token).then(function(result) {
        getMyReservations(req, res);
    }, function(error) {
        res.json({
            "code": 110,
            "status": "Your session has expired and you are loged out. - redirect la index in FE"
        })
    });
});

app.use("/api", router);

// Listen to this Port

app.listen(3000, function() {
    console.log("Live at Port 3000");
});
