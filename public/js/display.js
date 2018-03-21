$(document).ready(function() {
  var user = JSON.parse(sessionStorage.getItem('user')),
    token = sessionStorage.getItem('token'),
    MAX_OPTIONS = 5;

  $("[name='eFirstName']").val(user.firstName);
  $("[name='eLastName']").val(user.lastName);
  $("[name='eEmail']").val(user.email);
  $("[name='ePhoneNumber']").val(user.phone);

  addCars(user.cars.length);

  $("[name='editProfileForm']").formValidation({
    framework: 'bootstrap',
    excluded: ':disabled',
    icon: {
      valid: 'glyphicon glyphicon-ok',
      invalid: 'glyphicon glyphicon-remove',
      validating: 'glyphicon glyphicon-refresh'
    },
    fields: {
      'eFirstName': {
        validators: {
          regexp: {
            regexp: '[a-zA-Z]+$',
            message: "Firstname should not contain numbers or special characters."
          }
        }
      },
      'eLastName': {
        validators: {
          regexp: {
            regexp: '[a-zA-Z]+$',
            message: "Lastname should not contain numbers or special characters."
          }
        }
      },
      'eEmail': {
        validators: {
          regexp: {
            regexp: '^[^@\\s]+@([^@\\s]+\\.)+[^@\\s]+$',
            message: 'The value is not a valid email address'
          }
        }
      },
      'ePasswordUser': {
        validators: {
          identical: {
            field: 'eConfirmPassword',
            message: 'The password and its confirm are not the same'
          },
          regexp: {
            regexp: '^(?=[\\w!@#$%^&*()+])(?:.*[!@#$%^&*()+]+.*)$',
            message: 'The password should contain at least one symbol.'
          },
          stringLength: {
            min: 8,
            message: 'Password content must be minimum 8 characters'
          }
        }
      },
      'eConfirmPassword': {
        validators: {
          identical: {
            field: 'ePasswordUser',
            message: 'The password and its confirm are not the same'
          },
          regexp: {
            regexp: '^(?=[\\w!@#$%^&*()+])(?:.*[!@#$%^&*()+]+.*)$',
            message: 'The password should contain at least one symbol.'
          },
          stringLength: {
            min: 8,
            message: 'Password content must be minimum 8 characters'
          }
        }
      },
      'ePhoneNumber': {
        validators: {
          phone: {
            country: 'Ro',
            message: 'The value entered is an %s phone number'
          }
        }
      },
      'cars[]': {
        validators: {
          notEmpty: {
            message: 'The option is required and cannot be empty'
          },
          callback: {
            callback: function(value, validator, $field) {
              var $cars = $('[name="cars[]"]').not('#eCarsTemplate [name="cars[]"]'),
                numCars = $cars.length,
                notEmptyCount = 0,
                obj = {},
                duplicateRemoved = [];

              for (var i = 0; i < numCars; i++) {
                var v = $cars.eq(i).val().toUpperCase();
                if (v !== '') {
                  obj[v] = 0;
                  notEmptyCount++;
                }
              }

              for (i in obj) {
                duplicateRemoved.push(obj[i]);
              }
              if (duplicateRemoved.length === 0) {
                return {
                  valid: false,
                  message: 'You must fill at least one car number'
                };
              } else if (duplicateRemoved.length !== notEmptyCount) {
                return {
                  valid: false,
                  message: 'The car number must be unique'
                };
              }

              validator.updateStatus('cars[]', validator.STATUS_VALID, 'callback');
              return true;
            }
          }
        },
      }
    }
  }).on('click', '.addButton', function() {
    var $template = $('[name="editProfileForm"] #eCarsTemplate'),
      $clone = $template
      .clone()
      .removeClass('hide')
      .removeAttr('id')
      .insertBefore($template),
      $option = $clone.find('[name="editProfileForm"] [name="cars[]"]');
    $option.val('');

    $("[name='editProfileForm']").formValidation('addField', $option);
    var currentHeight = $("[name='editProfileForm']").height();
    $("[name='editProfileForm']").css('height', currentHeight + 40);

  }).on('click', '.removeButton', function() {
    var $row = $(this).parents('.form-group'),
      $option = $row.find('[name="cars[]"]');
    $row.remove();
    $("[name='editProfileForm']").formValidation('removeField', $option);
    var currentHeight = $("[name='editProfileForm']").height();
    $("[name='editProfileForm']").css('height', currentHeight - 40);

  }).on('added.field.fv', function(e, data) {
    if (data.field === 'cars[]') {
      if ($("[name='editProfileForm']").find(':visible[name="cars[]"]').length >= MAX_OPTIONS) {
        $("[name='editProfileForm']").find('.addButton').attr('disabled', 'disabled');
      }
      $("[name='editProfileForm']").formValidation('revalidateField', 'cars[]');
    }
  }).on('removed.field.fv', function(e, data) {
    if (data.field === 'cars[]') {
      if ($('[name="editProfileForm"]').find(':visible[name="cars[]"]').length < MAX_OPTIONS) {
        $('[name="editProfileForm"]').find('.addButton').removeAttr('disabled');
      }
    }
  }).on('change', function(e, data) {
    $("[name='editProfileForm']").formValidation('revalidateField', 'eFirstName');
    $("[name='editProfileForm']").formValidation('revalidateField', 'eLastName');
    $("[name='editProfileForm']").formValidation('revalidateField', 'eEmail');
    $("[name='editProfileForm']").formValidation('revalidateField', 'ePhoneNumber');
    $("[name='editProfileForm']").formValidation('revalidateField', 'cars[]');
    if ($("[name='editProfileForm']").data('formValidation').isValid()) {
      $('[name="editUser"]').attr('disabled', false);
    }
  }).on('submit', function(e, data) {

    var socket = io.connect('http://127.0.0.1:4000');

    var hashObj = new jsSHA("SHA-512", "TEXT", {
      numRounds: 1
    });
    hashObj.update($("[name='ePasswordUser']").val());
    var password = hashObj.getHash("HEX"),
      firstName = $("[name='eFirstName']").val(),
      lastName = $("[name='eLastName']").val(),
      email = $("[name='eEmail']").val(),
      phone = $("[name='ePhoneNumber']").val(),
      cars = $("[name='editProfileForm']").find('#myCars [name="cars[]"]'),
      i = 0,
      carsArr = [],
      carsObj = {};

    $.map(cars, function(car) {
      if (car.value) {
        carsArr.push({
          id: i,
          number: car.value
        })
        i++;
      }
    });
    carsObj = {
      cars: carsArr
    };
    alert(JSON.stringify(carsObj));

    // socket.emit('/register', {
    //   firstName: firstName,
    //   lastName: lastName,
    //   email: email,
    //   password: password,
    //   phone: phone,
    //   cars: JSON.stringify(carsObj)
    // });
    // socket.on('/resRegister', function(data) {
    //         console.log(data);
    //     });
  });

  $("[name='changePassForm']").formValidation({
    framework: 'bootstrap',
    excluded: ':disabled',
    icon: {
      valid: 'glyphicon glyphicon-ok',
      invalid: 'glyphicon glyphicon-remove',
      validating: 'glyphicon glyphicon-refresh'
    },
    fields: {
      'cPasswordUser': {
        validators: {
          notEmpty: {
            message: 'The password is required and cannot be empty'
          }
        }
      },
      'ePasswordUser': {
        validators: {
          identical: {
            field: 'eConfirmPassword',
            message: 'The password and its confirm are not the same'
          },
          regexp: {
            regexp: '^(?=[\\w!@#$%^&*()+])(?:.*[!@#$%^&*()+]+.*)$',
            message: 'The password should contain at least one symbol.'
          },
          stringLength: {
            min: 8,
            message: 'Password content must be minimum 8 characters'
          }
        }
      },
      'eConfirmPassword': {
        validators: {
          identical: {
            field: 'ePasswordUser',
            message: 'The password and its confirm are not the same'
          },
          regexp: {
            regexp: '^(?=[\\w!@#$%^&*()+])(?:.*[!@#$%^&*()+]+.*)$',
            message: 'The password should contain at least one symbol.'
          },
          stringLength: {
            min: 8,
            message: 'Password content must be minimum 8 characters'
          }
        }
      }
    }
  }).on('change', function(e, data) {
    $("[name='changePassForm']").formValidation('revalidateField', 'cPasswordUser');
    $("[name='changePassForm']").formValidation('revalidateField', 'ePasswordUser');
    $("[name='changePassForm']").formValidation('revalidateField', 'eConfirmPassword');

    if ($("[name='changePassForm']").data('formValidation').isValid()) {
      $('[name="changePass"]').attr('disabled', false);
    }
  }).on('submit', function(e, data) {

    var socket = io.connect('http://127.0.0.1:4000');

    var hashObj = new jsSHA("SHA-512", "TEXT", {
      numRounds: 1
    });
    hashObj.update($("[name='ePasswordUser']").val());
    var password = hashObj.getHash("HEX"),
      email = $("[name='eEmail']").val();

    // socket.emit('/register', {
    //   firstName: firstName,
    //   lastName: lastName,
    //   email: email,
    //   password: password,
    //   phone: phone,
    //   cars: JSON.stringify(carsObj)
    // });
    // socket.on('/resRegister', function(data) {
    //         console.log(data);
    //     });
  });

  function addCars(carsNr) {
    if (carsNr > 1) {
      for (var i = 0; i < carsNr; i++) {
        var $template = $('[name="editProfileForm"] #eCarsTemplate'),
          $clone = $template
          .clone()
          .removeClass('hide')
          .removeAttr('id')
          .insertBefore($template),
          $option = $clone.find('[name="editProfileForm"] [name="cars[]"]');
        $option.val(user.cars[i].number);

        $("[name='editProfileForm']").formValidation('addField', $option);
        var currentHeight = $("[name='editProfileForm']").height();
        $("[name='editProfileForm']").css('height', currentHeight + 40);
      }
    } else {
      $("[name='editProfileForm'] [name='cars[]']:first").val(user.cars[0].number);
    }
  }

  (function($) {
    $('.information_menu').find('li').hover(function(e) {
      $('.information_menu').find('li').removeClass('active');
      $(this).addClass('active');
      $(".overlay-item").removeClass("active");
      $(".overlay-item").removeClass("inactive");
      $(".overlay-id" + $(this).data("id")).addClass("active").removeClass("inactive");

      $(".overlay-id" + $(this).data("id")).prev().addClass("inactive")
    });

    $('.carousel').carousel();
  })(jQuery);
});
