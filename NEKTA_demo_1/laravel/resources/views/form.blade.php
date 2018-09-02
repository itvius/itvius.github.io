@extends('layouts.app')

@section('content')
    <script src="http://code.jquery.com/jquery-3.3.1.min.js"
            integrity="sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8="
            crossorigin="anonymous">
    </script>
<div class="container">
    <div class="row justify-content-center">
        <form class="py-3" method="post" id="contactform" enctype="multipart/form-data">
            {{ csrf_field() }}
            <div class="form-group">
                <input type="text" class="form-control" placeholder="First name" id="name" name="name">

                <label for="exampleInputEmail1">Email address</label>
                <input type="email" class="form-control" aria-describedby="emailHelp" placeholder="Enter email" id="email" name="email">
                <small id="emailHelp" class="form-text text-muted">We'll never share your email with anyone else.</small>

                <label for="exampleFormControlTextarea1">Example textarea</label>
                <textarea class="form-control"  rows="3" id="text" name="text"></textarea>

                <label for="exampleFormControlFile1">Example file input</label>
                <input type="file" class="form-control-file" id="file" name="file[]" :multiple="multiple">
            </div>
            <button type="submit" class="btn btn-primary" id="ajaxSubmit">Submit</button>
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
            <tr>
                <th scope="row">{{ $form->id }}</th>

                <td>{{ $form->name }}</td>

                <td>{{ $form->email }}</td>

                <td>{{ $form->text }}</td>

                {{--<td>{{ $form->file }}</td>--}}

            </tr>
            @endforeach
            </tbody>
        </table>
    </div>
</div>

@endsection