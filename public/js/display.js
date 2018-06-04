"use strict";

$(document).ready(function() {
  var navItems = $('.admin-menu li > a');
  var navListItems = $('.admin-menu li');
  var allWells = $('.admin-content');
  var allWellsExceptFirst = $('.admin-content:not(:first)');

  allWellsExceptFirst.hide();
  navListItems.click(function(e) {
    e.preventDefault();
    navListItems.removeClass('active');
    $(this).closest('li').addClass('active');

    allWells.hide();
    var target = $(this).attr('data-target-id');
    $('#' + target).show();
  });

  var user = JSON.parse(sessionStorage.getItem('user')),
    token = sessionStorage.getItem('token'),
    currentPage = parseInt($("#userTable_paginate span .current").attr("data-dt-idx")),
    MAX_OPTIONS = 5,
    socket = io.connect('http://127.0.0.1:4000');
    socket.on('/resEditProfile', function(data) {
      if (data.id == user.userId) {
        user.cars = data.cars;
        user.email = data.email;
        user.firstName = data.firstName;
        user.lastName = data.lastName;
        user.phone = data.phone;
        sessionStorage.setItem('user', JSON.stringify(user));
      }
    });

  if (user.admin == 2) {
    $("[name='editProfileForm'] div:nth-child(4)").css('display', 'none');
    var script = document.createElement('script');
    script.type='text/javascript';
    script.src = "../js/employees.js";
    document.getElementsByTagName('body')[0].appendChild(script);
  } else if (user.admin == 0) {
    $("[data-target-id='target3']").css('display', 'none');
    $("[data-target-id='target4']").css('display', 'none');
    var script = document.createElement('script');
    script.type='text/javascript';
    script.src = "../js/user.js";
    document.getElementsByTagName('body')[0].appendChild(script);
  }

  $("[name='eFirstName']").val(user.firstName);
  $("[name='eLastName']").val(user.lastName);
  $("[name='eEmail']").val(user.email);
  $("[name='ePhoneNumber']").val(user.phone);
  if (user.cars) {
    addCars(user.cars.length);
  }

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
      $("[name='editProfile']").attr('disabled', false);
    }
    $("[name='editProfile']").removeClass('disabled ')
  }).off().on('submit', function(e, data) {
    e.preventDefault();
    var firstName = $("[name='eFirstName']").val(),
      lastName = $("[name='eLastName']").val(),
      email = $("[name='eEmail']").val(),
      phone = $("[name='ePhoneNumber']").val(),
      cars = $("[name='editProfileForm']").find('#myCars [name="cars[]"]'),
      i = 0,
      carsArr = [],
      carsObj = {},
      socket = io.connect('http://127.0.0.1:4000');

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

    socket.emit('/editProfile', {
      token: token,
      id: user.userId,
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: phone,
      cars: JSON.stringify(carsObj)
    });

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
          notEmpty: {
            message: 'The password is required and cannot be empty'
          },
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
          notEmpty: {
            message: 'The password is required and cannot be empty'
          },
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
  }).off().on('submit', function(e, data) {
    var socket = io.connect('http://127.0.0.1:4000'),
      hashObj = new jsSHA("SHA-512", "TEXT", {
        numRounds: 1
      }),
      hashObjC = new jsSHA("SHA-512", "TEXT", {
        numRounds: 1
      });
    hashObj.update($("[name='ePasswordUser']").val());
    hashObjC.update($("[name='cPasswordUser']").val());
    var password = hashObj.getHash("HEX"),
      currentPassword = hashObjC.getHash("HEX"),
      email = $("[name='eEmail']").val();

    if (currentPassword !== user.password) {
      alert("Current password is incorrect.");
      $("[name='cPasswordUser']").val('');
    } else {
      $.post(appConfig.url + appConfig.api + "changePassword", {
        token: token,
        email: email,
        password: password
      }).done(function(data) {
        user.password = password;
        sessionStorage.setItem('user', JSON.stringify(user));
        $(".overlay-id6 .alert-success").css('display', 'block');
        setTimeout(function() {
          $('.overlay-id6 .alert-success').fadeOut('fast');
        }, 5000);
      });
    }
  });

  function addCars(carsNr) {
    var currentHeight = $("[name='editProfileForm']").height();
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
        $("[name='editProfileForm']").css('height', currentHeight + 40);
      }
    } else if (carsNr == 1) {
      $("[name='editProfileForm'] [name='cars[]']:first").val(user.cars[0].number);
    } else {
      $("[name='editProfileForm'] .form-group:nth-child(4)").css('display', 'none');
      $("[name='editProfileForm']").css('height', currentHeight);
    }
  }
});
