var User        = require('../models/user');
var jwt         = require('jsonwebtoken');
var secret      = 'harrypotter';

module.exports = function(router){
//http://localhost:8000/users
//USER REGISTRATION ROUTE
 router.post('/users',function(req,res){
	//res.send('testing the routes');
	var user = new User();
    user.name = req.body.name;
	user.username = req.body.username;
	user.password = req.body.password;
	user.email = req.body.email;
	
	if(req.body.username == null || req.body.username == '' || req.body.password == null || req.body.password == '' ||
	 req.body.email == null || req.body.email == '' || req.body.name == null || req.body.name == '') {
		res.json({ success: false, message: 'Ensure username, email, and password were provided' });

	}else {
		user.save(function(err){
		if (err) {

			if (err.errors != null) {
				if (err.errors.name) {
					res.json({ success: false, message: err.errors.name.message});
				} else if (err.errors.email) {
					res.json({ success: false, message: err.errors.email.message});
				} else if (err.errors.username) {
					res.json({ success: false, message: err.errors.username.message});
				} else if (err.errors.password) {
					res.json({ success: false, message: err.errors.password.message});
				} else {
					res.json({ success: false, message: err});
				}
			} else if (err) {
				if (err.code == 11000) {
					if(err.errmsg[61] == "u") {
						res.json({ success: false, message: 'Username is already taken'});
					} else if (err.errmsg[61] == "e") {
						res.json({ success: false, message: 'Email is already taken'});
					}
				} else {
					res.json({ success: false, message: err});
				}
			}
		} else {
			res.json({ success: true, message: 'user created'});
		}
	});
	}
 });


router.post('/checkusername',function(req,res){
	User.findOne({ username: req.body.username}).select('username').exec(function(err, user) {
		if(err) throw err;

		if (user) {
			res.json({ success:false, message: 'That username is already taken'});
		} else {
			res.json({ success:false, message: 'Valid username'});
		}
	});
});

router.post('/checkemail',function(req,res){
	User.findOne({ username: req.body.username}).select('email').exec(function(err, user) {
		if(err) throw err;

		if (user) {
			res.json({ success:false, message: 'That email is already taken'});
		} else {
			res.json({ success:false, message: 'Valid email'});
		}
	});
});

router.post('/authenticate',function(req,res){
	User.findOne({ username: req.body.username}).select('email username password').exec(function(err, user) {
		if(err) throw err;

		if(!user) {
			res.json({ success:false, message: 'Could not authenticate user'});
		}else if(user) {
			if (req.body.password) {
			var validPassword = user.comparePassword(req.body.password);
		    }else {
		    	res.json({ success: false, message: 'No password provided'});
            }
			if(!validPassword) {
				res.json({ success: false, message: 'Could not authenticate password'});
			}else {
				var token = jwt.sign({ username: user.username, email: user.email}, secret, {expiresIn: '24h'});
				res.json({ success: true, message: 'User authenticate', token: token});
			}
		}

	});
});

router.get('/resetusername/:email', function(req, res) {
	User.findOne({ email: req.params.email }).select('email name username').exec(function(err, user) {
		if(err) {
			if(!req.params.email) {
				res.json({ success: false, message: 'No email was provided ' });
			}else {
				if (!user) {
				res.json({ success: false, message: 'E-mail was not found' });
			} else {
				res.json({ success: true, message: 'Username has been sent to e-mail' });
			}
		}
	}
});
});

router.use(function(req, res, next) {
	var token = req.body.token || req.body.query || req.headers['x-access-token'];

	if (token) {
		jwt.verify(token, secret, function(err, decoded) {
			if (err) {
				 res.json({ success: false, message: 'Token Invalid'});
				}else {
					req.decoded = decoded;
					next();
				}
		});
	}else {
		res.json({ success: false, message: 'No token provided'});
	}
});

router.post('/me', function(req, res) {
	res.send(req.decoded);
});

router.get('/permission', function(req, res) {
	User.findOne({ username: req.decoded.username }, function(err, user) {
		if (err) throw err;
		if (!user) {
			res.json({ success: false, message: 'No user was found'});
		} else {
			res.json({ success: true, permission: user.permission});
		}
	});
});

router.get('/management', function(req, res) {
	User.find({}, function(err, users) {
		if (err) throw err;
		User.findOne({ username: req.decoded.username }, function(err, mainUser) {
			if (err) throw err;
			if (!mainUser) {
				res.json({ success: false, message: 'No user found'});
			} else {
				if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
					if (!users) {
						res.json({ success: false, message: 'Users not found'});
					} else {
						res.json({ success: true, users: users, permission: mainUser.permission });
					}
				} else {
				res.json({ success: false, message: 'Insufficient permission'});
			    }
		    } 
	    });
	});
});

 router.delete('/management/:username', function(req, res) {
 	var deletedUser = req.params.username;
 	User.findOne({ username: req.decoded.username }, function(err, mainUser) {
 		if (err) throw err;
 		if(!mainUser) {
 			res.json({ success: false, message: 'No user found'});
 		} else {
 			if (mainUser.permission != 'admin') {
 				res.json({ success: false, message: 'Insufficient permissions'});
 			} else {
 				User.findOneAndRemove({ username: deletedUser}, function(err, user) {
 					if (err) throw err;
 					res.json({ success: true});
 				});
 			}
 		}
 	});
 });  

 router.get('/edit/:id', function(req, res) {
 	var editUser = req.params.id;
 	User.findOne({ username: req.decoded.username}, function(err, mainUser) {
 		if (err) throw err;
 		if (!mainUser) {
 			res.json({ success:false, message: 'No user found'});
 		} else {
 			if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
 				User.findOne({ _id: editUser}, function(err, user) {
 					if (err) throw err;
 					if (!user) {
 						res.json({ success: false, message: 'No user found'});
 					} else {
 						res.json({ success: true, user: user});
 					}
 				});
 			} else {
 				res.json({ success: false, message: 'Insufficient permission'});
 			}
 		}
 	});
 });

 router.put('/edit', function(req, res) {
 	var editUser = req.body._id;
 	if(req.body.name) var newName = req.body.name;
 	if(req.body.username) var newUsername = req.body.username;
 	if(req.body.email) var newEmail = req.body.email;
 	if(req.body.permission) var newPermission = req.body.permission;
 	User.findOne({ username: req.decoded.username}, function(err, mainUser) {
 		if (err) throw err;
 		if (!mainUser) {
 			res.json({ success:false, message: 'No user found'});
 		} else {
 			if (newName) {
 				if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
 					User.findOne({ _id: editUser }, function(err, user) {
 						if(err) throw err;
 						if (!user) {
 							res.json({ success: false, message: 'No user found'});
 						} else {
 							user.name = newName;
 							user.save(function(err) {
 								if (err) {
 									console.log(err);
 								} else {
 									res.json({ success:true, message: 'Name has been updated!'});
 								}
 							});
 						}
 					});
				} else {
 					res.json({ success: false, message: 'Insufficient permission'});
 				}
 			}
 			if (newUsername) {
 				if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
 					User.findOne({ _id : editUser }, function(err, user) {
 						if(err) throw err;
 						if (!user) {
 							res.json({ success: false, message: 'No user found'});
 						} else {
 							user.username = newUsername;
 							user.save(function(err) {
 								if (err) {
 									console.log(err);
 								} else {
 									res.json({ success:true, message: 'Username has been updated!'});
 								}
 							}); 
 						}
 					});
 				} else {
 					res.json({ success: false, message: 'Insufficient permission'});
 				}
 			}
 			if (newEmail) {
 				if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
 					User.findOne({ _id: editUser }, function(err, user) {
 						if(err) throw err;
 						if (!user) {
 							res.json({ success: false, message: 'No user found'});
 						} else {
 							user.email = newEmail;
 							user.save(function(err) {
 								if (err) {
 									console.log(err);
 								} else {
 									res.json({ success:true, message: 'Email has been updated!'});
 								}
 							}); 
 						}
 					});
 				} else {
 					res.json({ success: false, message: 'Insufficient permission'});
 				} 
 			} 
 			if (newPermission) {
 				if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
 					User.findOne({ _id: editUser }, function(err, user) {
 						if(err) throw err;
 						if (!user) {
 							res.json({ success: false, message: 'No user found'});
 						} else {
 							if (newPermission === 'user') {
 								if (user.permission === 'admin') {
 									if (mainUser.permission !== 'admin') {
 										res.json({ success: false, message: 'Insufficient permission. You must be an admin to downgrade another admin'});
									} else {
 										user.permission = newPermission;
 										user.save( function(err) {
 											if (err) {
 												console.log(err);
 											} else {
 												res.json({ success: true, message: 'permission have been updated'});
 											}
 										});
 									}
 								} else {
 									user.permission = newPermission;
 									user.save( function(err) {
 										if (err) {
 											console.log(err);
 										} else {
 											res.json({ success: true, message: 'permission have been updated'});
 										}
 									});
 								}
 							}
 							if (newPermission === 'moderator') {
 								if (user.permission === 'admin') {
 									if (mainUser.permission !== 'admin') {
 										res.json({ success: false, message: 'Insufficient permission. You must be an admin to downgrade another admin'});
 									} else {
 										user.permission = newPermission;
 										user.save( function(err) {
 											if (err) {
 												console.log(err);
 											} else {
 												res.json({ success: true, message: 'permission have been updated'});
 											}
 										});
 									}
 								} else {
 									user.permission = newPermission;
 									user.save( function(err) {
 										if (err) {
 											console.log(err);
 										} else {
 											res.json({ success: true, message: 'permission have been updated'});
 										}
 									});
 								}
 							}
 							if (newPermission === 'admin') {
 								if (mainUser.permission === 'admin') {
 									user.permission = newPermission;
 									user.save( function(err) {
 										if (err) {
 											console.log(err);
 										} else {
 											res.json({ success: true, message: 'permission have been updated'});
 										}
 									});
 								} else {
 									res.json({ success: false, message: 'Insufficient permissions.You must ba an admin to upgrade someone to the admin level'});
 								}
 							}
 						}
 					});
 				} else {
 					res.json({ success: false, message: 'Insufficient permission'});
 				}
 			}
 		}
 	});
 });

 return router;
} 