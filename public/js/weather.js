function fetchWeather(apiKey, lat, lon, units, callback) {
    if (!apiKey || !lat || !lon || !callback) return;
    
    var xhr = new XMLHttpRequest();
    var url = 'https://api.openweathermap.org/data/3.0/onecall?lat=' + lat + '&lon=' + lon + '&exclude=minutely,alerts&units=' + units + '&appid=' + apiKey;
    
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                var response = null;
                try {
                    response = JSON.parse(xhr.responseText);
                } catch (e) {
                    callback({ error: 'Parse Error' });
                    return;
                }
                if (response && response.current && response.hourly && response.daily) {
                    callback({ data: response, units: units });
                } else {
                    callback({ error: 'Invalid Data Format (Requires One Call API 3.0)' });
                }
            } else {
                callback({ error: 'API Error: ' + xhr.status });
            }
        }
    };
    xhr.send();
}

function getConditionIcon(condition) {
    if (!condition) return '☁️';
    var lower = condition.toLowerCase();
    if (lower.indexOf('clear') > -1) return '☀️';
    if (lower.indexOf('cloud') > -1) return '☁️';
    if (lower.indexOf('rain') > -1) return '🌧';
    if (lower.indexOf('snow') > -1) return '❄️';
    if (lower.indexOf('thunder') > -1) return '⛈';
    return '☁️';
}

function calculateActivityStatus(temp, wind, condition, type, units) {
    var isImperial = units === 'imperial';
    
    var windLimit = isImperial ? (type === 'cycling' ? 15 : 22) : (type === 'cycling' ? 7 : 10);
    var coldLimit = isImperial ? (type === 'cycling' ? 32 : 14) : (type === 'cycling' ? 0 : -10);
    var coolLimit = isImperial ? (type === 'cycling' ? 50 : 41) : (type === 'cycling' ? 10 : 5);

    if (condition === 'Rain' || condition === 'Thunderstorm') return { status: 'Poor', cls: 'status-poor', face: '☹️', reason: 'Rain' };
    if (condition === 'Snow') return { status: 'Poor', cls: 'status-poor', face: '☹️', reason: 'Snow' };
    
    if (wind > windLimit) return { status: 'Poor', cls: 'status-poor', face: '☹️', reason: 'High Wind' };
    if (temp < coldLimit) return { status: 'Poor', cls: 'status-poor', face: '☹️', reason: 'Freezing' };
    
    if (temp < coolLimit) return { status: 'Moderate', cls: 'status-moderate', face: '😐', reason: 'Chilly' };
    if (type === 'cycling' && wind > (windLimit * 0.7)) return { status: 'Moderate', cls: 'status-moderate', face: '😐', reason: 'Breezy' };
    
    return { status: 'Good', cls: 'status-good', face: '😀', reason: 'Optimal' };
}

