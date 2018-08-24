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

Route::get('/', function () {
    return view('welcome');
});



Route::get('hello', function () {
    $tasks = [
        'add task',
        'find task',
        'review task'
    ];
    return view('hello', compact('tasks'));
});



/*Route::get('hello', function () {
    $name = 'Johna';
    return view('hello', compact('name'));
});*/



/*Route::get('hello', function () {
    $name = 'John';
    return view('hello', [
        'name' => $name
    ]);
});*/

Auth::routes();

Route::get('/home', 'HomeController@index')->name('home');
