function updateClock() {
    var clockEl = document.getElementById('widget-clock');
    if (!clockEl) return;
    
    var now = new Date();
    var hours = now.getHours();
    var minutes = now.getMinutes();
    
    if (hours < 10) hours = '0' + hours;
    if (minutes < 10) minutes = '0' + minutes;
    
    var timeStr = hours + ':' + minutes;
    
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    var dateStr = days[now.getDay()] + ', ' + now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getFullYear();
    
    clockEl.innerHTML = '<div class="clock-time">' + timeStr + '</div><div class="clock-date">' + dateStr + '</div>';
}

function initClock() {
    updateClock();
    setInterval(updateClock, 1000);
}