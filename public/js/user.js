"use strict";

$(document).ready(function() {
  var user = JSON.parse(sessionStorage.getItem('user')),
    token = sessionStorage.getItem('token'),
    MAX_OPTIONS = 5,
    socket = io.connect('http://127.0.0.1:4000'),
    currentPage = parseInt($("#resTable_paginate span .current").attr("data-dt-idx"));

    $('#resTable thead tr').append('<th>Delete</th>')

  socket.on('/resAddService', function(data) {
    getAllServices();
  });

  socket.on('/resEditService', function(data) {
    getAllServices();
  });

  socket.on('/resApproveReservation', function(data) {
    var currentPage = parseInt($("#resTable_paginate span .current").attr("data-dt-idx"));
    getMyReservations(currentPage);
  });

  socket.on('/resDeleteService', function(data) {
    getAllServices();
  });

  getAllServices();
  getMyReservations(currentPage);

  $("[name='rFirstName']").val(user.firstName);
  $("[name='rLastName']").val(user.lastName);
  $("[name='rEmail']").val(user.email);
  $("[name='rPhone']").val(user.phone);


  $('#datetimepicker').datetimepicker({
    format: 'MM/DD/YYYY HH:mm',
    // minDate: new Date(),
    defaultDate: new Date(),
    stepping: 20,
    daysOfWeekDisabled: [0],
    showTodayButton: true,
    disabledHours: [0, 1, 2, 3, 4, 5, 6, 7, 20, 21, 22, 23]
  });

  for (var i = 0; i < user.cars.length; i++) {
    var option = '<option value="' + user.cars[i].id + '">' + user.cars[i].number + '</option>';
    $("#selectCar").append(option)
  }

  $('#selectCar').multiselect();

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
    var socket = io.connect('http://127.0.0.1:4000'),
      serviceId = $("ul.multiselect-container:first li.active a label input")[0].value,
      date = $("#datetimepicker").val(),
      carNr = $("ul.multiselect-container:last li.active")[0].innerText,
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
      $("#newReservation").toggle();
      var currentPage = parseInt($("#resTable_paginate span .current").attr("data-dt-idx"));
      getMyReservations(currentPage);
    });
  });

  function getAllServices() {
    $.get(appConfig.url + appConfig.api + 'getAllServices?token=' + token, function(services) {
      for (var i = 0; i < services.length; i++) {
        var info = `Description: ` + services[i].description +
          `\n Price: ` + services[i].price,
          option = '<option value="' + services[i].serviceId + '" title="' + info + '">' + services[i].title + '</option>';
        $("#selectList").append(option)
      }

      $('#selectList').multiselect({
        maxHeight: 350,
        enableFiltering: true,
      });
    });
  }

  function getMyReservations(page) {
    $.get(appConfig.url + appConfig.api + 'getMyReservations?token=' + token + '&userId=' + user.userId, function(reservations) {
      console.log(reservations);
      $("#resTable").DataTable().clear();
      var table = $('#resTable').DataTable({
        columnDefs: [{
          width: '20%',
          targets: 0
        }],
        fixedColumns: true,
        "aoColumnDefs": [{
          bSortable: false,
          aTargets: [-1]
        }, ],
        "columnDefs": [{
          orderable: false,
          targets: -1
        }],
        "bDestroy": true
      });


      var j = 1;
      for (var i = 0; i < reservations.length; i++) {

        var userName = reservations[i].userFirstName + ` ` + reservations[i].userLastName,
            colorClass = colorTableRow (reservations[i].status),
            date = reservations[i].date.split(' ')[0],
            hour = reservations[i].date.split(' ')[1],
            carNr = reservations[i].carNr,
            status = reservations[i].status,
            btn;

        if (status == 'Pending') {
          btn = "<span class='fa fa-trash' onclick='deleteReservation(" + reservations[i].resId + ")'></span>"
        } else {
          btn = "";
        }

        table.row.add([
            j,
            userName,
            reservations[i].title,
            date,
            hour,
            status,
            'r',
            btn
          ]).draw(false)
          .nodes()
          .to$()
          .addClass(colorClass)
          .attr('id', 'td' + reservations[i].resId)

        j++;
      }

      for (var i = 0; i < reservations.length; i++) {
        $("#td" + reservations[i].resId + " td:not(:last-of-type)").attr('data-toggle', 'collapse').attr('data-target', '#' + reservations[i].resId)
          $("#td" + reservations[i].resId).after(`<tr id="` + reservations[i].resId + `" class="collapse" aria-expanded="false"><td colspan="8"><div>
          <p><strong>Client's email</strong> ` + reservations[i].userEmail +` <strong>Client's phone</strong> ` + reservations[i].userPhone +`</p>
          <br>
          <p><strong>Service's description</strong> ` + reservations[i].description +` <strong>Service's price</strong> ` + reservations[i].price +`</p>
          <br>
          <p><strong>Employee's name</strong> ` + reservations[i].employeeFirstName + ` ` + reservations[i].employeeLastName +`</p>
          <p><strong>Employee's email</strong> ` + reservations[i].employeeEmail +` <strong>Employee's phone</strong> ` + reservations[i].employeePhone +`</p>
          <br>
          <p><strong>Car number<strong> ` + reservations[i].carNr +`</p>
          <p><strong>Mentions</strong> ` + reservations[i].mentions +`</p>
        </div></td></tr>`)
      }


    }).done(function() {
      page--;
      $("#user").DataTable().page(page).draw(false);
    });
  }

  function colorTableRow (status) {
    return (status == 'Approved') ? "info" : (status == "Rejected" ? "danger" : "white");
  }
});

function deleteReservation (resId) {
    $("#confirmDeleteRes").modal('show');

    $("#modal-btn-delete-answer").on('click', function() {

      var socket = io.connect('http://127.0.0.1:4000');

      socket.emit('/deleteReservation', {
        token: token,
        resId: resId
      });

      socket.on('/resDeleteReservation', function(data) {
        $("#confirmDeleteRes").modal('hide');
        var currentPage = parseInt($("#resTable_paginate span .current").attr("data-dt-idx"));
        getMyReservations(currentPage);
      });
  })
}
