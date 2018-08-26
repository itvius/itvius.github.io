<?php

namespace App\Http\Controllers\Ajax;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Http\Requests;
use DB;

class ContactController extends Controller
{
    public function send(Request $request)
    {
        $name = $request->name;
        $email = $request->email;
        $text = $request->text;


        $add_product = DB::table("forms")->insert([
            'name' => $name,
            'email' => $email,
            'text' => $text
            /*'file' => $file*/
        ]);


    }
}
