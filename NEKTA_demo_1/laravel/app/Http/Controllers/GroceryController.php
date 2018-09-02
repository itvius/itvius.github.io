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

        /*$extension = $input->file('file');*/
        $extension = $input->file('file')->getClientOriginalExtension();
        $dir = 'assets/files/';
        $filename = uniqid().'_'.time().'_'.date('Ymd').'.'.$extension;
        $input->file('file')->move($dir, $filename);


        $data = array(
            'name' => $input['name'],
            'email' => $input['email'],
            'text' => $input['text'],
            'file' => '/' . $dir . $filename
        );

        $result = DB::table('forms')->insert($data);
        if ($result === true) {
            return redirect('grocery')->with($result);
        }
        else {
            return response()->json([
                'status' => 'error'
            ]);
        }
    }
}