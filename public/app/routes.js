var app = angular.module('appRoutes', ['ngRoute'])

.config(function($routeProvider, $locationProvider) {
	
	$routeProvider

	.when('/', {
		templateUrl: 'app/views/pages/home.html'
	})

	.when('/about', {
		templateUrl: 'app/views/pages/about.html'
	})

	.when('/register', {
		templateUrl: 'app/views/pages/users/register.html',
		controller: 'regCtrl',
		controllerAs: 'register',
		authenticated: false
	})

	.when('/login', {
		templateUrl: 'app/views/pages/users/login.html',
		authenticated: false
	})

	.when('/logout', {
		templateUrl: 'app/views/pages/users/logout.html',
		authenticated: true
	})

	.when('/profile', {
		templateUrl: 'app/views/pages/users/profile.html',
		authenticated: true
	})

	.when('/c', {
		templateUrl: 'app/views/pages/users/c.html',
		authenticated: true
	})

	.when('/cpp', {
		templateUrl: 'app/views/pages/users/cpp.html',
		authenticated: true
	})

	.when('/Java', {
		templateUrl: 'app/views/pages/users/Java.html',
		authenticated: true
	})

	.when('/python', {
		templateUrl: 'app/views/pages/users/python.html',
		authenticated: true
	})

	.when('/resetusername', {
		templateUrl: 'app/views/pages/users/reset/username.html',
		controller: 'usernameCtrl',
		controllerAs: 'username',
		authenticated: false
	})

	.when('/resetpassword', {
		templateUrl: 'app/views/pages/users/reset/password.html',
		controller: 'passwordCtrl',
		controllerAs: 'password',
		authenticated: false
	})

	.when('/management', {
		templateUrl: 'app/views/pages/management/management.html',
		controller: 'managementCtrl',
		controllerAs: 'management',
		authenticated: true,
		permission: ['admin', 'moderator']
	})

	.when('/edit/:id', {
		templateUrl: 'app/views/pages/management/edit.html',
		controller: 'editCtrl',
		controllerAs: 'edit',
		authenticated: true,
		permission: ['admin', 'moderator']
	})

	.when('/search', {
		templateUrl: 'app/views/pages/management/search.html',
		controller: 'managementCtrl',
		controllerAs: 'management',
		authenticated: true,
		permission: ['admin', 'moderator']
	})

	.otherwise({ redirectTo: '/'});

    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    });
});

app.run(['$rootScope', 'Auth', '$location', 'User', function($rootScope, Auth, $location, User) {

	$rootScope.$on('$routeChangeStart', function(event, next, current) {

		if (next.$$route !== undefined) {

			if (next.$$route.authenticated === true) {
				if (!Auth.isLoggedIn()) {
					event.preventDefault();
					$location.path('/');
				} else if (next.$$route.permission) {

					User.getPermission().then(function(data) {
						//console.log(data);
						if (next.$$route.permission[0] !== data.data.permission) {
							if(next.$$route.permission[1] !== data.data.permission) {
								event.preventDefault();
					            $location.path('/');
							}
						}
					});

				}
			} else if (next.$$route.authenticated === false) {
				if(Auth.isLoggedIn()) {
					event.preventDefault();
					$location.path('/profile');
				}
			}
		}
	});
}]);







