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


/*Route::get('/form', 'grocery' /*'FormController@index')->name('form');
Route::post('/form', 'Ajax\ContactController@post');*/

Route::view('/grocery', 'grocery');
Route::post('/grocery', 'GroceryController@comment');
/*Route::get('/grocery/getdata', 'GroceryGetController@getdata');*/

/*Route::get('/grocery/getdata', 'AjaxdataController@getdata')-name('ajaxdata.getdata');*/

/*Route::get('/form', 'TableController@show');*/
/*Route::get('get','DataController@getRequest');*/
/*Route::get('/post','DataController@postRequest');*/

Auth::routes();

Route::get('/home', 'HomeController@index')->name('home');