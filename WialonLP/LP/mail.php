<?php
$phone = $_POST['phone'];
$name = $_POST['name'];
$email = $_POST['email'];
$desctext='Заявка с сайта';
if (isset($_POST['name'])) {$name = $_POST['name'];}
if (isset($_POST['phone'])) {$phone = $_POST['phone'];}
if (isset($_POST['email'])) {$email = $_POST['email'];}
$to = "sales@wialon-service.ru";
$headers = "Content-type: text/plain; charset = utf-8";
$subject = "Заявка с Вашего сайта 'Лэндос для выставки'";
$message = $desctext . "\nИмя пославшего:"  . $name . "\nТелефон:"  . $phone . "\nEmail:" . $email;
if(mail ($to, $subject, $message, $headers)){
?>
<script type="text/javascript">
    alert('Спасибо за заявку. Мы свяжемся с вами в ближайшее время.');
    document.location.reload(true);

</script>
<?}?>