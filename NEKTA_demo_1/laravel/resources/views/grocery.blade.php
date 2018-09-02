@extends('layouts.app')

@section('content')
    <div class="container">
        <div class="row justify-content-center">
            <form method="POST" id="contactform" enctype="multipart/form-data" class="py-4">
                {{ csrf_field() }}
                <div class="form-group">
                    <label for="exampleInputName">Ваше имя</label>
                    <input type="text" class="form-control" placeholder="ФИО" id="name" name="name" required>

                    <label for="exampleInputEmail1" class="pt-2">Email</label>
                    <input type="email" class="form-control" aria-describedby="emailHelp" placeholder="Введите E-mail" id="email" name="email" required>
                    {{--<small id="emailHelp" class="form-text text-muted">We'll never share your email with anyone else.</small>--}}

                    <label for="exampleFormControlTextarea1" class="pt-2">Текст сообщения</label>
                    <textarea class="form-control"  rows="3" id="text" name="text" required></textarea>

                    {{--<label for="exampleFormControlFile1">Example file input</label>--}}
                    <input type="file" class="form-control-file pt-2" id="file" multiple="true" name="file[]" required>
                </div>
                <button type="submit" class="btn btn-primary" id="ajaxSubmit">Submit</button>
            </form>

            <div class="table-responsive">
                    <table class="table">
                    <script>
                    </script>
                    <thead>
                    <tr>
                        <th scope="col">id</th>
                        <th scope="col">Name</th>
                        <th scope="col">E-mail</th>
                        <th scope="col">Text</th>
                        <th scope="col">File</th>
                    </tr>
                    </thead>
                    <tbody id="forms">
                    <?php $forms = DB::select('select * from forms'); ?>
                    @foreach ($forms as $form)
                        <tr>
                            <th scope="row">{{ $form->id }}</th>

                            <td>{{ $form->name}}</td>

                            <td>{{ $form->email }}</td>

                            <td>{{ $form->text }}</td>

                             <td>{{ $form->file }}</td>

                        </tr>
                    @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>

@endsection