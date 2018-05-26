"use strict";

$(document).ready(function() {
  $(document).on('click', '.list-group-item', function(e) {
    e.preventDefault()
    $(this).tab('show')
  });

  var user = JSON.parse(sessionStorage.getItem('user')),
    token = sessionStorage.getItem('token'),
    currentPage = parseInt($("#userTable_paginate span .current").attr("data-dt-idx")),
    MAX_OPTIONS = 5,
    socket = io.connect('http://127.0.0.1:4000');

  socket.on('/resAddService', function(data) {
    var currentPage = parseInt($("#servicesTable_paginate span .current").attr("data-dt-idx"));
    getAllServices(currentPage);
    $('#newService').modal('toggle');
  });
  getAllServices(currentPage);
  $("[name='addServiceForm']").formValidation({
    framework: 'bootstrap',
    excluded: ':disabled',
    icon: {
      valid: 'glyphicon glyphicon-ok',
      invalid: 'glyphicon glyphicon-remove',
      validating: 'glyphicon glyphicon-refresh'
    },
    // err: {
    //   container: 'tooltip'
    // },
    fields: {
      'sTitle': {
        validators: {
          regexp: {
            regexp: '[a-zA-Z]+$',
            message: "Title should not contain numbers or special characters."
          }
        }
      },
      'sDescription': {
        validators: {
          regexp: {
            regexp: '[a-zA-Z]+$',
            message: "Description should not contain numbers or special characters."
          }
        }
      },
      'sDuration': {
        notEmpty: {
          message: 'The duration is required'
        },
        numeric: {
          message: 'The price must be a numeric number'
        }
      },
      'sPrice': {
        validators: {
          notEmpty: {
            message: 'The price is required'
          },
          numeric: {
            message: 'The price must be a numeric number'
          }
        }
      }
    }
  }).on('change', function(e, data) {
    $("[name='addServiceForm']").formValidation('revalidateField', 'sTitle');
    $("[name='addServiceForm']").formValidation('revalidateField', 'sDescription');
    $("[name='addServiceForm']").formValidation('revalidateField', 'sDuration');
    $("[name='addServiceForm']").formValidation('revalidateField', 'sPrice');
    if ($("[name='addServiceForm']").data('formValidation').isValid()) {
      $("[name='submitAdd']").attr('disabled', false);
    }
  }).on('submit', function(e, data) {
    var title = $("[name='sTitle']").val(),
      description = $("[name='sDescription']").val(),
      duration = $("[name='sDuration']").val(),
      price = $("[name='sPrice']").val();
    socket.emit('/addService', {
      token: token,
      title: title,
      description: description,
      duration: duration,
      price: price
    });
  });

});

function getAllServices(page) {
  $.get(appConfig.url + appConfig.api + 'getAllServices?token=' + token, function(services) {
    for (var i = 0; i < services.length; i++) {
      var a = "<a class='list-group-item list-group-item-action' id='list-" + services[i].serviceId + "-list' data-toggle='list' href='#list-" + services[i].serviceId + "' role='tab' aria-controls='" + services[i].serviceId + "'>" + services[i].title + "</a>";
      var div = "<div class='tab-pane fade' id='list-" + services[i].serviceId + "' role='tabpanel' aria-labelledby='list-" + services[i].serviceId + "-list'>" + services[i].description + "</div>"
      // <div class="tab-pane fade show active" id="list-home" role="tabpanel" aria-labelledby="list-home-list">.fsd..</div>
      $("#list-tab").append(a);
      $("#nav-tabContent").append(div);
      // <a class="list-group-item list-group-item-action active" id="list-home-list" data-toggle="list" href="#list-home" role="tab" aria-controls="home">Home</a>
    }
  })
}
