"use strict";

$(document).ready(function() {
  var user = JSON.parse(sessionStorage.getItem('user')),
    token = sessionStorage.getItem('token'),
    MAX_OPTIONS = 5,
    employees = [],
    socket,
    currentPage = parseInt($("#resTable_paginate span .current").attr("data-dt-idx")),
    tableRequestSequence = 0,
    res = [];

    if (navigator.onLine === true) {
      socket = io.connect('http://127.0.0.1:4000', {
        reconnection: false
      });
      socket.on('/resAddService', function(data) {
        getAllServices();
      });

      socket.on('/resEditService', function(data) {
        getAllServices();
      });

      socket.on('/resApproveReservation', function(data) {
        var currentPage = parseInt($("#resTable_paginate span .current").attr("data-dt-idx"));
        if (window.Notification && Notification.permission !== "denied") {
          Notification.requestPermission(function(status) {
            var n = new Notification('Title', {
              body: 'Status changed for one of your reservations!'
            });
          });
        }
        getMyReservations(currentPage);
      });

      socket.on('/resRate', function(data) {
        $("#confirmRate").modal('hide');
        $("#alertRate").toggleClass('hidden');
        var currentPage = parseInt($("#resTable_paginate span .current").attr("data-dt-idx"));
        getMyReservations(currentPage);
      });

      socket.on('/resDeleteService', function(data) {
        getAllServices();
      });

      socket.on('/resDeleteReservation', function(data) {
        if (data.token == token) {
          $("#confirmDeleteRes").modal('hide');
          $("#alertDelete").toggleClass('hidden');
          var currentPage = parseInt($("#resTable_paginate span .current").attr("data-dt-idx"));
          getMyReservations(currentPage);
        }
      });
    }

  $("#selectList").on('change', function() {
    var selectedOption = $("#selectList option:selected"),
      description = selectedOption[0].getAttribute('data-description'),
      price = selectedOption[0].getAttribute('data-price');

    $("[name='rDescription']").val(description);
    $("[name='rPrice']").val(price);
  });

  getAllEmployees(employees);
  getAllServices();
  getMyReservations(1);

  $("[name='rFirstName']").val(user.firstName);
  $("[name='rLastName']").val(user.lastName);
  $("[name='rEmail']").val(user.email);
  $("[name='rPhone']").val(user.phone);


  $('#datetimepicker').datetimepicker({
    format: 'MM/DD/YYYY HH:mm',
    defaultDate: new Date(),
    stepping: 20,
    daysOfWeekDisabled: [0],
    showTodayButton: true,
    disabledHours: [0, 1, 2, 3, 4, 5, 6, 7, 20, 21, 22, 23]
  });

  $("[name='addResForm']").formValidation({
    framework: 'bootstrap',
    excluded: ':disabled',
    icon: {
      valid: 'glyphicon glyphicon-ok',
      invalid: 'glyphicon glyphicon-remove',
      validating: 'glyphicon glyphicon-refresh'
    },
    fields: {
      'rFirstName': {
        validators: {
          regexp: {
            regexp: '[a-zA-Z]+$',
            message: "Firstname should not contain numbers or special characters."
          }
        }
      },
      'rLastName': {
        validators: {
          regexp: {
            regexp: '[a-zA-Z]+$',
            message: "Lastname should not contain numbers or special characters."
          }
        }
      },
      'rEmail': {
        validators: {
          regexp: {
            regexp: '^[^@\\s]+@([^@\\s]+\\.)+[^@\\s]+$',
            message: 'The value is not a valid email address'
          }
        }
      },
      'rPhone': {
        validators: {
          phone: {
            country: 'Ro',
            message: 'The value entered is an %s phone number'
          }
        }
      }
    }
  }).on('change', function(e, data) {
    $("[name='addResForm]").formValidation('revalidateField', 'rFirstName');
    $("[name='addResForm']").formValidation('revalidateField', 'rLastName');
    $("[name='addResForm']").formValidation('revalidateField', 'rEmail');
    $("[name='addResForm']").formValidation('revalidateField', 'rPhone');
    if ($("[name='addResForm']").data('formValidation').isValid()) {
      $("[name='addReservation']").attr('disabled', false);
    }
  }).off().on('submit', function(e, data) {
    e.preventDefault();
    var socket = io.connect('http://127.0.0.1:4000', {
        reconnection: false
      }),
      serviceId = $("#selectList option:selected")[0].value,
      date = $("#datetimepicker").val(),
      carNr = $("#selectCar option:selected")[0].innerText,
      firstName = $("[name='rFirstName']").val(),
      lastName = $("[name='rLastName']").val(),
      email = $("[name='rEmail']").val(),
      phone = $("[name='rPhone']").val(),
      mentions = $("[name='rMentions']").val();

    socket.emit('/addReservation', {
      token: token,
      userId: user.userId,
      serviceId: serviceId,
      date: date,
      carNr: carNr,
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: phone,
      mentions: mentions
    });

    socket.on('/resAddReservation', function(data) {
      $("#newReservation").removeClass("in");
      $("#alertAdd").toggleClass('hidden');
      var currentPage = parseInt($("#resTable_paginate span .current").attr("data-dt-idx"));
      getMyReservations(currentPage);
    });
  });

  function getAllServices() {

    $.ajax({
      url: appConfig.url + appConfig.api + 'getAllServices?token=' + token,
      type: 'GET',
      dataType: 'json',
      beforeSend: function(xhr) {
        xhr.withCredentials = true;
      },
      success: function(services) {
        $("[name='rDescription']").val(services[0].description);
        $("[name='rPrice']").val(services[0].price);
        $("#selectList").empty();
        for (var i = 0; i < services.length; i++) {
          var option = '<option value="' + services[i].serviceId + '" data-description="' + services[i].description + '" data-price="' + services[i].price + '">' + services[i].title + '</option>';
          $("#selectList").append(option)
        }
      },
      error: function(error) {
        console.log(error);
      }
    });
  }

  function getMyReservations(page) {
    $.ajax({
      url: appConfig.url + appConfig.api + 'getMyReservations',
      data: {
        token: token,
        userId: user.userId
      },
      type: 'get',
      beforeSend: function(xhr) {
        xhr.withCredentials = true;
      },
      success: function(reservations) {
        res = reservations;
        $("#resTable").DataTable().clear();
        var table = $('#resTable').DataTable({
          columnDefs: [{
            width: '20%',
            targets: 0
          }],
          "aoColumnDefs": [{
            bSortable: false,
            aTargets: [-1]
          }, ],
          "columnDefs": [{
            orderable: false,
            targets: -1
          }],
          stateSave: true,
          "bDestroy": true,
        });


        var j = 1;
        for (var i = 0; i < reservations.length; i++) {
          var userName = reservations[i].userFirstName + ` ` + reservations[i].userLastName,
            colorClass = colorTableRow(reservations[i].status),
            date = reservations[i].date.split(' ')[0],
            hour = reservations[i].date.split(' ')[1],
            carNr = reservations[i].carNr,
            status = reservations[i].status,
            btn, rateBtn,
            currentDay = moment(new Date(), "MM/DD/YYYY"),
            currentTime = moment(new Date(), "HH:mm"),
            rating = reservations[i].rating;

          if (status == 'Pending') {
            btn = "<span class='fa fa-trash' onclick='deleteReservation(" + reservations[i].resId + ")'></span>";
          } else {
            btn = "";
          }

          if (rating > 0) {
            rateBtn = "<div class='rate_row'></div>";
          } else {
            if (status == 'Approved' && (moment.duration(moment(reservations[i].date, 'MM/DD/YYYY').diff(moment(new Date()))).asDays() < 0)) {
              if (moment.duration(moment(reservations[i].date, 'MM/DD/YYYY').diff(moment(new Date())))._data.days == 0) {
                if (moment().format('HH:mm') > hour) {
                  rateBtn = "<span class='fa fa-star' onclick='rate(" + reservations[i].resId + ")'></span>";
                } else {
                  rateBtn = "";
                }
              } else {
                rateBtn = "<span class='fa fa-star' onclick='rate(" + reservations[i].resId + ")'></span>";
              }
            } else {
              rateBtn = "";
            }
          }

          table.row.add([
              j,
              userName,
              reservations[i].title,
              date,
              hour,
              status,
              rateBtn,
              btn
            ]).draw(false)
            .nodes()
            .to$()
            .addClass(colorClass)
            .attr('id', 'td' + reservations[i].resId)

          if (rating > 0 && status == 'Approved') {
            $("#td" + reservations[i].resId + " .rate_row").starwarsjs({
              stars: rating,
              disable: 0
            });
          }
          j++;

        }
      },
      error: function(xhr, ajaxOptions, thrownError) {
        console.log(xhr);
      },
    }).done(function() {
      page--;
      $("#resTable").DataTable().page(page).draw(false);
    });

    $('#resTable').on('click', 'tr', function() {
      var nextRow = $(this).next()[0];
        $("#resTable tr.in").remove();
        for (let i = 0; i < res.length; i++) {
          if (this.id == 'td' + res[i].resId) {
            if (res[i].employeeId) {
              for (let j = 0; j < employees.length; j++) {
                if (employees[j].userId == res[i].employeeId) {
                  $("#td" + res[i].resId + " td:not(:last-of-type)").attr('data-toggle', 'collapse').attr('data-target', '#' + res[i].resId)
                  $("#td" + res[i].resId + " td:nth-child(7)").removeAttr('data-toggle').removeAttr('data-target')
                  $("#td" + res[i].resId).after(`<tr id="` + res[i].resId + `" class="collapse" aria-expanded="false"><td colspan="8"><div>
                  <p><strong>Client's email:</strong> ` + res[i].userEmail + ` <strong>Client's phone:</strong> ` + res[i].userPhone + `</p>
                  <br>
                  <p><strong>Service's description:</strong> ` + res[i].description + ` <strong>Service's price:</strong> ` + res[i].price + ` RON</p>
                  <br>
                  <p><strong>Employee's name:</strong> ` + employees[j].firstName + ` ` + employees[j].lastName + `</p>
                  <p><strong>Employee's email:</strong> ` + employees[j].email + ` <strong>Employee's phone:</strong> ` + employees[j].phone + `</p>
                  <br>
                  <p><strong>Car number:</strong> ` + res[i].carNr + `</p>
                  <p><strong>Mentions:</strong> ` + res[i].mentions + `</p>
                  <p><strong>Comment:</strong> ` + res[i].comment + `</p>
                  </div></td></tr>`)
                  j = employees.length;
                }
              }
            } else {
              $("#td" + res[i].resId + " td:not(:last-of-type)").attr('data-toggle', 'collapse').attr('data-target', '#' + res[i].resId)
              $("#td" + res[i].resId + " td:nth-child(7)").removeAttr('data-toggle').removeAttr('data-target')
              $("#td" + res[i].resId).after(`<tr id="` + res[i].resId + `" class="collapse" aria-expanded="false"><td colspan="8"><div>
              <p><strong>Client's email:</strong> ` + res[i].userEmail + ` <strong>Client's phone:</strong> ` + res[i].userPhone + `</p>
              <br>
              <p><strong>Service's description:</strong> ` + res[i].description + ` <strong>Service's price:</strong> ` + res[i].price + ` RON</p>
              <br>
              <p><strong>Car number:</strong> ` + res[i].carNr + `</p>
              <p><strong>Mentions:</strong> ` + res[i].mentions + `</p>
              <p><strong>Comment:</strong> ` + res[i].comment + `</p>
              </div></td></tr>`)
          }
        }
      }
    });
  }

  function colorTableRow(status) {
    return (status == 'Approved') ? "info" : (status == "Rejected" ? "danger" : "white");
  }
});

