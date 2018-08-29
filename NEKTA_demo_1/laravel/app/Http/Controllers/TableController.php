<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use DB;

class TableController extends Controller
{
    public function index() {
        /*$TableData = forms::all();*/

        $forms = DB::select('select * from forms');
        $data =['forms' => $forms];

        return view('form.form', $data);
       /* return view('form', ['forms' => $forms]);*/

        /*return response()->json(['forms' => $forms]);*/
    }
}