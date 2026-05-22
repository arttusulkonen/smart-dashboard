import firebase from '../firebase-init.js';

function initSettings() {
    var inputWeatherKey = document.getElementById('input-weather-key');
    var inputLat = document.getElementById('input-lat');
    var inputLon = document.getElementById('input-lon');
    var inputUnits = document.getElementById('input-units');
    var inputTransitKey = document.getElementById('input-transit-key');
    var inputStopId = document.getElementById('input-stop-id');
    
    var saveBtn = document.getElementById('save-btn');
    var backBtn = document.getElementById('back-btn');
    var logoutBtn = document.getElementById('logout-btn');
    var authStatusText = document.getElementById('auth-status-text');

    function populateForm(data) {
        if (!data) return;
        if (inputWeatherKey) inputWeatherKey.value = data.weatherApiKey || '';
        if (inputLat) inputLat.value = data.lat || '';
        if (inputLon) inputLon.value = data.lon || '';
        if (inputUnits) inputUnits.value = data.units || 'metric';
        if (inputTransitKey) inputTransitKey.value = data.transitApiKey || '';
        if (inputStopId) inputStopId.value = data.transitStopId || '';
    }

    function saveToLocal() {
        if (inputWeatherKey) localStorage.setItem('weatherApiKey', inputWeatherKey.value.trim());
        if (inputLat) localStorage.setItem('lat', inputLat.value.trim());
        if (inputLon) localStorage.setItem('lon', inputLon.value.trim());
        if (inputUnits) localStorage.setItem('units', inputUnits.value);
        if (inputTransitKey) localStorage.setItem('transitApiKey', inputTransitKey.value.trim());
        if (inputStopId) localStorage.setItem('transitStopId', inputStopId.value.trim());
    }

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            if (authStatusText) authStatusText.innerText = 'Logged in as: ' + user.email;

            var db = firebase.firestore();
            db.collection('users').doc(user.uid).get().then(function(doc) {
                if (doc.exists) {
                    populateForm(doc.data());
                    saveToLocal();
                } else {
                    populateForm({
                        weatherApiKey: localStorage.getItem('weatherApiKey'),
                        lat: localStorage.getItem('lat'),
                        lon: localStorage.getItem('lon'),
                        units: localStorage.getItem('units'),
                        transitApiKey: localStorage.getItem('transitApiKey'),
                        transitStopId: localStorage.getItem('transitStopId')
                    });
                }
            });
        } else {
            window.location.href = 'login.html';
        }
    });

    if (logoutBtn) {
        logoutBtn.onclick = function() {
            if (confirm('Are you sure you want to log out and clear device cache?')) {
                firebase.auth().signOut().then(function() {
                    localStorage.clear();
                    window.location.href = 'login.html';
                });
            }
        };
    }

    if (saveBtn) {
        saveBtn.onclick = function() {
            var user = firebase.auth().currentUser;
            if (!user) return;

            var configData = {
                weatherApiKey: inputWeatherKey ? inputWeatherKey.value.trim() : '',
                lat: inputLat ? inputLat.value.trim() : '',
                lon: inputLon ? inputLon.value.trim() : '',
                units: inputUnits ? inputUnits.value : 'metric',
                transitApiKey: inputTransitKey ? inputTransitKey.value.trim() : '',
                transitStopId: inputStopId ? inputStopId.value.trim() : ''
            };

            var db = firebase.firestore();
            db.collection('users').doc(user.uid).set(configData).then(function() {
                saveToLocal();
                window.location.href = 'index.html';
            }).catch(function(error) {
                alert('Error saving to cloud: ' + error.message);
            });
        };
    }

    if (backBtn) {
        backBtn.onclick = function() {
            window.location.href = 'index.html';
        };
    }
}

window.onload = initSettings;