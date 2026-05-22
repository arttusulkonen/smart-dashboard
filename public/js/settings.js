function initSettings() {
    var authSection = document.getElementById('auth-section');
    var settingsSection = document.getElementById('settings-section');
    
    var emailInput = document.getElementById('auth-email');
    var passwordInput = document.getElementById('auth-password');
    var loginBtn = document.getElementById('login-btn');
    var registerBtn = document.getElementById('register-btn');
    var authMessage = document.getElementById('auth-message');
    var authStatusText = document.getElementById('auth-status-text');
    var logoutBtn = document.getElementById('logout-btn');

    var inputWeatherKey = document.getElementById('input-weather-key');
    var inputLat = document.getElementById('input-lat');
    var inputLon = document.getElementById('input-lon');
    var inputUnits = document.getElementById('input-units');
    var inputTransitKey = document.getElementById('input-transit-key');
    var inputStopId = document.getElementById('input-stop-id');
    
    var saveBtn = document.getElementById('save-btn');
    var backBtn = document.getElementById('back-btn');

    function showMessage(text, isError) {
        if (!authMessage) return;
        authMessage.innerText = text;
        authMessage.style.display = 'block';
        authMessage.style.color = isError ? '#ff453a' : '#32d74b';
    }

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

    if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                if (authSection) authSection.classList.add('hidden');
                if (settingsSection) settingsSection.classList.remove('hidden');
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
                }).catch(function(error) {
                    showMessage('Error loading config: ' + error.message, true);
                });
            } else {
                if (authSection) authSection.classList.remove('hidden');
                if (settingsSection) settingsSection.classList.add('hidden');
            }
        });

        if (loginBtn) {
            loginBtn.onclick = function() {
                if (!emailInput || !passwordInput) return;
                firebase.auth().signInWithEmailAndPassword(emailInput.value.trim(), passwordInput.value)
                    .catch(function(error) {
                        showMessage(error.message, true);
                    });
            };
        }

        if (registerBtn) {
            registerBtn.onclick = function() {
                if (!emailInput || !passwordInput) return;
                firebase.auth().createUserWithEmailAndPassword(emailInput.value.trim(), passwordInput.value)
                    .catch(function(error) {
                        showMessage(error.message, true);
                    });
            };
        }

        if (logoutBtn) {
            logoutBtn.onclick = function() {
                if (confirm('Are you sure you want to log out and clear device cache?')) {
                    firebase.auth().signOut().then(function() {
                        localStorage.clear();
                        window.location.reload();
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
    } else {
        if (authSection) authSection.classList.add('hidden');
        if (settingsSection) settingsSection.classList.remove('hidden');
        if (authStatusText) authStatusText.innerText = 'Firebase not configured. Using local storage.';
        
        populateForm({
            weatherApiKey: localStorage.getItem('weatherApiKey'),
            lat: localStorage.getItem('lat'),
            lon: localStorage.getItem('lon'),
            units: localStorage.getItem('units'),
            transitApiKey: localStorage.getItem('transitApiKey'),
            transitStopId: localStorage.getItem('transitStopId')
        });

        if (saveBtn) {
            saveBtn.onclick = function() {
                saveToLocal();
                window.location.href = 'index.html';
            };
        }
    }

    if (backBtn) {
        backBtn.onclick = function() {
            window.location.href = 'index.html';
        };
    }
}

window.onload = initSettings;