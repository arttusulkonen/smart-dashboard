function initSettings() {
    var inputWeatherKey = document.getElementById('input-weather-key');
    var inputLat = document.getElementById('input-lat');
    var inputLon = document.getElementById('input-lon');
    var inputUnits = document.getElementById('input-units');
    var inputTransitKey = document.getElementById('input-transit-key');
    var inputStopId = document.getElementById('input-stop-id');
    
    var saveBtn = document.getElementById('save-btn');
    var backBtn = document.getElementById('back-btn');

    if (inputWeatherKey) inputWeatherKey.value = localStorage.getItem('weatherApiKey') || '';
    if (inputLat) inputLat.value = localStorage.getItem('lat') || '';
    if (inputLon) inputLon.value = localStorage.getItem('lon') || '';
    if (inputUnits) inputUnits.value = localStorage.getItem('units') || 'metric';
    if (inputTransitKey) inputTransitKey.value = localStorage.getItem('transitApiKey') || '';
    if (inputStopId) inputStopId.value = localStorage.getItem('transitStopId') || '';

    if (saveBtn) {
        saveBtn.onclick = function() {
            if (inputWeatherKey) localStorage.setItem('weatherApiKey', inputWeatherKey.value.trim());
            if (inputLat) localStorage.setItem('lat', inputLat.value.trim());
            if (inputLon) localStorage.setItem('lon', inputLon.value.trim());
            if (inputUnits) localStorage.setItem('units', inputUnits.value);
            if (inputTransitKey) localStorage.setItem('transitApiKey', inputTransitKey.value.trim());
            if (inputStopId) localStorage.setItem('transitStopId', inputStopId.value.trim());
            
            window.location.href = 'index.html';
        };
    }

    if (backBtn) {
        backBtn.onclick = function() {
            window.location.href = 'index.html';
        };
    }
}

window.onload = initSettings;