"use strict";

$(document).ready(function() {
  var user = JSON.parse(sessionStorage.getItem('user')),
    token = sessionStorage.getItem('token'),
    MAX_OPTIONS = 5,
    employees = [],
    socket = io.connect('http://127.0.0.1:4000'),
    currentPage = parseInt($("#resTable_paginate span .current").attr("data-dt-idx"));


  socket.on('/resAddReservation', function(data) {
    var currentPage = parseInt($("#resTable_paginate span .current").attr("data-dt-idx"));
    getAllReservations(currentPage);
  });

  socket.on('/resApproveReservation', function(data) {
    var currentPage = parseInt($("#resTable_paginate span .current").attr("data-dt-idx"));
    getAllReservations(currentPage);
  });

  socket.on('/resDeleteReservation', function(data) {
    var currentPage = parseInt($("#resTable_paginate span .current").attr("data-dt-idx"));
    getAllReservations(currentPage);
  });

  socket.on('/resRate', function(data) {
    var currentPage = parseInt($("#resTable_paginate span .current").attr("data-dt-idx"));
    getAllReservations(currentPage);
  });

  getAllEmployees(employees);
  getAllReservations(currentPage);

  function getAllReservations(page) {
    $.ajax({
      url: appConfig.url + appConfig.api + 'getAllReservations?token=' + token + '&userId=' + user.userId,
      type: 'GET',
      //  cache: true,
      dataType: 'json',
      success: function(reservations) {
        $("#resTable").DataTable().clear();
        $('#resTable').find('th').eq(6).text('Change status');
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
            colorClass = colorTableRow(reservations[i].status),
            date = reservations[i].date.split(' ')[0],
            hour = reservations[i].date.split(' ')[1],
            status = reservations[i].status,
            approveButtons;

          if (status == 'Approved') {
            approveButtons = "<span class='fa fa-times' onclick='displayApproveModal(" + reservations[i].resId + ", 0)'></span>";
          } else if (status == "Rejected") {
            approveButtons = "<span class='fa fa-check' onclick='displayApproveModal(" + reservations[i].resId + ",\"" + reservations[i].date + "\", 1)'></span>";
          } else {
            approveButtons = "<span class='fa fa-check' onclick='displayApproveModal(" + reservations[i].resId + ",\"" + reservations[i].date + "\", 1)'></span>";
            approveButtons += "<span class='fa fa-times' onclick='displayApproveModal(" + reservations[i].resId + ", 0)'></span>";
          }


          table.row.add([
              j,
              userName,
              reservations[i].title,
              date,
              hour,
              status,
              approveButtons
            ]).draw(false)
            .nodes()
            .to$()
            .addClass(colorClass)
            .attr('id', 'td' + reservations[i].resId)
          j++;

        }

        for (let i = 0; i < reservations.length; i++) {
          if (reservations[i].employeeId) {
            for (let j = 0; j < employees.length; j++) {
              if (employees[j].userId == reservations[i].employeeId) {
                $("#td" + reservations[i].resId + " td:not(:last-of-type)").attr('data-toggle', 'collapse').attr('data-target', '#' + reservations[i].resId)
                $("#td" + reservations[i].resId).after(`<tr id="` + reservations[i].resId + `" class="collapse" aria-expanded="false"><td colspan="8"><div>
                  <p><strong>Client's email</strong> ` + reservations[i].userEmail + ` <strong>Client's phone</strong> ` + reservations[i].userPhone + `</p>
                  <br>
                  <p><strong>Service's description</strong> ` + reservations[i].description + ` <strong>Service's price</strong> ` + reservations[i].price + `</p>
                  <br>
                  <p><strong>Employee's name</strong> ` + employees[j].firstName + ` ` + employees[j].lastName + `</p>
                  <p><strong>Employee's email</strong> ` + employees[j].email + ` <strong>Employee's phone</strong> ` + employees[j].phone + `</p>
                  <br>
                  <p><strong>Car number<strong> ` + reservations[i].carNr + `</p>
                  <p><strong>Mentions</strong> ` + reservations[i].mentions + `</p>
                  </div></td></tr>`)
                j = employees.length;
              }
            }
          } else {
            $("#td" + reservations[i].resId + " td:not(:last-of-type)").attr('data-toggle', 'collapse').attr('data-target', '#' + reservations[i].resId)
            $("#td" + reservations[i].resId).after(`<tr id="` + reservations[i].resId + `" class="collapse" aria-expanded="false"><td colspan="8"><div>
              <p><strong>Client's email</strong> ` + reservations[i].userEmail + ` <strong>Client's phone</strong> ` + reservations[i].userPhone + `</p>
              <br>
              <p><strong>Service's description</strong> ` + reservations[i].description + ` <strong>Service's price</strong> ` + reservations[i].price + `</p>
              <br>
              <p><strong>Car number<strong> ` + reservations[i].carNr + `</p>
              <p><strong>Mentions</strong> ` + reservations[i].mentions + `</p>
              </div></td></tr>`)
          }
        }
      },
      error: function(error) {
        console.log(error);
      }
    }).done(function() {
      page--;
      $("#user").DataTable().page(page).draw(false);
    });
  }
});


function displayApproveModal(resId, date, action) {
  var socket = io.connect('http://127.0.0.1:4000'),
    status, employeeId;
  if (action) {
    $("#approveRes").modal('show');

    $.ajax({
        url: appConfig.url + appConfig.api + 'getAllFreeEmployees?token=' + token + '&date=' + date,
        type: 'GET',
        //  cache: true,
        dataType: 'json',
        success: function(employees) {
          for (var i = 0; i < employees.length; i++) {
            var info = '09',
              option = '<option value="' + employees[i].userId + '" title="' + info + '">' + employees[i].firstName + ' ' + employees[i].lastName + '</option>';
            $("#selectEmp").append(option)
          }

          $('#selectEmp').multiselect({
            maxHeight: 300,
            enableFiltering: true,
          });
        },
        error: function(error) {
          console.log(error);
        }
      }).then(function() {
        $("[name='submitApprove']").on('click', function() {

          employeeId = $("ul.multiselect-container:first li.active a label input")[0].value;
          status = 'Approved';

          socket.emit('/approveReservation', {
            token: token,
            userId: user.userId,
            employeeId: employeeId,
            status: status,
            resId: resId
          });
        })
      });
    }
    else {
      status = "Rejected";
      socket.emit('/approveReservation', {
        token: token,
        userId: user.userId,
        employeeId: 0,
        status: status,
        resId: resId
      });
    }
  }


  function colorTableRow(status) {
    return (status == 'Approved') ? "info" : (status == "Rejected" ? "danger" : "white");
  }

  function getAllEmployees(employees) {
    $.ajax({
        url: appConfig.url + appConfig.api + 'getAllEmployees?token=' + token,
        type: 'GET',
        //  cache: true,
        dataType: 'json',
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
