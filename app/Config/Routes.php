<?php

namespace Config;

use App\Controllers\SiswaController;
use CodeIgniter\Config\BaseConfig;
use CodeIgniter\Router\RouteCollection;

$routes = Services::routes();

$routes->get('/', 'PageController::index');
$routes->get('/home', 'PageController::home');
$routes->get('/siswa', 'PageController::siswaList');
$routes->get('/siswa/(:num)', 'PageController::getSiswa/$1');
$routes->post('/siswa/create', 'PageController::createSiswa');
$routes->post('/siswa/update/(:num)', 'PageController::updateSiswa/$1');
$routes->delete('/siswa/delete/(:num)', 'PageController::deleteSiswa/$1');
