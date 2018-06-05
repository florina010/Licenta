"use strict";

$(document).ready(function() {
  var user = JSON.parse(sessionStorage.getItem('user')),
    token = sessionStorage.getItem('token'),
    MAX_OPTIONS = 5,
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

  getAllReservations(currentPage);

});

function getAllReservations(page) {
  $.get(appConfig.url + appConfig.api + 'getAllReservations?token=' + token + '&userId=' + user.userId, function(reservations) {
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

function displayApproveModal(resId, date, action) {
  var socket = io.connect('http://127.0.0.1:4000'),
    status, employeeId;
  if (action) {
    $("#approveRes").modal('show');
    $.get(appConfig.url + appConfig.api + 'getAllFreeEmployees?token=' + token + '&date=' + date, function(employees) {
      for (var i = 0; i < employees.length; i++) {
        var info = '09',
          option = '<option value="' + employees[i].userId + '" title="' + info + '">' + employees[i].firstName + ' ' + employees[i].lastName + '</option>';
        $("#selectEmp").append(option)
      }

      $('#selectEmp').multiselect({
        maxHeight: 300,
        enableFiltering: true,
      });
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

        socket.on('/resApproveReservation', function(data) {
          var currentPage = parseInt($("#resTable_paginate span .current").attr("data-dt-idx"));
          getAllReservations(currentPage);
        });
      })
    });
  } else {
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

// function displayApproveModal() {
//
//   var approveModal = $("#approveResModal");
//   if (action == 2) {
//     $("#approveResModal .modal-body").css('display', 'block');
//     $("#approveResModal #approve-modal-btn-yes").attr('disabled', 'disabled');
//   } else {
//     $("#approveResModal .modal-body").css('display', 'none');
//     $("#approveResModal #approve-modal-btn-yes").attr('disabled', false);
//   }
//
//   $("#approverComment").on('change keyup paste', function () {
//     if (!$("#approverComment").val()) {
//       $("#approveResModal #approve-modal-btn-yes").attr('disabled', 'disabled');
//     } else {
//       $("#approveResModal #approve-modal-btn-yes").attr('disabled', false);
//       approverComment = $("#approverComment").val();
//     }
//   });
//
//   approveModal.modal('show');
//   $('#approverComment').val('');
//   approveModal.attr("approveId", id);
//   approveModal.attr("approve-action", action);
//   $("#resTable tr").removeClass("activeModal");
//   $(elem).closest("tr").addClass("activeModal");
//   $("#approve-modal-btn-yes").off();
//   $("#approve-modal-btn-yes").on('click', function (event) {
//     $("#approveResModal").modal('hide');
//     $('.modal-backdrop').remove();
//   });
// }
