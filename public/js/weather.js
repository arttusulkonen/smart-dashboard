function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function fetchWeather(apiKey, lat, lon, units, callback) {
    if (!apiKey || lat === null || lat === undefined || lat === '' || lon === null || lon === undefined || lon === '' || !callback) return;
    
    var xhr = new XMLHttpRequest();
    var url = 'https://api.openweathermap.org/data/3.0/onecall?lat=' + encodeURIComponent(lat) + '&lon=' + encodeURIComponent(lon) + '&units=' + encodeURIComponent(units) + '&appid=' + encodeURIComponent(apiKey);
    
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
                if (response && response.current && response.hourly) {
                    callback({ data: response, units: units });
                } else {
                    callback({ error: 'Invalid Data Format' });
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
    var wCycling = document.getElementById('widget-cycling');
    var wWalking = document.getElementById('widget-walking');

    if (!wCurrent || !wHourly || !wCycling || !wWalking) return;

    if (result.error) {
        wCurrent.innerHTML = '<p class="error-text">' + escapeHTML(result.error) + '</p>';
        return;
    }

    var data = result.data;
    var units = result.units;

    var cityRaw = 'Location';
    if (data && data.timezone) {
        if (data.timezone.indexOf('/') > -1) {
            var tzParts = data.timezone.split('/');
            if (tzParts.length > 1 && tzParts[1]) {
                cityRaw = tzParts[1].replace(/_/g, ' ');
            } else {
                cityRaw = data.timezone;
            }
        } else {
            cityRaw = data.timezone;
        }
    }
    var city = escapeHTML(cityRaw);
    
    var current = data.current;
    if (!current || !current.weather || !current.weather[0]) return;

    var temp = Math.round(current.temp);
    var feels = Math.round(current.feels_like);
    var conditionRaw = current.weather[0].main;
    var condition = escapeHTML(conditionRaw);
    var wind = current.wind_speed || 0;
    var icon = getConditionIcon(conditionRaw);
    var symbol = units === 'imperial' ? '°F' : '°C';
    var speedSymbol = units === 'imperial' ? 'mph' : 'm/s';
    var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var currentDayIndex = new Date().getDay();

    var cHtml = '<div class="city">' + city + '</div>';
    cHtml += '<div class="temp-main">' + escapeHTML(temp) + symbol + ' ' + icon + '</div>';
    cHtml += '<div class="temp-details">' + condition + ' | Feels like ' + escapeHTML(feels) + symbol + '</div>';
    wCurrent.innerHTML = cHtml;
    wCurrent.dataset.modalHtml = '<h2>Current Details</h2><div class="modal-detail-row"><span>Temperature</span><span>' + escapeHTML(temp) + symbol + '</span></div><div class="modal-detail-row"><span>Feels Like</span><span>' + escapeHTML(feels) + symbol + '</span></div><div class="modal-detail-row"><span>Wind Speed</span><span>' + escapeHTML(wind) + ' ' + speedSymbol + '</span></div><div class="modal-detail-row"><span>Humidity</span><span>' + escapeHTML(current.humidity) + '%</span></div><div class="modal-detail-row"><span>Pressure</span><span>' + escapeHTML(current.pressure) + ' hPa</span></div>';

    var hHtml = '<div class="hourly-header">';
    hHtml += '<div id="hourly-day-label" class="hourly-day-label">Today</div>';
    hHtml += '<button id="btn-hourly-refresh" class="btn-now">Now ↺</button>';
    hHtml += '</div>';
    hHtml += '<div class="hourly-container" id="hourly-scroll-container">';
    
    var hModalHtml = '<h2>Hourly Forecast</h2>';
    
    for (var i = 0; i < Math.min(data.hourly.length, 48); i++) {
        var hItem = data.hourly[i];
        if (!hItem || !hItem.weather || !hItem.weather[0]) continue;

        var itemDate = new Date(hItem.dt * 1000);
        var hTime = itemDate.getHours() + ':00';
        var hTemp = Math.round(hItem.temp);
        var hIcon = getConditionIcon(hItem.weather[0].main);
        var hCondRaw = hItem.weather[0].main;
        
        var itemDayIndex = itemDate.getDay();
        var itemDayNameRaw = (itemDayIndex === currentDayIndex) ? 'Today' : dayNames[itemDayIndex];
        var itemDayName = escapeHTML(itemDayNameRaw);
        
        hHtml += '<div class="hour-item" data-day="' + itemDayName + '">';
        hHtml += '<div class="hour-time">' + escapeHTML(hTime) + '</div>';
        hHtml += '<div class="hour-icon">' + hIcon + '</div>';
        hHtml += '<div class="hour-temp">' + escapeHTML(hTemp) + '°</div>';
        hHtml += '</div>';

        if (i < 24) {
            hModalHtml += '<div class="modal-detail-row"><span>' + itemDayName + ' ' + escapeHTML(hTime) + '</span><span>' + hIcon + ' ' + escapeHTML(hCondRaw) + '</span><span>' + escapeHTML(hTemp) + symbol + '</span></div>';
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

            for (var j = 0; j < items.length; j++) {
                var rect = items[j].getBoundingClientRect();
                if (rect.left <= centerTarget && rect.right >= centerTarget) {
                    var dayName = items[j].getAttribute('data-day');
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

    var actWalkingHtml = '<div class="hourly-header"><h3>🚶 Walking</h3></div><div class="hourly-container">';
    var actCyclingHtml = '<div class="hourly-header"><h3>🚲 Cycling</h3></div><div class="hourly-container">';
    var walkModalHtml = '<h2>Walking Conditions</h2>';
    var cyclModalHtml = '<h2>Cycling Conditions</h2>';

    for (var m = 0; m < Math.min(data.hourly.length, 24); m++) {
        var aItem = data.hourly[m];
        if (!aItem || !aItem.weather || !aItem.weather[0]) continue;

        var aDateObj = new Date(aItem.dt * 1000);
        var aTimeRaw = aDateObj.getHours() + ':00';
        var aDayNameRaw = (aDateObj.getDay() === currentDayIndex) ? 'Today' : dayNames[aDateObj.getDay()];
        
        var aTime = escapeHTML(aTimeRaw);
        var aDayName = escapeHTML(aDayNameRaw);
        
        var aTemp = Math.round(aItem.temp);
        var aWind = aItem.wind_speed || 0;
        var aCondRaw = aItem.weather[0].main;
        
        var aWalkStatus = calculateActivityStatus(aTemp, aWind, aCondRaw, 'walking', units);
        var aCycStatus = calculateActivityStatus(aTemp, aWind, aCondRaw, 'cycling', units);

        actWalkingHtml += '<div class="hour-item">';
        actWalkingHtml += '<div class="hour-time">' + aTime + '</div>';
        actWalkingHtml += '<div class="hour-icon" style="font-size: 28px;">' + escapeHTML(aWalkStatus.face) + '</div>';
        actWalkingHtml += '<div class="hour-reason">' + escapeHTML(aWalkStatus.reason) + '</div>';
        actWalkingHtml += '</div>';

        actCyclingHtml += '<div class="hour-item">';
        actCyclingHtml += '<div class="hour-time">' + aTime + '</div>';
        actCyclingHtml += '<div class="hour-icon" style="font-size: 28px;">' + escapeHTML(aCycStatus.face) + '</div>';
        actCyclingHtml += '<div class="hour-reason">' + escapeHTML(aCycStatus.reason) + '</div>';
        actCyclingHtml += '</div>';

        walkModalHtml += '<div class="modal-detail-row"><span>' + aDayName + ' ' + aTime + '</span><span>' + escapeHTML(aTemp) + symbol + '</span><span class="' + escapeHTML(aWalkStatus.cls) + '">' + escapeHTML(aWalkStatus.face) + ' ' + escapeHTML(aWalkStatus.status) + ' (' + escapeHTML(aWalkStatus.reason) + ')</span></div>';
        cyclModalHtml += '<div class="modal-detail-row"><span>' + aDayName + ' ' + aTime + '</span><span>' + escapeHTML(aTemp) + symbol + '</span><span class="' + escapeHTML(aCycStatus.cls) + '">' + escapeHTML(aCycStatus.face) + ' ' + escapeHTML(aCycStatus.status) + ' (' + escapeHTML(aCycStatus.reason) + ')</span></div>';
    }

    actWalkingHtml += '</div>';
    actCyclingHtml += '</div>';

    wWalking.innerHTML = actWalkingHtml;
    wWalking.dataset.modalHtml = walkModalHtml;

    wCycling.innerHTML = actCyclingHtml;
    wCycling.dataset.modalHtml = cyclModalHtml;
}