<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Http\Requests;
use DB;

class FormController extends Controller
{
    public function index()
    {


        /*return view('form');*/

        $forms = DB::select('select * from forms');
        $data =['forms' => $forms];

        return view('form', $data);
    }
}