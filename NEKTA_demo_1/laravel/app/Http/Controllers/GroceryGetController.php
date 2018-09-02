<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use DB;

class GroceryGetController extends Controller
{
    public function getdata() {
        /*$forms = Form::select('name', 'email', 'text');
        return Datatables::of($forms)->make(true);*/
        $forms = DB::select('select * from forms');

        return response()->json(['forms' => $forms]);
    }
}
