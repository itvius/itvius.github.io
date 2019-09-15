const saveObject = {
    period: 1000,
    maxTime: 2000
};
let permission = false;
function firstArgument (param) {
    return param;
}
function secondArgument () {
    console.log('После очередной попытки получили true');
}
function threeArgument(first, second, third) {
    let timeout;
    let timer;
    timer = setInterval(function() {
        if (!first(permission)) {
            permission = true;
        } else if (first(permission)) {
            second();
            clearInterval(timer);
            clearTimeout(timeout);
        } else {
            console.log('error');
        }
    }, third.period);

    timeout = setTimeout(function() {
        clearInterval(timer);
        console.log('Время истекло');
    }, third.maxTime);
}

threeArgument(firstArgument, secondArgument, saveObject);
