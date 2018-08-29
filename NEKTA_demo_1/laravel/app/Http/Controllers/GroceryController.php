<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Grocery;

class GroceryController extends Controller
{
    public function store(Request $request)
    {
        /*$grocery = new Grocery();*/
        $name = $request->name;
        $email = $request->email;
        $text = $request->text;

        /*$grocery.append($name);
        $grocery.append($email);
        $grocery.append($text);*/

        return response()->json($request->all);
    }
}