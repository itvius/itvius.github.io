<?php

namespace App\Http\Controllers\Ajax;

use App\Grocery;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Http\Requests;
use DB;

class ContactController extends Controller
{
    public function send(Request $request)
    {

        dd($request->all());


        /*$name = 1; /*$request->name;
        $email = 2; /*$request->email;
        $text = 3; /*$request->text;*/

        /*$supplier_name = $request->supplier_name;*/
        /*$extension = $request->file('file');*/
        /*$extension = $request->file('file')->getClientOriginalExtension();
        $dir = 'assets/files/';
        $filename = uniqid().'_'.time().'_'.date('Ymd').'.'.$extension;
        $request->file('file')->move($dir, $filename);


        $add_product = DB::table("forms")->insert([
            'name' => $name,
            'email' => $email,
            'text' => $text
            /*'file' => $dir . $filename
        ]);

        return redirect()->route('form');*/

        /*return redirect('/form');*/
        /*return back()->withInput();*/
    }
}