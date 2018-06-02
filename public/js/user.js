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
  
  function getAllServices() {
    $.get(appConfig.url + appConfig.api + 'getAllServices?token=' + token, function(services) {
      for (var i = 0; i < services.length; i++) {
        var option = '<option value="' + services[i].serviceId + '">' + services[i].title + '</option>';
        $("#selectList").append(option)
      }

      $('#selectList').multiselect({
         maxHeight: 350,
         enableFiltering: true,
         onChange: function(option, checked) {
                // Get selected options.
                var selectedOptions = $('#selectList option:selected');

                if (selectedOptions.length >= 3) {
                    // Disable all other checkboxes.
                    var nonSelectedOptions = $('#selectList option').filter(function() {
                        return !$(this).is(':selected');
                    });

                    nonSelectedOptions.each(function() {
                        var input = $('input[value="' + $(this).val() + '"]');
                        input.prop('disabled', true);
                        input.parent('li').addClass('disabled');
                    });
                }
                else {
                    // Enable all checkboxes.
                    $('#selectList option').each(function() {
                        var input = $('input[value="' + $(this).val() + '"]');
                        input.prop('disabled', false);
                        input.parent('li').addClass('disabled');
                    });
                }
            }
      });
    });
  }
});
