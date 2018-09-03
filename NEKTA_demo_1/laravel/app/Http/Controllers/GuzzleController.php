<?php

namespace App\Http\Controllers;

/*use Illuminate\Http\Request;*/
use GuzzleHttp\Client;
use function GuzzleHttp\Promise\exception_for;
use GuzzleHttp\Psr7\hash;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use GuzzleHttp\Psr7\Request;
use GuzzleHttp\Exception\RequestException;
class GuzzleController extends Controller
{
    public function getData (){


        $client = new Client([
            'base_uri' => "https://preview.nekta.cloud/",
            ['cookies' => true ]
        ]);

        $userEmail = "fullstack@nekta.tech";
        $userPswd = "fullstack";

        $post = [
            'authKey' => md5($userEmail . $userPswd)
        ];

        $send_headers = [
            'Accept' => 'Accept: application/json'
        ];

            $json_response = $client->request('POST', '/api.login', $send_headers, $post);

            if ($json_response['login'] === true) {

                /*$devices = $client->request('/api.devices.all');

                return $devices->getBody();*/

                return 'ура';
            } else {
            return 'ff';
            }

                /* return 'ура';*
             } else {
                 return 'fail';
             }
             } catch (RequestException $e) {
                 echo Psr7\str($e->getRequest());
                 if ($e->hasResponse()) {
                     echo Psr7\str($e->getResponse());
                 }
             }

            /* $response = $client->request('POST', '/api.login', $post);

            /* $json_response = $client->request('POST','/api.login', $post);*

             if ($response['login'] === true) {

                 $devices = $client->request('/api.devices.all');

                 return $devices->getBody();
                /* return 'ура';*
             } else {
                 return 'fail';
             }*/

        /*dd($response);*/



        /*$mock = new MockHandler([
            new Response(200, ['X-Foo' => 'Bar']),
            new Response(202, ['Content-Length' => 0]),
            new RequestException("Error Communicating with Server", new Request('GET', 'test'))
        ]);

        $handler = HandlerStack::create($mock);
        $client = new Client(['handler' => $handler]);

// The first request is intercepted with the first response.
        echo $client->request('GET', '/')->getStatusCode();
//> 200
// The second request is intercepted with the second response.
        echo $client->request('GET', '/')->getStatusCode();
//> 202*/

       /* $client = new Client([
            'base_uri' => 'https://preview.nekta.cloud/'
        ]);

        $userEmail = 'fullstack@nekta.tech';
        $userPswd = 'fullstack';

        $authr = [
            'authKey' => md5($userEmail . $userPswd)
        ];

        $response = $client->request('GET', '/api.login', $authr);

        dd($response);*/

       /* echo $response->getStatusCode();*/

       /*$decode =json_decode($response->gerBody(), true);*/



        /*$data = $response->getBody();
        dd($data);*/
        /*if ($response['login'] === true) {

            /*$devices = $client->request('/api.devices.all');*

        }*/

    }
}
