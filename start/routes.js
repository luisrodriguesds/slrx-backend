'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URLs and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')

Route.get('/', () => {
  return { message: "API it's working on port" }
})

Route.group(() => {
	Route.get('/api/user', 'UserController.index');

	Route.post('/api/user/auth', 'UserController.authentication');
	Route.get('/api/user/token', 'UserController.token').middleware(['auth']);
	Route.get('/api/user/logout', 'UserController.logout').middleware(['auth']);

	Route.get('/api/user/confirm', 'UserController.confirm');
	Route.get('/api/user/confirm-bond', 'UserController.confirm_bond');
	Route.get('/api/user/confirm-user', 'UserController.confirm_user');

	Route.post('/api/user', 'UserController.create');

  	Route.get('/api/user/request-newpass/:email', 'UserController.request_newpass');
  	Route.post('/api/user/set-newpass', 'UserController.set_newpass');
  	Route.put('/api/user/change-pass/:id', 'UserController.change_pass').middleware(['auth']);
});

Route.group(() => {
	Route.get('/api/company/cnpj', 'CompanyDatumController.for_cnpj');
});
