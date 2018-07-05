
var express = require('express');
var cors = require('cors');
var app = express();
app.use(cors());

var mysql = require('mysql');
var bodyParser = require("body-parser");
var bcrypt = require('bcryptjs');
var sha256 = require('js-sha256');
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

app.use(function(req, res, next) {
    next();
});
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Headers', "*");
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
    return res.status(200).json({});
  }
  next();
});

app.post("/api/login", function(req, res) {
  login(req, res);
});

app.post("/api/changePassword", function(req, res) {
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

app.post("/api/logout", function(req, res) {
  var token = req.body.token;
  isValidToken(token).then(function(result) {
    logout(req, res);
  }, function(error) {
    res.json({
      "code": 110,
      "status": "Your session has expired and you are loged out. - redirect la index in FE"
    })
  });
});

app.get("/api/getAllEmployees", function(req, res) {
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

app.get("/api/getAllServices", function(req, res) {
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

app.get("/api/getMyReservations", function(req, res) {
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

app.get("/api/getAllReservations", function(req, res) {
  var token = req.query.token;
  isValidToken(token).then(function(result) {
    getAllReservations(req, res);
  }, function(error) {
    res.json({
      "code": 110,
      "status": "Your session has expired and you are loged out. - redirect la index in FE"
    })
  });
});

app.get("/api/getEmployeeReservations", function(req, res) {
  var token = req.query.token;
  isValidToken(token).then(function(result) {
    getEmployeeReservations(req, res);
  }, function(error) {
    res.json({
      "code": 110,
      "status": "Your session has expired and you are loged out. - redirect la index in FE"
    })
  });
});

app.get("/api/getAllFreeEmployees", function(req, res) {
  var token = req.query.token;
  isValidToken(token).then(function(result) {
    getAllFreeEmployees(req, res);
  }, function(error) {
    res.json({
      "code": 110,
      "status": "Your session has expired and you are loged out. - redirect la index in FE"
    })
  });
});

app.get("/api/getReport", function(req, res) {
  var token = req.query.token;
  isValidToken(token).then(function(result) {
    getReport(req, res);
  }, function(error) {
    res.json({
      "code": 110,
      "status": "Your session has expired and you are loged out. - redirect la index in FE"
    })
  });
});

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var port = process.env.PORT || 4000;

server.listen(port, function() {
  console.log('Server listening at port %d', port);
});
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

  socket.on('/deleteService', function(data) {
    isValidToken(data.token).then(function(result) {
      deleteService(data, function(res) {
        io.emit('/resDeleteService', data);
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

  socket.on('/deleteReservation', function(data) {
    isValidToken(data.token).then(function(result) {
      deleteReservation(data, function(res) {
        io.emit('/resDeleteReservation', data);
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

  socket.on('/approveReservation', function(data) {
    isValidToken(data.token).then(function(result) {
      approveReservation(data, function(res) {
        io.emit('/resApproveReservation', data);
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

  socket.on('/rate', function(data) {
    isValidToken(data.token).then(function(result) {
      rate(data, function(res) {
        io.emit('/resRate', data);
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



function editService(data, callback) {
  pool.getConnection(function(err, connection) {
    if (err) {
      res.json({
        "code": 100,
        "status": "Error in connection database"
      });
      return;
    }

    let query, id = data.serviceId.substring(4),
      table = 'services';

    query = 'UPDATE ?? SET title = ? , description = ?, price = ? WHERE serviceId = ? ';

    connection.query(query, [table, data.title, data.description, data.price, id], function(err, rows) {
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

function addService(data, callback) {

  pool.getConnection(function(err, connection) {
    if (err) {
      res.json({
        "code": 100,
        "status": "Error in connection database"
      });
      return;
    }
    let query, columns = ['title', 'description', 'price'],
      table = 'services';

    query = 'INSERT INTO ?? (??) VALUES (?, ?, ?) ';

    connection.query(query, [table, columns, data.title, data.description, data.price], function(err, rows) {
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

function deleteService(data, callback) {
  pool.getConnection(function(err, connection) {
    if (err) {
      res.json({
        "code": 100,
        "status": "Error in connection database"
      });
      return;
    }

    let query, table = 'services';

    query = 'DELETE FROM ?? WHERE serviceId= ?';

    connection.query(query, [table, data.serviceId], function(err, rows) {
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

function register(data, callback) {
  pool.getConnection(function(err, connection) {
    if (err) {
      res.json({
        "code": 100,
        "status": "Error in connection database"
      });
      return;
    }

    let query, columns, datas, table = 'users';

    if (data.token) {
      query = 'INSERT INTO ?? (??) VALUES (?)';
      datas = [data.firstName, data.lastName, '1', data.email, data.password, data.phone, '1'];
      columns = ['firstName', 'lastName', 'isActive', 'email', 'password', 'phone', 'admin']
    } else {
      query = 'INSERT INTO ?? (??) VALUES (?)';
      datas = [data.firstName, data.lastName, '1', data.email, data.password, data.phone, data.cars, '0'];
      columns = ['firstName', 'lastName', 'isActive', 'email', 'password', 'phone', 'cars', 'admin'];
    }
    connection.query(query, [table, columns, datas], function(err, rows) {
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

  pool.getConnection(function(err, connection) {
    if (err) {
      res.json({
        "code": 100,
        "status": "Error in connection database"
      });
      return;
    }

    let params = req.body,
      response,
      result,
      token,
      query,
      table = 'users',
      hash = sha256.create();

    hash.update(Math.random().toString(36).substr(2, 5));
    token = hash.hex();

    query = 'SELECT * FROM ?? WHERE email = ? AND password = ?';

    connection.query(query, [table, params.email,params.password], function(err, rows) {
      connection.release();
      if (rows != "") {
        if (!err) {
          var user = rows[0];
          if (!user.token) {
            setToken(token, user.userId);
            user.token = token
          }
          res.json(user);
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

function editUser(data, callback) {

  pool.getConnection(function(err, connection) {
    if (err) {
      res.json({
        "code": 100,
        "status": "Error in connection database"
      });
      return;
    }

    let query, response, datas, table = 'users';

    if ((data.isActive != 0 && data.active != 1) && !data.isActive) {
      response = 'profile';
      query = 'UPDATE ?? SET firstName = ?, lastName = ?, email = ?, phone = ?, cars = ? WHERE userId = ?';

      connection.query(query, [table, data.firstName, data.lastName, data.email, data.phone, data.cars, data.id], function(err, rows) {
        connection.release();
        callback(response);
      });
    } else {
      response = 'user';
      query = 'UPDATE ?? SET firstName = ?, lastName = ?, email = ?, phone = ?, isActive = ? WHERE userId = ?';
      connection.query(query, [table, data.firstName, data.lastName, data.email, data.phone, data.isActive, data.id], function(err, rows) {
        connection.release();
        callback(response);
      });
    }

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

  pool.getConnection(function(err, connection) {
    if (err) {
      res.json({
        "code": 100,
        "status": "Error in connection database"
      });
      return;
    }

    let params = req.body,
      response,
      result,
      query,
      table ='users',
      hash = sha256.create();

      query = 'UPDATE ?? SET password = ? WHERE email = ?';

    connection.query(query, [table, params.password, params.email], function(err, rows) {
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

function addReservation(data, callback) {
  pool.getConnection(function(err, connection) {
    if (err) {
      res.json({
        "code": 100,
        "status": "Error in connection database"
      });
      return;
    }

    let query, datas, table = 'reservations', columns;

    query = 'INSERT INTO ?? (??) VALUES (?)'
    columns = ['userId', 'userFirstName', 'userLastName', 'userEmail', 'userPhone', 'serviceId', 'carNr', 'date', 'mentions', 'status'];
    datas = [data.userId, data.firstName, data.lastName, data.email, data.phone, data.serviceId, data.carNr, data.date, data.mentions, 'Pending'];

    connection.query(query, [table, columns, datas], function(err, rows) {
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

function deleteReservation(data, callback) {
  var query;
  pool.getConnection(function(err, connection) {
    if (err) {
      res.json({
        "code": 100,
        "status": "Error in connection database"
      });
      return;
    }

    query = 'DELETE FROM reservations WHERE resId=' + data.resId;

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

function approveReservation(data, callback) {
  var query;
  pool.getConnection(function(err, connection) {
    if (err) {
      res.json({
        "code": 100,
        "status": "Error in connection database"
      });
      return;
    }

    if (data.employeeId) {
      query = 'UPDATE reservations SET employeeId ="' + data.employeeId + '", status="' + data.status + '" WHERE resId=' + data.resId;
    } else {
      query = 'UPDATE reservations SET status="' + data.status + '" WHERE resId=' + data.resId;
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

function rate(data, callback) {

  pool.getConnection(function(err, connection) {
    if (err) {
      res.json({
        "code": 100,
        "status": "Error in connection database"
      });
      return;
    }

    let query, table = 'reservations';

    query = 'UPDATE ?? SET comment = ? , rating = ? WHERE resId = ? ';

    connection.query(query, [table, data.comment, data.nrOfStars, data.resId], function(err, rows) {
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

    var queryString = "SELECT * FROM users WHERE users.admin = 1  ORDER BY users.isActive DESC";

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
    }

    var queryString = "SELECT * FROM services";

    connection.query(queryString, function(err, rows) {
      connection.release();
      if (!err) {
        res.jsonp(rows);
      }
    });
    connection.on('error', function(err) {
      res.json({
        "code": 100,
        "status": "Error in connection database"
      });
    });
  });
}

function getMyReservations(req, res) {
  pool.getConnection(function(err, connection) {
    if (err) {
      res.json({
        "code": 100,
        "status": "Error in connection database"
      });
    }

    let params = req.query, query;

    query = `SELECT reservations.*, services.description, services.price, services.title FROM reservations  JOIN services ON reservations.serviceId = services.serviceId WHERE reservations.userId = ? ORDER BY status = 'Pending' DESC, status = 'Approved' DESC`;

    connection.query(query, [params.userId], function(err, rows) {
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
    });
  });
}

function getAllReservations(req, res) {

  pool.getConnection(function(err, connection) {
    if (err) {
      res.json({
        "code": 100,
        "status": "Error in connection database"
      });
    }

    let query = `SELECT reservations.*, services.description, services.price, services.title FROM reservations  JOIN services ON reservations.serviceId = services.serviceId ORDER BY status = 'Pending' DESC `

    connection.query(query, function(err, rows) {
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
    });
  });
}


function getEmployeeReservations(req, res) {
  pool.getConnection(function(err, connection) {
    if (err) {
      res.json({
        "code": 100,
        "status": "Error in connection database"
      });
    }
    let query = `SELECT reservations.*, services.description, services.price, services.title FROM reservations  JOIN services ON reservations.serviceId = services.serviceId
    WHERE reservations.employeeId=` + req.query.employeeId + ` OR reservations.status = 'Pending' ORDER BY status = 'Pending' DESC`;

    connection.query(query, function(err, rows) {
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
    });
  });
}

function getAllFreeEmployees(req, res) {
  pool.getConnection(function(err, connection) {
    if (err) {
      res.json({
        "code": 100,
        "status": "Error in connection database"
      });
    }

    let params = req.query, query;

    query = `SELECT  DISTINCT users.userId, users.firstName, users.lastName, users.email, users.phone FROM users WHERE users.userId NOT IN
(SELECT reservations.employeeId FROM reservations WHERE reservations.date = ?) AND users.isActive = ? AND users.admin = ?`;

    connection.query(query, [params.date, 1, 1], function(err, rows) {
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
    });
  });
}

function getReport(req, res) {
  pool.getConnection(function(err, connection) {
    if (err) {
      res.json({
        "code": 100,
        "status": "Error in connection database"
      });
    }

    let params = req.query, query, response = [], date;
    for (let i = 0; i < params.employeesIds.length; i++) {
      if (params.date && !params.month) {
        query = `select (SELECT COUNT(*) FROM reservations wHERE reservations.date LIKE '%` + params.date  +`%' AND reservations.employeeId = ` + params.employeesIds[i]+`) as count,
        reservations.employeeId, users.firstName, users.lastName, reservations.rating, reservations.date from reservations JOIN users ON
        reservations.employeeId = users.userId WHERE reservations.date LIKE '%` + params.date + `%' AND reservations.employeeId =` + params.employeesIds[i];
      } else if (params.month) {
          date = params.month < 10 ? '0' + params.month : params.month;
          query = `select (SELECT COUNT(*) FROM reservations wHERE reservations.date LIKE '` + date  +`%' AND reservations.employeeId = ` + params.employeesIds[i]+`) as count,
          reservations.employeeId, users.firstName, users.lastName, reservations.rating, reservations.date from reservations JOIN users ON
          reservations.employeeId = users.userId WHERE reservations.date LIKE '` + date + `%' AND reservations.employeeId =` + params.employeesIds[i];
      }
      connection.query(query, function(err, rows) {
        if (!err) {
          var data = [];
          if (rows.length == 1) {
            response.push({
              employeeId: params.employeesIds[i],
              datas: rows[0]
            })
          } else if (rows.length > 1){
            for (let j = 0; j < rows.length; j++) {
              if (rows[j].employeeId == params.employeesIds[i]) {
                data.push(rows[j])
              }
            }
              response.push({
                employeeId: params.employeesIds[i],
                datas: data
              })

          }
        }
        if (i == params.employeesIds.length -1 ){
          res.json(response);
        }
      });
      connection.on('error', function(err) {
        res.json({
          "code": 100,
          "status": "Error in connection database"
        });
      });
    }
    connection.release()
  });
}

function changePassword(req, res) {

  pool.getConnection(function(err, connection) {
    if (err) {
      res.json({
        "code": 100,
        "status": "Error in connection database"
      });
      return;
    }

    let params = req.body,
      response,
      result,
      query,
      table ='users',
      hash = sha256.create();

      query = 'UPDATE ?? SET password = ? WHERE email = ?';

    connection.query(query, [table, params.password, params.email], function(err, rows) {
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

function isValidToken(token) {
  return new Promise((resolve, reject) => {
    pool.getConnection(function(err, connection) {
      if (err) {
        return reject({
          msg: 'connection error'
        });
      }
      let query, table = 'users';

      query = 'SELECT * FROM ?? WHERE token = ?';
      connection.query(query, [table, token], function(err, rows) {
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

function setToken(token, id) {
  pool.getConnection(function(err, connection) {
    if (err) {
      res.json({
        "code": 100,
        "status": "Error in connection database"
      });
      return;
    }

    let table = 'users', query;

    query = 'UPDATE ?? SET token = ? WHERE userId = ?';
    connection.query(query, [table, token, id], function(err, rows) {
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
    connection.query("UPDATE users SET token = '' WHERE email ='" + params.email + "'", function(err, rows) {
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


app.listen(3000, () => console.log('Example app listening on port 3000!'))
