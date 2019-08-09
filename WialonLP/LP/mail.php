<?php
$phone = $_POST['phone'];
$name = $_POST['name'];
$desctext='Заявка с сайта';
if (isset($_POST['name'])) {$name = $_POST['name'];}
if (isset($_POST['tel'])) {$phone = $_POST['phone'];}
// $to = "sales@wialon-service.ru";
$to = "itvius@gmail.com";
$headers = "Content-type: text/plain; charset = utf-8";
$subject = "Заявка с Вашего сайта 'Лэндос для выставки'";
$message = $desctext . "\nИмя пославшего:"  . $name . "\nТелефон:"  . $phone;
if(mail ($to, $subject, $message, $headers)){
?>
<script type="text/javascript">
    alert('Спасибо за заявку. Мы свяжемся с вами в ближайшее время.');
    Location.reload(true);

</script>
<?}?>