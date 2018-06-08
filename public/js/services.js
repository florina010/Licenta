"use strict";
if ('serviceWorker' in navigator) {

  navigator.serviceWorker
    .register('./service-worker.js', {
      scope: './'
    })
    .then(function(registration) {
      console.log("Service Worker Registered");
    })
    .catch(function(err) {
      console.log("Service Worker Failed to Register", err);
    })

}

$(document).ready(function() {

  $(document).on('click', '.list-group-item', function(e) {
    e.preventDefault()
    $(this).tab('show')
  });

  var user = JSON.parse(sessionStorage.getItem('user')),
    token = sessionStorage.getItem('token'),
    MAX_OPTIONS = 5,
    socket = io.connect('http://127.0.0.1:4000');

  socket.on('/resAddService', function(data) {
    var page = $("#pagination li.active a")[0].innerHTML;
    getAllServices(page);
  });

  socket.on('/resEditService', function(data) {
    var page = $("#pagination li.active a")[0].innerHTML;
    getAllServices(page);
  });

  getAllServices(1);

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
    $("[name='addServiceForm']").formValidation('revalidateField', 'sPrice');
    if ($("[name='addServiceForm']").data('formValidation').isValid()) {
      $("[name='submitAdd']").attr('disabled', false);
    }
  }).off().on('submit', function(e, data) {
    e.preventDefault();
    var title = $("[name='sTitle']").val(),
      description = $("[name='sDescription']").val(),
      price = $("[name='sPrice']").val(),
      socket = io.connect('http://127.0.0.1:4000');
    socket.emit('/addService', {
      token: token,
      title: title,
      description: description,
      price: price
    });
  });
});



function getAllServices(page) {
  $.ajax({
    url: appConfig.url + appConfig.api + 'getAllServices?token=' + token,
    type: 'GET',
  //  cache: true,
    dataType: 'json',
    success: function(services) {
      $('#pagination').pagination({
        dataSource: services,
        totalNumber: services.length,
        pageSize: 10,
        pageNumber: page,
        autoHidePrevious: true,
        autoHideNext: true,
        callback: function(data, pagination) {
          $("#list-tab").empty()
          $("#nav-tabContent").empty();
          for (var i = 0; i < data.length; i++) {
            var a = "<a class='list-group-item list-group-item-action' id='list-" + data[i].serviceId + "-list' data-toggle='list' href='#list-" + data[i].serviceId + "' role='tab' aria-controls='" + data[i].serviceId + "'>" + data[i].title + "</a>";
            var serviceDiv = `<div class="tab-pane fade" id="list-` + data[i].serviceId + `"role='tabpanel' aria-labelledby='list-` + data[i].serviceId + `-list'>` +
              `<form name="editServiceForm" role="form" id="form` + data[i].serviceId + `">` +
              `<div class='form-group input-group col-xs-6'>
                              <label><span class='glyphicon glyphicon-pencil'></span> Title</label>
                              <input autocomplete="off" type="text" class="form-control" name="eTitle" value="` + data[i].title + `"/>
                            </div>` +
              `<div class="form-group input-group col-xs-3">
                              <label><i class="fa fa-money-bill-alt" aria-hidden="true"></i> Price</label>
                              <input autocomplete="off" class="form-control disabled-button" name="ePrice" value="` + data[i].price + `"/>
                            </div>` +
              `<div class="form-group col-xs-9">
                              <label><span class="glyphicon glyphicon-info-sign"></span> Description</label>
                              <textarea autocomplete="off" class="form-control" name="eDescription" rows="4" cols="7" required>` + data[i].description + `</textarea>
                            </div>` +
              `<div class="form-group col-xs-4">
                             <button type="submit" class="btn btn-primary" name="submitEdit" disabled="disabled" id="` + data[i].serviceId + `">Save</button>
                             <button type="button" class="btn btn-danger" onclick='deleteService(` + data[i].serviceId + `)'">Delete</button>
                           </div>` +
              `</form></div>`;
            $("#list-tab").append(a);
            $("#nav-tabContent").append(serviceDiv);
            $("#form" + data[i].serviceId).formValidation({
              framework: 'bootstrap',
              excluded: ':disabled',
              icon: {
                valid: 'glyphicon glyphicon-ok',
                invalid: 'glyphicon glyphicon-remove',
                validating: 'glyphicon glyphicon-refresh'
              },
              fields: {
                'eTitle': {
                  validators: {
                    regexp: {
                      regexp: '[a-zA-Z0-9]+$',
                      message: "Title should not contain numbers or special characters."
                    }
                  }
                },
                'eDescription': {
                  validators: {
                    regexp: {
                      regexp: '[a-zA-Z0-9]+$',
                      message: "Description should not contain numbers or special characters."
                    }
                  }
                },
                'ePrice': {
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
              $("[name='editServiceForm']").formValidation('revalidateField', 'eTitle');
              $("[name='editServiceForm']").formValidation('revalidateField', 'eDescription');
              $("[name='editServiceForm']").formValidation('revalidateField', 'ePrice');
              if ($("[name='editServiceForm']").data('formValidation').isValid()) {
                $("[name='submitEdit']").attr('disabled', false);
              }
            }).off().on('submit', function(e, data) {
              e.preventDefault();
              var title = $("#" + e.target.id + " [name='eTitle']").val(),
                description = $("#" + e.target.id + " [name='eDescription']").val(),
                price = $("#" + e.target.id + " [name='ePrice']").val(),
                serviceId = e.target.id,
                socket = io.connect('http://127.0.0.1:4000');
              socket.emit('/editService', {
                token: token,
                serviceId: serviceId,
                title: title,
                description: description,
                price: price
              });
            });
          }
        }
      });
    },
    error: function(error) {
      console.log(error);
    }
  });
}

function deleteService(serviceId) {
  $("#confirmDeleteRes").modal('show');

  $("#modal-btn-delete-answer").off().on('click', function() {

    var socket = io.connect('http://127.0.0.1:4000');
    socket.emit('/deleteService', {
      token: token,
      serviceId: serviceId
    });

    socket.on('/resDeleteService', function(data) {
      $("#confirmDeleteRes").modal('hide');
      var page = $("#pagination li.active a")[0].innerHTML;
      getAllServices(page);
    });
  })
}
