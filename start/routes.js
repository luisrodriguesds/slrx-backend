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
  return { message: "API it's working on port 3333" }
})

Route.group(() => {
	Route.get('/api/user', 'UserController.index');

	Route.post('/api/user/auth', 'UserController.authentication');
	Route.get('/api/user/token', 'UserController.token');
	Route.get('/api/user/logout', 'UserController.logout').middleware(['auth']);
	Route.get('/api/user/index', 'UserController.index').middleware(['auth']);
	Route.get('/api/user/show', 'UserController.show').middleware(['auth']);
	Route.get('/api/user/filter', 'UserController.filter').middleware(['auth']);
	Route.get('/api/user/filterby', 'UserController.filterby').middleware(['auth']);

	Route.get('/api/user/confirm', 'UserController.confirm');
	Route.get('/api/user/confirm-bond', 'UserController.confirm_bond');
	Route.get('/api/user/confirm-user', 'UserController.confirm_user');

	Route.post('/api/user', 'UserController.create').validator(['StoreUser'])
	Route.put('/api/user', 'UserController.update').middleware(['auth']);

  Route.post('/api/user/request-newpass', 'UserController.request_newpass').validator('RequestNewPassword')
  Route.post('/api/user/set-newpass', 'UserController.set_newpass').validator('SetNewPassword')
	Route.put('/api/user/change-pass', 'UserController.change_pass').middleware(['auth']).validator('ChangePassword')

  Route.delete('/api/user/delete', 'UserController.delete').middleware(['auth']);
	Route.delete('/api/user/delete-all', 'UserController.delete_all').middleware(['auth']);

	Route.post('/api/user/pedding', 'UserController.pedding');

	Route.post('/api/user/picture', 'UserController.picture');
	Route.get('/api/user/picture/:path', 'UserController.show_picture');

});

//Company
Route.group(() => {
	Route.get('/api/company/cnpj', 'CompanyDatumController.by_cnpj');
});

//AcessLevel
Route.group(() => {
	Route.get('/api/access-level/index', 'AccessLevelController.index');
});

//Professor Studant
Route.group(() => {
	Route.get('/api/professor-studant/show', 'ProfessorsStudentController.show').middleware(['auth']);
	Route.post('/api/professor-studant/store', 'ProfessorsStudentController.store').middleware(['auth']);
});

//Menu
Route.group(() => {
	Route.get('/api/menu/show', 'MenuController.show').middleware(['auth']);
});

//Solicitations
Route.group(() => {
	Route.post('/api/solictation', 'SolicitationController.store').middleware(['auth']);
	Route.post('/api/solictation/next-step-all', 'SolicitationController.next_step_all').middleware(['auth']);
	Route.post('/api/solictation/next-step', 'SolicitationController.next_step').middleware(['auth']);
	Route.get('/api/solictation/all', 'SolicitationController.all').middleware(['auth']);
	Route.get('/api/solictation/filter', 'SolicitationController.filter').middleware(['auth']);
	Route.get('/api/solictation/filter/user', 'SolicitationController.filterByUser').middleware(['auth']);
	Route.get('/api/solictation/filterby', 'SolicitationController.filterby').middleware(['auth']);
	Route.get('/api/solictation/show/:name', 'SolicitationController.show').middleware(['auth']);
	Route.put('/api/solictation/update', 'SolicitationController.update').middleware(['auth']);
	Route.delete('/api/solictation/destroy/:name', 'SolicitationController.destroy').middleware(['auth']);
	Route.delete('/api/solictation/destroy-all', 'SolicitationController.destroy_all').middleware(['auth']);

	Route.get('/api/solictation/proposta', 'SolicitationController.proposta');
	Route.get('/api/solictation/ordem', 'SolicitationController.ordem');

	//head of dashboard
	Route.get('/api/solictation/head-dash', 'SolicitationController.head_dash');

});

//Documents - Proposta e ordem de serviço
Route.group(() => {
	Route.post('/api/documents/proposta', 'DocumentController.store_proposta').middleware(['auth']);
	Route.get('/api/documents/proposta', 'DocumentController.index_proposta').middleware(['auth']);
	Route.get('/api/documents', 'DocumentController.index').middleware(['auth']);
	Route.delete('/api/documents/proposta', 'DocumentController.delete_proposta').middleware(['auth']);

});

//Gaps
Route.group(() => {
	Route.get('/api/gap', 'GapController.index').middleware(['auth']);
});

//Equipments
Route.group(() => {
	Route.get('/api/equipment', 'EquipmentController.index').middleware(['auth']);
	Route.get('/api/equipment/all', 'EquipmentController.all').middleware(['auth']);
	Route.get('/api/equipment/:id', 'EquipmentController.show').middleware(['auth']);
	Route.put('/api/equipment/:id', 'EquipmentController.update').middleware(['auth']);
	Route.delete('/api/equipment/:id', 'EquipmentController.destroy').middleware(['auth']);
	Route.post('/api/equipment', 'EquipmentController.store').middleware(['auth']);
});

//Envio de email
Route.group(() => {
	Route.post('/api/documents/email', 'DocumentController.email').middleware(['auth']);
});

//Download do resultado
Route.get('/api/results/:name', 'SolicitationController.results');

//Useful Files
Route.group(() => {
	Route.get('/api/useful-files', 'UsefulFileController.index').middleware(['auth']);
	Route.get('/api/useful-files/show/:id', 'UsefulFileController.show').middleware(['auth']);
	Route.post('/api/useful-files', 'UsefulFileController.store').middleware(['auth']);
	Route.put('/api/useful-files/:id', 'UsefulFileController.update').middleware(['auth']);
	Route.get('/api/useful-files/donwload/:name', 'UsefulFileController.download');
	Route.delete('/api/useful-files/destoy/:id', 'UsefulFileController.destroy').middleware(['auth']);

});

//Statistics
Route.group(() => {
  Route.get('/api/statistics/samples', 'StatisticController.samples')
  Route.get('/api/statistics/samples-year', 'StatisticController.samples_year')
  Route.get('/api/statistics/samples-group', 'StatisticController.sample_groups')
})

