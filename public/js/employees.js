"use strict";

$(document).ready(function() {

  var user = JSON.parse(sessionStorage.getItem('user')),
    token = sessionStorage.getItem('token'),
    currentPage = parseInt($("#userTable_paginate span .current").attr("data-dt-idx")),
    MAX_OPTIONS = 5,
    res = [],
    socket = io.connect('http://127.0.0.1:4000', {
      reconnection: false
    });
  if (user.admin == 2) {
    socket.on('/resEditUser', function(data) {
      var currentPage = parseInt($("#userTable_paginate span .current").attr("data-dt-idx"));
      $('#editUser').modal('hide');
      populateTable(currentPage);
    });

    socket.on('/resAddUser', function(data) {
      var currentPage = parseInt($("#userTable_paginate span .current").attr("data-dt-idx"));
      populateTable(currentPage);
      $('#newUser').modal('hide');
    });
  }

  $('#reportDate').datetimepicker({
    format: 'MM/DD/YYYY',
    maxDate: new Date(),
  });
  $("[name='reports']").on('click', function() {
    var employeesIds = [],
      month = 0,
      date = 0;
    $("#target8 ul.multiselect-container:first li.active a label input").each(function() {
      employeesIds.push(this.value);
    });

    if (employeesIds[0] == 0) {
      employeesIds.shift()
    }

    if ($("#target8 #day").attr('checked', false)) {
      month = $("#target8 ul.multiselect-container:last li.active a label input").val();
    }

    if ($("#target8 #day").attr('checked', true)) {
      date = $("#reportDate").val();
    }
    $.ajax({
      url: appConfig.url + appConfig.api + 'getReport',
      data: {
        token: token,
        employeesIds: employeesIds,
        month: month,
        date: date
      },
      type: 'GET',
      dataType: 'json',
      beforeSend: function(xhr) {
        xhr.withCredentials = true;
      },
      success: function(reports) {
        $("#reportsTable").DataTable().clear();
        var table = $('#reportsTable').DataTable({
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
          stateSave: true,
          "bDestroy": true,
          dom: 'Bfrtip',
          buttons: [
            'excel', 'pdf', 'print'
        ]
        });

        var j = 1;
        for (var i = 0; i < reports.length; i++) {
          var reservationsNr = 0,
            starsNr = 0,
            minNr = 0,
            name = 0;
          if (reports[i].datas.length > 1) {
            for (let l = 0; l < reports[i].datas.length; l++) {
              reservationsNr = reports[i].datas[l].count;
              minNr = reservationsNr * 20;
              starsNr += reports[i].datas[l].rating;
              name = reports[i].datas[l].firstName + ' ' + reports[i].datas[l].lastName;
            }
          } else {
            reservationsNr = reports[i].datas.count;
            minNr = reservationsNr * 20;
            starsNr = reports[i].datas.rating;
            name = reports[i].datas.firstName + ' ' + reports[i].datas.lastName;
          }
          table.row.add([
              j,
              name,
              minNr,
              reservationsNr,
              starsNr
            ]).draw(false)
            .nodes()
            .to$()

          j++;

        }
      },
      error: function(error) {
        console.log(error);
      }
    });

  })

  $("#target8 #month").attr('checked', true);
  $("#target8 #month").parent().addClass('active focus');
  $("#target8 #day").attr('checked', false);
  $("#target8 #day").parent().removeClass('active focus');
  $("#reportDate").css('display', 'none');

  $("#target8 #month").on('click', function() {
    $("#target8 #day").attr('checked', false);
    $("#target8 #day").parent().removeClass('active focus');
    $("#reportDate").css('display', 'none');
    $("#target8 button.multiselect").css('display', 'block');
  });

  $("#target8 #day").on('click', function() {
    $("#target8 #month").attr('checked', false);
    $("#target8 #month").parent().removeClass('active focus');
    $("#target8 button.multiselect:not(:first)").css('display', 'none');
    $("#reportDate").css('display', 'inline');
  });


  $('#selectMonth option').each(function(op) {
    if (this.value == moment().format('M')) {
      $(this).prop('selected', 'true');
    }
  })
  $('#selectMonth').multiselect({
    maxHeight: 300
  });

  $("#reportsTable").DataTable({});


  $("[name='addUserForm']").formValidation({
    framework: 'bootstrap',
    excluded: ':disabled',
    icon: {
      valid: 'glyphicon glyphicon-ok',
      invalid: 'glyphicon glyphicon-remove',
      validating: 'glyphicon glyphicon-refresh'
    },
    fields: {
      'uFirstName': {
        validators: {
          regexp: {
            regexp: '[a-zA-Z]+$',
            message: "Firstname should not contain numbers or special characters."
          }
        }
      },
      'uLastName': {
        validators: {
          regexp: {
            regexp: '[a-zA-Z]+$',
            message: "Lastname should not contain numbers or special characters."
          }
        }
      },
      'uEmail': {
        validators: {
          regexp: {
            regexp: '^[^@\\s]+@([^@\\s]+\\.)+[^@\\s]+$',
            message: 'The value is not a valid email address'
          }
        }
      },
      'uPhoneNumber': {
        validators: {
          phone: {
            country: 'Ro',
            message: 'The value entered is an %s phone number'
          }
        }
      }
    }
  }).on('change', function(e, data) {
    $("[name='addUserForm']").formValidation('revalidateField', 'uFirstName');
    $("[name='addUserForm']").formValidation('revalidateField', 'uLastName');
    $("[name='addUserForm']").formValidation('revalidateField', 'uEmail');
    $("[name='addUserForm']").formValidation('revalidateField', 'uPhoneNumber');
    if ($("[name='addUserForm']").data('formValidation').isValid()) {
      $("[name='submitAdd']").attr('disabled', false);
    }
  }).on('submit', function(e, data) {
    var hashObj = new jsSHA("SHA-512", "TEXT", {
      numRounds: 1
    });
    hashObj.update('washyourcar');
    var password = hashObj.getHash("HEX"),
      firstName = $("[name='uFirstName']").val(),
      lastName = $("[name='uLastName']").val(),
      email = $("[name='uEmail']").val(),
      phone = $("[name='uPhoneNumber']").val();
    socket.emit('/addUser', {
      token: token,
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password,
      phone: phone
    });
  });

  populateTable(1);
});


