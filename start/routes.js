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
	Route.get('/api/user/token', 'UserController.token');
	Route.get('/api/user/logout', 'UserController.logout').middleware(['auth']);

	Route.get('/api/user/confirm', 'UserController.confirm');
	Route.get('/api/user/confirm-bond', 'UserController.confirm_bond');
	Route.get('/api/user/confirm-user', 'UserController.confirm_user');

	Route.post('/api/user', 'UserController.create');
	Route.put('/api/user', 'UserController.update').middleware(['auth']);

  	Route.get('/api/user/request-newpass/:email', 'UserController.request_newpass');
  	Route.post('/api/user/set-newpass', 'UserController.set_newpass');
  	Route.put('/api/user/change-pass', 'UserController.change_pass').middleware(['auth']);
});

//Company
Route.group(() => {
	Route.get('/api/company/cnpj', 'CompanyDatumController.by_cnpj');
});

//Professor Studant
Route.group(() => {
	Route.get('/api/professor-studant/show', 'ProfessorsStudentController.show').middleware(['auth']);
});

//Menu
Route.group(() => {
	Route.get('/api/menu/show', 'MenuController.show').middleware(['auth']);
});

//Solicitations
Route.group(() => {
	Route.post('/api/solictation', 'SolicitationController.store').middleware(['auth']);
	Route.get('/api/solictation/all', 'SolicitationController.all').middleware(['auth']);
	Route.get('/api/solictation/filter', 'SolicitationController.filter').middleware(['auth']);
	Route.get('/api/solictation/show/:name', 'SolicitationController.show').middleware(['auth']);
	Route.get('/api/solictation/update', 'SolicitationController.update').middleware(['auth']);
	Route.delete('/api/solictation/destroy/:name', 'SolicitationController.destroy').middleware(['auth']);
	Route.delete('/api/solictation/destroy-all', 'SolicitationController.destroy_all').middleware(['auth']);
});

//Gaps
Route.group(() => {
	Route.get('/api/gap', 'GapController.index').middleware(['auth']);
});

//Equipments
Route.group(() => {
	Route.get('/api/equipment', 'EquipmentController.index').middleware(['auth']);
});
