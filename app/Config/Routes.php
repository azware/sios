<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');
$routes->get('siswa', 'SiswaController::index');
$routes->get('siswa/view/(:num)', 'SiswaController::view/$1');
$routes->get('siswa/create', 'SiswaController::create');
$routes->post('siswa/create', 'SiswaController::create');
$routes->post('siswa/edit/(:num)', 'SiswaController::edit/$1');
$routes->delete('siswa/delete/(:num)', 'SiswaController::delete/$1');
