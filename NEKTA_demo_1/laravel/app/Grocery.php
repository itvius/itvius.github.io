<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Grocery extends Model
{
    protected $forms = ['name', 'email', 'text'];
}