function renderWeatherWidgets(result) {
    if (!result) return;
    
    var wCurrent = document.getElementById('widget-current');
    var wHourly = document.getElementById('widget-hourly');
    var wDaily = document.getElementById('widget-daily');
    var wCycling = document.getElementById('widget-cycling');
    var wWalking = document.getElementById('widget-walking');

    if (!wCurrent || !wHourly || !wDaily || !wCycling || !wWalking) return;

    if (result.error) {
        wCurrent.innerHTML = '<p class="error-text">' + result.error + '</p>';
        return;
    }

    var data = result.data;
    var units = result.units;

    var city = data.timezone ? data.timezone.split('/')[1].replace('_', ' ') : 'Location';
    
    var current = data.current;
    var temp = Math.round(current.temp);
    var feels = Math.round(current.feels_like);
    var condition = current.weather[0].main;
    var wind = current.wind_speed || 0;
    var icon = getConditionIcon(condition);
    var symbol = units === 'imperial' ? '°F' : '°C';
    var speedSymbol = units === 'imperial' ? 'mph' : 'm/s';
    var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var currentDayIndex = new Date().getDay();

    var cHtml = '<div class="city">' + city + '</div>';
    cHtml += '<div class="temp-main">' + temp + symbol + ' ' + icon + '</div>';
    cHtml += '<div class="temp-details">' + condition + ' | Feels like ' + feels + symbol + '</div>';
    wCurrent.innerHTML = cHtml;
    wCurrent.dataset.modalHtml = '<h2>Current Details</h2><div class="modal-detail-row"><span>Temperature</span><span>' + temp + symbol + '</span></div><div class="modal-detail-row"><span>Feels Like</span><span>' + feels + symbol + '</span></div><div class="modal-detail-row"><span>Wind Speed</span><span>' + wind + ' ' + speedSymbol + '</span></div><div class="modal-detail-row"><span>Humidity</span><span>' + current.humidity + '%</span></div><div class="modal-detail-row"><span>Pressure</span><span>' + current.pressure + ' hPa</span></div>';

    var hHtml = '<div class="hourly-header">';
    hHtml += '<div id="hourly-day-label" class="hourly-day-label">Today</div>';
    hHtml += '<button id="btn-hourly-refresh" class="btn-now">Now ↺</button>';
    hHtml += '</div>';
    hHtml += '<div class="hourly-container" id="hourly-scroll-container">';
    
    var hModalHtml = '<h2>Hourly Forecast</h2>';
    
    for (var i = 0; i < Math.min(data.hourly.length, 48); i++) {
        var hItem = data.hourly[i];
        var itemDate = new Date(hItem.dt * 1000);
        var hTime = itemDate.getHours() + ':00';
        var hTemp = Math.round(hItem.temp);
        var hIcon = getConditionIcon(hItem.weather[0].main);
        
        var itemDayIndex = itemDate.getDay();
        var itemDayName = (itemDayIndex === currentDayIndex) ? 'Today' : dayNames[itemDayIndex];
        
        hHtml += '<div class="hour-item" data-day="' + itemDayName + '">';
        hHtml += '<div class="hour-time">' + hTime + '</div>';
        hHtml += '<div class="hour-icon">' + hIcon + '</div>';
        hHtml += '<div class="hour-temp">' + hTemp + '°</div>';
        hHtml += '</div>';

        if (i < 24) {
            hModalHtml += '<div class="modal-detail-row"><span>' + itemDayName + ' ' + hTime + '</span><span>' + hIcon + ' ' + hItem.weather[0].main + '</span><span>' + hTemp + symbol + '</span></div>';
        }
    }
    hHtml += '</div>';
    wHourly.innerHTML = hHtml;
    wHourly.dataset.modalHtml = hModalHtml;

    var scrollContainer = document.getElementById('hourly-scroll-container');
    var dayLabel = document.getElementById('hourly-day-label');
    var refreshBtn = document.getElementById('btn-hourly-refresh');

    if (scrollContainer && dayLabel) {
        scrollContainer.onscroll = function() {
            var items = scrollContainer.getElementsByClassName('hour-item');
            if (!items || items.length === 0) return;
            var containerRect = scrollContainer.getBoundingClientRect();
            var centerTarget = containerRect.left + 30;

            for (var i = 0; i < items.length; i++) {
                var rect = items[i].getBoundingClientRect();
                if (rect.left <= centerTarget && rect.right >= centerTarget) {
                    var dayName = items[i].getAttribute('data-day');
                    if (dayName && dayLabel.innerText !== dayName) {
                        dayLabel.innerText = dayName;
                    }
                    break;
                }
            }
        };
    }

    if (refreshBtn) {
        refreshBtn.onclick = function(e) {
            e.stopPropagation();
            if (scrollContainer) {
                scrollContainer.scrollLeft = 0;
            }
            if (typeof window.refreshDashboard === 'function') {
                window.refreshDashboard();
            }
        };
    }

    var dHtml = '';
    var dModalHtml = '<h2>8-Day Forecast</h2>';
    
    for (var j = 0; j < Math.min(data.daily.length, 5); j++) {
        var dItem = data.daily[j];
        var dDateObj = new Date(dItem.dt * 1000);
        var dayNameDaily = j === 0 ? 'Today' : dayNames[dDateObj.getDay()];
        var dMin = Math.round(dItem.temp.min);
        var dMax = Math.round(dItem.temp.max);
        var dIconDaily = getConditionIcon(dItem.weather[0].main);

        dHtml += '<div class="daily-item">';
        dHtml += '<div class="daily-day">' + dayNameDaily + '</div>';
        dHtml += '<div class="daily-icon">' + dIconDaily + '</div>';
        dHtml += '<div class="daily-temps"><span>' + dMax + '°</span><span class="min">' + dMin + '°</span></div>';
        dHtml += '</div>';

        dModalHtml += '<div class="modal-detail-row"><span>' + dayNameDaily + '</span><span>' + dIconDaily + '</span><span>' + dMax + '° / ' + dMin + '°</span></div>';
    }
    wDaily.innerHTML = dHtml;
    wDaily.dataset.modalHtml = dModalHtml;

    var actCyclingHtml = '<div class="hourly-header"><h3>🚲 Cycling</h3></div><div class="hourly-container">';
    var actWalkingHtml = '<div class="hourly-header"><h3>🚶 Walking</h3></div><div class="hourly-container">';
    var cyclModalHtml = '<h2>Cycling Conditions</h2>';
    var walkModalHtml = '<h2>Walking Conditions</h2>';

    for (var k = 0; k < Math.min(data.hourly.length, 24); k++) {
        var aItem = data.hourly[k];
        var aDateObj = new Date(aItem.dt * 1000);
        var aTime = aDateObj.getHours() + ':00';
        var aDayName = (aDateObj.getDay() === currentDayIndex) ? 'Today' : dayNames[aDateObj.getDay()];
        
        var aTemp = Math.round(aItem.temp);
        var aWind = aItem.wind_speed || 0;
        var aCond = aItem.weather[0].main;
        
        var aCycStatus = calculateActivityStatus(aTemp, aWind, aCond, 'cycling', units);
        var aWalkStatus = calculateActivityStatus(aTemp, aWind, aCond, 'walking', units);

        actCyclingHtml += '<div class="hour-item">';
        actCyclingHtml += '<div class="hour-time">' + aTime + '</div>';
        actCyclingHtml += '<div class="hour-icon" style="font-size: 28px;">' + aCycStatus.face + '</div>';
        actCyclingHtml += '<div class="hour-reason">' + aCycStatus.reason + '</div>';
        actCyclingHtml += '</div>';

        actWalkingHtml += '<div class="hour-item">';
        actWalkingHtml += '<div class="hour-time">' + aTime + '</div>';
        actWalkingHtml += '<div class="hour-icon" style="font-size: 28px;">' + aWalkStatus.face + '</div>';
        actWalkingHtml += '<div class="hour-reason">' + aWalkStatus.reason + '</div>';
        actWalkingHtml += '</div>';

        cyclModalHtml += '<div class="modal-detail-row"><span>' + aDayName + ' ' + aTime + '</span><span>' + aTemp + symbol + '</span><span class="' + aCycStatus.cls + '">' + aCycStatus.face + ' ' + aCycStatus.status + ' (' + aCycStatus.reason + ')</span></div>';
        walkModalHtml += '<div class="modal-detail-row"><span>' + aDayName + ' ' + aTime + '</span><span>' + aTemp + symbol + '</span><span class="' + aWalkStatus.cls + '">' + aWalkStatus.face + ' ' + aWalkStatus.status + ' (' + aWalkStatus.reason + ')</span></div>';
    }

    actCyclingHtml += '</div>';
    actWalkingHtml += '</div>';

    wCycling.innerHTML = actCyclingHtml;
    wCycling.dataset.modalHtml = cyclModalHtml;

    wWalking.innerHTML = actWalkingHtml;
    wWalking.dataset.modalHtml = walkModalHtml;
}