/**
 * LoginController
 *
 * @description :: Server-side logic for managing logins
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var validator = require('validator');
var firebase = require("firebase");
var db = sails.config.globals.firebasedb();
var firebaseAuth = sails.config.globals.firebaseAuth();

module.exports = {
  /*
   * Name: index
   * Created By: A-SIPL
   * Created Date: 14-dec-2017
   * Purpose: login page for admin
   */
  index: function (req, res) {
    if (!req.session.authenticated) {
      var errors = {};
      /* Checking validation if form post */
      if (req.method == "POST") {
        errors = ValidationService.validate(req);
        if (Object.keys(errors).length) {
          res.locals.layout = 'layout-login';
          return res.view('login', {title: sails.config.title.login, errors: errors});
        } else {
          firebaseAuth.auth().signInWithEmailAndPassword(req.param('email'), req.param('password'))
            .then(function (user) {
              if(user){
                var ref = db.ref("users").orderByChild('id').equalTo(user.uid);
                ref.once("value", function (snapshot) {
                  var adminDetail = snapshot.val();

                  if (adminDetail && Object.keys(adminDetail)[0] != undefined && Object.keys(adminDetail)[0] != null) {
                    var userKey = Object.keys(adminDetail)[0];
                    if (adminDetail[userKey].is_admin != undefined && adminDetail[userKey].is_admin == true) {
                      if(adminDetail[userKey].is_deleted != undefined && adminDetail[userKey].is_deleted == false){
                        req.session.authenticated = true;
                        req.session.user = user;
                        req.session.userid = (Object.keys(adminDetail)[0]) ? Object.keys(adminDetail)[0] : '';
                        req.session.isSuperAdmin = (adminDetail[userKey]['is_superadmin'] != undefined && adminDetail[userKey]['is_superadmin'] == true) ? true : false;
                        req.flash('disableBack', true);
                        return res.redirect(sails.config.base_url + 'dashboard');
                      }else{
                        req.flash('flashMessage', '<div class="flash-message alert alert-danger">' + sails.config.flash.account_inactive + '</div>');
                        return res.redirect(sails.config.base_url);
                      }
                    } else {
                      req.flash('flashMessage', '<div class="flash-message alert alert-danger">' + User.message.email_valid + '</div>');
                      return res.redirect(sails.config.base_url);
                    }
                  } else {
                    req.flash('flashMessage', '<div class="flash-message alert alert-danger">' + sails.config.flash.something_went_wronge + '</div>');
                    return res.redirect(sails.config.base_url);
                  }
                }, function (errorObject) {
                  req.flash('flashMessage', '<div class="flash-message alert alert-danger">' + sails.config.flash.something_went_wronge + '</div>');
                  return res.redirect(sails.config.base_url);
                });
              }else{
                req.flash('flashMessage', '<div class="flash-message alert alert-danger">' + sails.config.flash.something_went_wronge + '</div>');
                return res.redirect(sails.config.base_url);
              }

            }).catch(function (error) {
              console.log(error);
            if (error.code == "auth/invalid-email") {
              req.flash('flashMessage', '<div class="flash-message alert alert-danger">' + User.message.email_valid + '</div>');
            } else {
              req.flash('flashMessage', '<div class="flash-message alert alert-danger">' + sails.config.flash.invalid_email_password + '</div>');
            }
            return res.redirect(sails.config.base_url + 'login');
          });
        }
      }
      if (req.method == "GET") {
        res.locals.layout = 'layout-login';
        return res.view('login', {title: sails.config.title.login, errors: errors});
      }
    } else {
      res.redirect('dashboard');
    }
  },

  /*
     * Name: forgotPassword
     * Created By: A-SIPL
     * Created Date: 24-jan-2018
     * Purpose: for generate password
     */
  forgotPassword: function (req, res) {
    var errors = {};
    if (req.method == "POST") {
      errors = ValidationService.validate(req);
      if (Object.keys(errors).length) {
        res.locals.layout = 'layout-login';
        return res.view('forgot-password', {
          errors: errors,
          title: sails.config.title.forgot_password
        });
      } else {
        //var ref = db.ref("users");
        firebase.auth().sendPasswordResetEmail(req.param('email').trim())
          .then(function () {
            req.flash('flashMessage', '<div class="flash-message alert alert-success">' + sails.config.flash.forgot_mail_send_success + '</div>');
            return res.redirect(sails.config.base_url + 'login');
          })
          .catch(function (error) {
            req.flash('flashMessage', '<div class="flash-message alert alert-danger">'+ error.message +'</div>');
            return res.redirect(sails.config.base_url + 'login/forgotPassword');
          })
        // ref.orderByChild('email').equalTo(req.param('email').trim()).once('child_added', function (snap) {
        //   if (Object.keys(snap).length) {
        //     var userInfo = snap.val();
        //     console.log(userInfo);
        //     if (userInfo.is_deleted == false && userInfo.is_admin == true) {
        //     } else {
        //       req.flash('flashMessage', '<div class="flash-message alert alert-danger">' + sails.config.flash.account_inactive + '</div>');
        //       return res.redirect(sails.config.base_url + 'login');
        //     }
        //   } else {
        //     req.flash('flashMessage', '<div class="flash-message alert alert-danger">' + sails.config.flash.invalid_email + '</div>');
        //     return res.redirect(sails.config.base_url + 'login');
        //   }
        // }, function (errorObject) {
        //   console.log('errorObject....', errorObject);
        //   return res.serverError(errorObject.code);
        // })
      }
    } else {
      res.locals.layout = 'layout-login';
      return res.view('forgot-password', {
        errors: errors,
        title: sails.config.title.forgot_password
      });
    }
  },

  /*
     * Name: accountConfirmation
     * Created By: A-SIPL
     * Created Date: 29-jan-2018
     * Purpose: check link and set the password
     */
  accountConfirmation: function (req, res, mode, oobCode) {
    if (req.param('id') != undefined && req.param('id') != '') {
      var email = CryptoService.decrypt(req.param('id'));
      var ref = db.ref("users");
      ref.orderByChild('email').equalTo(email).once('child_added', function (snap) {
        if (Object.keys(snap).length) {
          var errors = {};
          if (req.method == "POST") {
            errors = ValidationService.validate(req);
            if (Object.keys(errors).length) {
              es.locals.layout = 'layout-login';
              return res.view('set-password', {
                id: id,
                errors: errors,
                title: sails.config.title.set_new_passwors
              });
            } else {
              userInfo = snap.val();
              console.log('User info------>', userInfo);
              firebase.auth().updateUser(userInfo.id, {
                password: req.param('password').trim(),
              }).then(function (userRecord) {
                var ref = db.ref();
                var status = (req.param('status') == "false" || req.param('status') == false) ? false : true;
                db.ref('users/' + snap.key)
                  .update({
                    'password': req.param('new_password').trim()
                  })
                  .then(function () {
                    req.flash('flashMessage', '<div class="flash-message alert alert-success">' + sails.config.flash.password_set_success + '</div>');
                    return res.redirect(sails.config.base_url + 'login');
                  })
                  .catch(function (err) {
                    req.flash('flashMessage', '<div class="flash-message alert alert-error">' + sails.config.flash.password_change_error + '</div>');
                    return res.redirect(sails.config.base_url + 'dashboard/changePassword');
                  });
              })
                .then(function (userRecord) {
                  req.flash('flashMessage', '<div class="flash-message alert alert-success">' + sails.config.flash.password_set_success + '</div>');
                  return res.redirect(sails.config.base_url + 'login');
                })
                .catch(function (error) {
                  req.flash('flashMessage', '<div class="flash-message alert alert-danger">' + sails.config.flash.password_set_error + '</div>');
                  return res.redirect(sails.config.base_url + 'login');
                });
            }
          } else {
            res.locals.layout = 'layout-login';
            return res.view('set-password', {
              id: req.param('id'),
              errors: errors,
              title: sails.config.title.set_new_passwors
            });
          }
        } else {
          req.flash('flashMessage', '<div class="flash-message alert alert-danger">' + sails.config.flash.invalid_email + '</div>');
          return res.redirect(sails.config.base_url + 'login');
        }
      })
    } else {
      req.flash('flashMessage', '<div class="flash-message alert alert-danger">' + sails.config.flash.something_went_wronge + '</div>');
      return res.redirect(sails.config.base_url + 'login');
    }
  },


  /*
     * Name: confirmPassword
     * Created By: A-SIPL
     * Created Date: 29-jan-2018
     * Purpose: check link and set the password
     */
  confirmPassword: function (req, res, id) {
    if (req.param('id') != undefined && req.param('id') != '') {
      var email = CryptoService.decrypt(req.param('id'));
      var ref = db.ref("users");
      ref.orderByChild('email').equalTo(email).once('child_added', function (snap) {
        if (Object.keys(snap).length) {
          var errors = {};
          if (req.method == "POST") {
            errors = ValidationService.validate(req);
            if (Object.keys(errors).length) {
              es.locals.layout = 'layout-login';
              return res.view('set-password', {
                id: id,
                errors: errors,
                title: sails.config.title.set_new_passwors
              });
            } else {
              userInfo = snap.val();
              console.log('User info------>', userInfo);
              firebase.auth().updateUser(userInfo.id, {
                password: req.param('password').trim(),
              }).then(function (userRecord) {
                var ref = db.ref();
                var status = (req.param('status') == "false" || req.param('status') == false) ? false : true;
                db.ref('users/' + snap.key)
                  .update({
                    'password': req.param('new_password').trim()
                  })
                  .then(function () {
                    req.flash('flashMessage', '<div class="flash-message alert alert-success">' + sails.config.flash.password_set_success + '</div>');
                    return res.redirect(sails.config.base_url + 'login');
                  })
                  .catch(function (err) {
                    req.flash('flashMessage', '<div class="flash-message alert alert-error">' + sails.config.flash.password_change_error + '</div>');
                    return res.redirect(sails.config.base_url + 'dashboard/changePassword');
                  });
              })
                .then(function (userRecord) {
                  req.flash('flashMessage', '<div class="flash-message alert alert-success">' + sails.config.flash.password_set_success + '</div>');
                  return res.redirect(sails.config.base_url + 'login');
                })
                .catch(function (error) {
                  req.flash('flashMessage', '<div class="flash-message alert alert-danger">' + sails.config.flash.password_set_error + '</div>');
                  return res.redirect(sails.config.base_url + 'login');
                });
            }
          } else {
            res.locals.layout = 'layout-login';
            return res.view('set-password', {
              id: req.param('id'),
              errors: errors,
              title: sails.config.title.set_new_passwors
            });
          }
        } else {
          req.flash('flashMessage', '<div class="flash-message alert alert-danger">' + sails.config.flash.invalid_email + '</div>');
          return res.redirect(sails.config.base_url + 'login');
        }
      })
    } else {
      req.flash('flashMessage', '<div class="flash-message alert alert-danger">' + sails.config.flash.something_went_wronge + '</div>');
      return res.redirect(sails.config.base_url + 'login');
    }
  },

  /*
   * Name: signUp
   * Created By: A-SIPL
   * Created Date: 8-dec-2017
   * Purpose: update profile
   * @param  req
   */
  signUp: function (req, res) {
    if (!req.session.authenticated) {
      firebase.auth().createUserWithEmailAndPassword('macksoni006@gmail.com', 'Aa@123456')
        .then(function () {
          user = firebase.auth().currentUser;
        }).then(function () {
        user.updateProfile({
          displayName: "Piyush",
        });
      }).then(function () {
        var ref = db.ref().child("users");
        var data = {
          email: 'macksoni006@gmail.com',
          password: 'Aa@123456',
          name: "Piyush",
          is_admin: false,
          phone: "+8989501861",
          id: user.uid,
          is_deleted: false,
          is_verified: true,
          is_user_notification_enable: true,
          is_device_notification_enable: true,
          created_at: Date.now(),
          modified_at: Date.now(),
        }
        console.log('Created');

        ref.push(data).then(function () {//use 'child' and 'set' combination to save data in your own generated key
          req.flash('flashMessage', '<div class="flash-message alert alert-success">Admin Created Successfully.</div>');
          return res.redirect(sails.config.base_url + 'login');
        }, function (error) {
          req.flash('flashMessage', '<div class="flash-message alert alert-danger">Error In Creating Admin.</div>');
          return res.redirect(sails.config.base_url + 'login');
        });
      })
        .catch(function (error) {
          req.flash('flashMessage', '<div class="flash-message alert alert-danger">Error In Creating Admin.</div>');
          return res.redirect(sails.config.base_url + 'login');
        });
    } else {
      res.redirect('dashboard');
    }
  },


  /*
* Name: getAdminNotification
* Created By: A-SIPL
* Created Date: 23-jan-2018
* Purpose: get notification of the admin
* @param  req
*/
  getAdminNotification: function (req, res) {
    var adminId = (req.session.user != undefined) ? req.session.user.uid : '';
    if(adminId != ''){
      db.ref('alerts/' + adminId).limitToLast(sails.config.notification_limit).once('value')
        .then(function (snapshot) {
          var notificationList = snapshot.val();
          res.locals.layout = '';
          return res.view('notification', {alertList: DateService.reverseObject(notificationList)});
        }).catch(function (err) {
        return res.view('notification', {alertList: {}});
      });
    }else{
      return res.view('notification', {alertList: {}});
    }
  },



  filter: function (req, res) {
    res.locals.layout = 'layout-filter';
    return res.view('filter', {
      title: sails.config.title.login,
      rating: '',
      _fid: '',
      name: '',
      outline: '',
      runtime: '',
      director: '',
      stars: '',
      year: '',
      genre: '',
      is_deleted: ''
    });
  }
};

