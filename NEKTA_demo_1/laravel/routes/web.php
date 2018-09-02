<?php

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/


Route::get('/', function() {
    return view('welcome');
});

Route::view('/grocery', 'grocery');
Route::post('/grocery', 'GroceryController@comment');
Route::get('/guzzle', 'GuzzleController@getData');

Auth::routes();

Route::get('/home', 'HomeController@index')->name('home');