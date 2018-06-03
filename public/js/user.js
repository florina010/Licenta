"use strict";

$(document).ready(function() {
  var user = JSON.parse(sessionStorage.getItem('user')),
    token = sessionStorage.getItem('token'),
    MAX_OPTIONS = 5,
    socket = io.connect('http://127.0.0.1:4000');

  socket.on('/resAddService', function(data) {
    getAllServices();
  });

  socket.on('/resEditService', function(data) {
    getAllServices();
  });

  getAllServices();
  getMyReservations();

  $("[name='rFirstName']").val(user.firstName);
  $("[name='rLastName']").val(user.lastName);
  $("[name='rEmail']").val(user.email);
  $("[name='rPhone']").val(user.phone);

  $(function() {
    $('#datetimepicker').datetimepicker({
      format: 'MM/DD/YYYY HH:mm',
      minDate: new Date(),
      stepping: 20,
      daysOfWeekDisabled: [0],
      showTodayButton: true,
      disabledHours: [0,1,2,3,4,5,6,7,20,21,22,23]
    });
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
      date = $("#datetimepicker input").val(),
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
        getMyReservations();
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

  function getMyReservations() {
    console.log(1);
    $.get(appConfig.url + appConfig.api + 'getMyReservations?token=' + token + '&userId=' + user.userId, function(reservations) {
      console.log(reservations);
  });
  }
});