function deleteReservation(resId) {
  $("#confirmDeleteRes").modal('show');

  $("#modal-btn-delete-answer").on('click', function() {

    var socket = io.connect('http://127.0.0.1:4000', {
      reconnection: false
    });

    socket.emit('/deleteReservation', {
      token: token,
      resId: resId
    });
  })
}

function rate(resId) {
  $("#confirmRate .rate_row").empty();
  let nrOfStars = 0,
    comment;

  $("#confirmRate").modal('show');
  $("#confirmRate .rate_row").starwarsjs({
    stars: 5,
    on_select: function(data) {
      nrOfStars = data;
    }
  });
  $("#confirmRate button.btn-primary").on('click', function() {

    comment = $("[name='rComment']")[0].value;

    var socket = io.connect('http://127.0.0.1:4000', {
      reconnection: false
    });

    socket.emit('/rate', {
      token: token,
      resId: resId,
      nrOfStars: nrOfStars,
      comment: comment
    });
  })
}

function getAllEmployees(employees) {
  $.ajax({
    url: appConfig.url + appConfig.api + 'getAllEmployees',
    type: 'GET',
    cache: true,
    dataType: 'json',
    data: {
      token: token
    },
    beforeSend: function(xhr) {
      xhr.withCredentials = true;
    },
    success: function(employeess) {
      for (let i = 0; i < employeess.length; i++) {
        employees.push(employeess[i]);
      }
    },
    error: function(error) {
      console.log(error);
    }
  })
}
