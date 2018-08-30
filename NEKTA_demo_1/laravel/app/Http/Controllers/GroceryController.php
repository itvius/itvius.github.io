<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Grocery;
use DB;
use Datatables;
use App\Http\Requests;

class GroceryController extends Controller
{
    public function comment (Request $input)
    {

        $name = $_POST['name'];
        $email = $_POST['email'];
        $text = $_POST['text'];
       /* $file = $_POST['file'];*/


        /*$extension = $input->file('file');*/
        $extension = $input->file('file')->getClientOriginalExtension();
        $dir = 'assets/files/';
        $filename = uniqid().'_'.time().'_'.date('Ymd').'.'.$extension;
        $input->file('file')->move($dir, $filename);


        $data = array(
            'name' => $input['name'],
            'email' => $input['email'],
            'text' => $input['text'],
            'file' => $dir . $filename
        );

        $result = DB::table('forms')->insert($data);
        if ($result) {
            return redirect('grocery')->with($result);
           /* return response()->json($result/*[
                'status' => 'success',
                'name' => $name,
                'email' => $email,
                'text' => $text
            ]*);*/
        }
        else {
            return response()->json([
                'status' => 'error'
            ]);
        }



        /*$add_product = DB::table("forms")->insert([
            'name' => $request->name,
            'email' => $request->email,
            'text' => $request->text
            /*'file' => $dir . $filename
        ]);*/

        /*$data = [
            'name' => 'name',
            'email' => 'email',
            'text' => 'text'
            ];*/

       /* $forms = DB::select('select * from forms');

        return response()->json(['forms' => $forms]);*/
        /*return json_encode(['forms' => $forms]);*/

        /*$forms = DB::select('select * from forms');

       return view('grocery', ['forms' => $forms]);*/

        /*return response()->json(['forms' => $forms]);*/

        /*return View::make('grocery')->with('forms', $forms);*/
        /*return response()->json(view('grocery', ['forms' => $forms]));*/
    }
}