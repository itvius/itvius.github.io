<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use GuzzleHttp\Client;
use GuzzleHttp\ClientInterface;
use GuzzleHttp\Exception\RequestException;

class DataController extends Controller
{
    public function postRequest()
    {

        /*$apiUrl = "https://preview.nekta.cloud/api.login";*/
        $client = new \GuzzleHttp\Client([
            'base_uri' => 'https://preview.nekta.cloud/'
        ]);
        $userEmail = 'fullstack@nekta.tech';
        $userPswd = 'fullstack';
        $post = [
            'authKey' => md5($userEmail . $userPswd)
        ];

        $response = $client->request('POST', '/api.login', $post);

        /*$devices = $client->request('/api.devices.all');*/

        if ($response['login'] === true) {

            /*$devices = $client->request('/api.devices.all');*/
            alert('Удача');

        }

       /* echo '<pre>';

        print_r($devices);

        echo '</pre>';*/

    }
}
