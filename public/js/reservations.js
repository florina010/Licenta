"use strict";

$(document).ready(function() {
  var user = JSON.parse(sessionStorage.getItem('user')),
    token = sessionStorage.getItem('token'),
    MAX_OPTIONS = 5,
    employees = [],
    res = [],
    socket = io.connect('http://127.0.0.1:4000'),
    currentPage = parseInt($("#resTable_paginate span .current").attr("data-dt-idx"));

    $("[data-target='#newReservation']").css('display', 'none');

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
  getAllReservations(1);

  function getAllReservations(page) {
    if (user.admin == 2) {
      var url = appConfig.url + appConfig.api + 'getAllReservations';
    } else if (user.admin == 1) {
      var url = appConfig.url + appConfig.api + 'getEmployeeReservations';
    }
    $.ajax({
      url: url,
      data: {
        token: token,
        employeeId: user.userId
      },
      type: 'GET',
      dataType: 'json',
      success: function(reservations) {
        console.log(reservations);
        res = reservations;
        $("#resTable").DataTable().clear();
       $('#resTable').find('th').eq(7).text('Change status');
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
            approveButtons,
            rateBtn,
            currentDay = moment(new Date(), "MM/DD/YYYY"),
            currentTime = moment(new Date(), "HH:mm"),
            rating = reservations[i].rating;

            if (status == 'Approved') {
              approveButtons = "<span class='fa fa-times' onclick='displayApproveModal(" + reservations[i].resId + ", 0)'></span>";
            } else if (status == "Rejected") {
              approveButtons = "<span class='fa fa-check' onclick='displayApproveModal(" + reservations[i].resId + ",\"" + reservations[i].date + "\", 1)'></span>";
            } else {
              approveButtons = "<span class='fa fa-check' onclick='displayApproveModal(" + reservations[i].resId + ",\"" + reservations[i].date + "\", 1)'></span>";
              approveButtons += "<span class='fa fa-times' onclick='displayApproveModal(" + reservations[i].resId + ", 0)'></span>";
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
              approveButtons
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
      error: function(error) {
        console.log(error);
      }
    }).done(function() {
      page--;
      $("#resTable").DataTable().page(page).draw(false);
    });

    $('#resTable').on('click','tr', function() {
      console.log(employees);
      var nextRow = $(this).next()[0];
      if (this.id == 'td' + nextRow.id) {
        nextRow.remove();
      } else {
        $("#resTable tr.in").remove();
        for (let i = 0; i < res.length; i++) {
          if(this.id == 'td' + res[i].resId) {
            if (res[i].employeeId) {
              for (let j = 0; j < employees.length; j++) {
                if (employees[j].userId == res[i].employeeId || res[i].employeeId == user.userId) {
                  $("#td" + res[i].resId + " td:not(:last-of-type)").attr('data-toggle', 'collapse').attr('data-target', '#' + res[i].resId)
                  $("#td" + res[i].resId + " td:nth-child(7)").removeAttr('data-toggle').removeAttr('data-target')
                  $("#td" + res[i].resId).after(`<tr id="` + res[i].resId + `" class="collapse" aria-expanded="false"><td colspan="8"><div>
                  <p><strong>Client's email</strong> ` + res[i].userEmail + ` <strong>Client's phone</strong> ` + res[i].userPhone + `</p>
                  <br>
                  <p><strong>Service's description</strong> ` + res[i].description + ` <strong>Service's price</strong> ` + res[i].price + `</p>
                  <br>
                  <p><strong>Employee's name</strong> ` + res[j].firstName + ` ` + employees[j].lastName + `</p>
                  <p><strong>Employee's email</strong> ` + res[j].email + ` <strong>Employee's phone</strong> ` + res[j].phone + `</p>
                  <br>
                  <p><strong>Car number</strong> ` + res[i].carNr + `</p>
                  <p><strong>Mentions</strong> ` + res[i].mentions + `</p>
                  </div></td></tr>`)
                  j = employees.length;
                }
              }
            } else {
              $("#td" + res[i].resId + " td:not(:last-of-type)").attr('data-toggle', 'collapse').attr('data-target', '#' + res[i].resId)
              $("#td" + res[i].resId + " td:nth-child(7)").removeAttr('data-toggle').removeAttr('data-target')
              $("#td" + res[i].resId).after(`<tr id="` + res[i].resId + `" class="collapse" aria-expanded="false"><td colspan="8"><div>
              <p><strong>Client's email</strong> ` + res[i].userEmail + ` <strong>Client's phone</strong> ` + res[i].userPhone + `</p>
              <br>
              <p><strong>Service's description</strong> ` + res[i].description + ` <strong>Service's price</strong> ` + res[i].price + `</p>
              <br>
              <p><strong>Car number<strong> ` + res[i].carNr + `</p>
              <p><strong>Mentions</strong> ` + res[i].mentions + `</p>
              </div></td></tr>`)
            }
          }
        }
      }
    });
  }
});


function displayApproveModal(resId, date, action) {
  var socket = io.connect('http://127.0.0.1:4000'),
    status, employeeId;
  if (action) {
    if (user.admin == 2) {
      $("#approveRes").modal('show');
      $.ajax({
        url: appConfig.url + appConfig.api + 'getAllFreeEmployees?token=' + token + '&date=' + date,
        type: 'GET',
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
          $("#approveRes").modal('hide');

          socket.emit('/approveReservation', {
            token: token,
            userId: user.userId,
            employeeId: employeeId,
            status: status,
            resId: resId
          });
        })
      });
    } else {
      socket.emit('/approveReservation', {
        token: token,
        userId: user.userId,
        employeeId: user.userId,
        status: 'Approved',
        resId: resId
      });
    }

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
         cache: true,
         contentType: "application/json; charset=utf-8",
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