function populateTable(page) {
  $.ajax({
    url: appConfig.url + appConfig.api + 'getAllEmployees?token=' + token,
    type: 'GET',
    dataType: 'json',
    success: function(employees) {
      $("#userTable").DataTable().clear();
      var table = $('#userTable').DataTable({
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

      for (var i = 0; i < employees.length; i++) {
        var info = '09',
          option = '<option value="' + employees[i].userId + '" title="' + info + '">' + employees[i].firstName + ' ' + employees[i].lastName + '</option>';
        $("#selectEmployees").append(option);
      }

      $('#selectEmployees').multiselect({
        maxHeight: 300,
        enableFiltering: true,
        includeSelectAllOption: true,
        selectAllValue: 0
      });

      var j = 1,
        active;
      for (var i = 0; i < employees.length; i++) {
        if (employees[i].isActive) {
          active = 'Yes';
        } else {
          active = 'No';
        }

        table.row.add([
            j,
            employees[i].firstName,
            employees[i].lastName,
            employees[i].email,
            employees[i].phone,
            active,
            '<a class="btn btn-defaul glyphicon glyphicon-pencil" href="#" data-toggle="modal" data-target="#editUser" onclick="editUserA(this, ' + employees[i].userId + ')"></a>'
          ]).draw(false)
          .nodes()
          .to$()
          .attr('role', 'button');
        j++;
      }
    },
    error: function(error) {
      console.log(error);
    }
  }).done(function() {
    page--;
    $("#userTable").DataTable().page(page).draw(false);
  });
}

function editUserA(elem, employee) {
  var tr = $(elem).closest("tr");
  var userInfo = tr.find("td");
  var firstName = userInfo.eq(1).text(),
    lastName = userInfo.eq(2).text(),
    email = userInfo.eq(3).text(),
    phone = userInfo.eq(4).text(),
    isActive = userInfo.eq(5).text(),
    currentPage = parseInt($("#userTable_paginate span .current").attr("data-dt-idx"));

  $("[name='editUserForm']").find("input[name='euFirstName']").val(firstName);
  $("[name='editUserForm']").find("input[name='euLastName']").val(lastName);
  $("[name='editUserForm']").find("input[name='euEmail']").val(email);
  $("[name='editUserForm']").find("input[name='euPhoneNumber']").val(phone);

  if (isActive == 'Yes') {
    $("[name='editUserForm'] #active").attr('checked', true);
    $("[name='editUserForm'] #active").parent().addClass('active focus');
    $("[name='editUserForm'] #inactive").attr('checked', false);
    $("[name='editUserForm'] #inactive").parent().removeClass('active focus');
  } else {
    $("[name='editUserForm'] #inactive").attr('checked', true);
    $("[name='editUserForm'] #inactive").parent().addClass('active focus');
    $("[name='editUserForm'] #active").attr('checked', false);
    $("[name='editUserForm'] #active").parent().removeClass('active focus');
  }

  $("[name='editUserForm']").formValidation({
    framework: 'bootstrap',
    excluded: ':disabled',
    icon: {
      valid: 'glyphicon glyphicon-ok',
      invalid: 'glyphicon glyphicon-remove',
      validating: 'glyphicon glyphicon-refresh'
    },
    fields: {
      'euFirstName': {
        validators: {
          regexp: {
            regexp: '[a-zA-Z]+$',
            message: "Firstname should not contain numbers or special characters."
          }
        }
      },
      'euLastName': {
        validators: {
          regexp: {
            regexp: '[a-zA-Z]+$',
            message: "Lastname should not contain numbers or special characters."
          }
        }
      },
      'euEmail': {
        validators: {
          regexp: {
            regexp: '^[^@\\s]+@([^@\\s]+\\.)+[^@\\s]+$',
            message: 'The value is not a valid email address'
          }
        }
      },
      'euPhoneNumber': {
        validators: {
          phone: {
            country: 'Ro',
            message: 'The value entered is an %s phone number'
          }
        }
      }
    }
  }).on('change', function(e, data) {
    $("[name='editUserForm']").formValidation('revalidateField', 'euFirstName');
    $("[name='editUserForm']").formValidation('revalidateField', 'euLastName');
    $("[name='editUserForm']").formValidation('revalidateField', 'euEmail');
    $("[name='editUserForm']").formValidation('revalidateField', 'euPhoneNumber');
    if ($("[name='editUserForm']").data('formValidation').isValid()) {
      $("[name='submitEdit']").attr('disabled', false);
    }
  }).on('submit', function(e, data) {
    var socket = io.connect('http://127.0.0.1:4000', {
        reconnection: false
      }),
      isActive;

    if (($("#active").parent().hasClass('active'))) {
      isActive = 1;
    } else if ($("#inactive").parent().hasClass('active')) {
      isActive = 0;
    }


    var firstName = $("[name='euFirstName']").val(),
      lastName = $("[name='euLastName']").val(),
      email = $("[name='euEmail']").val(),
      phone = $("[name='euPhoneNumber']").val();
    socket.emit('/editUser', {
      token: token,
      id: employee,
      firstName: firstName,
      lastName: lastName,
      email: email,
      isActive: isActive,
      phone: phone
    });
  });
}
