<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades;
/*use Illuminate\Http\File;*/
use Illuminate\Http\UploadedFile;
use App\Grocery;
use File;
use DB;
use Datatables;
use App\Http\Requests;

class GroceryController extends Controller
{
    public function comment (Request $input)
    {

        /*return $input -> all();*/

        $name = $_POST['name'];
        $email = $_POST['email'];
        $text = $_POST['text'];

        /*if($input->hasFile('file')) {
           foreach ($input->file as $file) {
            print_r($file);
            }
        }*/

        /*$extension = $input->file('file');*/
       /* $extension = $input->file('file')->getClientOriginalExtension();
        $dir = 'assets/files/';
        $filename = uniqid().'_'.time().'_'.date('Ymd').'.'.$extension;
        $input->file('file')->move($dir, $filename);*/
        $ffname = array ();
        $dir = '/app/public/upload/';

        if($input->hasFile('file')) {
            foreach ($input->file as $file) {

                $extension = $file->getClientOriginalExtension();
                $filename = uniqid().'_'.date('Ymd').'.'.$extension;
                $filesize = $file->getClientSize();
                $file->storeAs('public/upload', $filename);
                $Grocery = new File;
                $Grocery->name = $filename;
                $Grocery->size = $filesize;
                array_push($ffname, $filename .'  ');
            }

            $filenames = implode($dir, $ffname);

            $data = array(
                'name' => $input['name'],
                'email' => $input['email'],
                'text' => $input['text'],
                'file' => $dir . $filenames/*'/' . $dir . $filename*/
            );
            /*$data->append(array('file', $filename));*/
        }


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