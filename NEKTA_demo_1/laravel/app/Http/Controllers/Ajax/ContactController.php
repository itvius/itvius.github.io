<?php

namespace App\Http\Controllers\Ajax;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Http\Requests;
use DB;

class ContactController extends Controller
{
    public function post(Request $request)
    {
        $name = $request->name;
        $email = $request->email;
        $text = $request->text;

        $supplier_name = $request->supplier_name;
        $extension = $request->file('file');
        $extension = $request->file('file')->getClientOriginalExtension(); // getting excel extension
        $dir = 'assets/files/';
        $filename = uniqid().'_'.time().'_'.date('Ymd').'.'.$extension;
        $request->file('file')->move($dir, $filename);


        $add_product = DB::table("forms")->insert([
            'name' => $name,
            'email' => $email,
            'text' => $text,
            'file' => $dir . $filename
        ]);


    }
}
