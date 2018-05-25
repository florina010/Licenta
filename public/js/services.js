"use strict";

$(document).ready(function() {
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
      $("#servicesTable").DataTable().clear();

      var servicesTable = $('#servicesTable').DataTable({
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

      var j = 1,
        active;
      for (var i = 0; i < services.length; i++) {
        servicesTable.row.add([
            j,
            services[i].title,
            services[i].description,
            services[i].duration,
            services[i].price,
            '<a class="btn btn-defaul glyphicon glyphicon-pencil" href="#" data-toggle="modal" data-target="#editUser" onclick="editUserA(this, ' + services[i].userId + ')"></a>'
          ]).draw(false)
          .nodes()
          .to$()
          .attr('role', 'button');
        j++;
      }
    }).done(function() {
      page--;
      $("#services").DataTable().page(page).draw(false);
    });
  }
