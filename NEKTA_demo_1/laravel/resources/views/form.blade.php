@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row justify-content-center">
        <form method="post" id="contactform" action="/form" enctype="multipart/form-data">
            {{ csrf_field() }}
            <div class="form-group">

                <input type="text" class="form-control" placeholder="First name" name="name">

                <label for="exampleInputEmail1">Email address</label>
                <input type="email" class="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" placeholder="Enter email" name="email">
                <small id="emailHelp" class="form-text text-muted">We'll never share your email with anyone else.</small>

                <label for="exampleFormControlTextarea1">Example textarea</label>
                <textarea class="form-control" id="exampleFormControlTextarea1" rows="3" name="text"></textarea>

                <label for="exampleFormControlFile1">Example file input</label>
                <input type="file" class="form-control-file" id="exampleFormControlFile1" name="file" multiple="multiple">
            </div>

            <button id="save" type="submit" class="btn btn-primary">Submit</button>
        </form>

        <table class="table">
            <thead>
            <tr>
                <th scope="col">id</th>
                <th scope="col">Name</th>
                <th scope="col">E-mail</th>
                <th scope="col">Text</th>
                <th scope="col">File</th>
            </tr>
            </thead>
            <tbody>
            @foreach ($forms as $form)
            <tr class="hidden">
                <th scope="row">{{ $form->id }}</th>

                <td>{{ $form->name }}</td>

                <td>{{ $form->email }}</td>

                <td>{{ $form->text }}</td>

                <td>{{ $form->file }}</td>

            </tr>
            @endforeach
            </tbody>
        </table>
    </div>
</div>



@endsection