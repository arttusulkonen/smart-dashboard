function setupModals() {
    var overlay = document.getElementById('modal-overlay');
    var closeBtn = document.getElementById('modal-close');
    var modalBody = document.getElementById('modal-body');
    
    if (!overlay || !closeBtn || !modalBody) return;

    function openModal(element) {
        var content = element.dataset.modalHtml;
        if (content) {
            modalBody.innerHTML = content;
            overlay.classList.remove('hidden');
            closeBtn.focus();
        }
    }

    var clickableWidgets = document.querySelectorAll('.clickable');
    for (var i = 0; i < clickableWidgets.length; i++) {
        clickableWidgets[i].onclick = function(e) {
            if (e.target && e.target.tagName && e.target.tagName.toLowerCase() === 'button') return;
            openModal(this);
        };
        
        clickableWidgets[i].onkeydown = function(e) {
            if (e.key === 'Enter' || e.key === ' ' || e.keyCode === 13 || e.keyCode === 32) {
                if (e.target && e.target.tagName && e.target.tagName.toLowerCase() === 'button') return;
                e.preventDefault();
                openModal(this);
            }
        };
    }

    closeBtn.onclick = function() {
        overlay.classList.add('hidden');
    };
    
    closeBtn.onkeydown = function(e) {
        if (e.key === 'Enter' || e.key === ' ' || e.keyCode === 13 || e.keyCode === 32) {
            e.preventDefault();
            overlay.classList.add('hidden');
        }
    };

    overlay.onclick = function(e) {
        if (e.target === overlay) {
            overlay.classList.add('hidden');
        }
    };
}

function initDashboard() {
    var config = {
        weatherApiKey: localStorage.getItem('weatherApiKey') || '',
        lat: localStorage.getItem('lat') || '',
        lon: localStorage.getItem('lon') || '',
        units: localStorage.getItem('units') || 'metric',
        transitApiKey: localStorage.getItem('transitApiKey') || '',
        transitStopId: localStorage.getItem('transitStopId') || ''
    };
    
    var navSettingsBtn = document.getElementById('nav-settings-btn');
    if (navSettingsBtn) {
        navSettingsBtn.onclick = function() {
            window.location.href = 'settings.html';
        };
    }

    setupModals();
    
    if (typeof initClock === 'function') {
        initClock();
    }

    function fetchAndRenderData(isManual) {
        var now = new Date();
        var currentHour = now.getHours();

        if (!isManual && currentHour >= 0 && currentHour < 7) {
            return;
        }

        if (config.weatherApiKey && config.lat && config.lon) {
            if (typeof fetchWeather === 'function') {
                fetchWeather(config.weatherApiKey, config.lat, config.lon, config.units, function(result) {
                    if (typeof renderWeatherWidgets === 'function') {
                        renderWeatherWidgets(result);
                    }
                });
            }
        } else {
            var wCurrent = document.getElementById('widget-current');
            if (wCurrent) wCurrent.innerHTML = '<p class="error-text">Configure Weather API in Settings</p>';
            var wHourly = document.getElementById('widget-hourly');
            if (wHourly) wHourly.innerHTML = '';
            var wWalking = document.getElementById('widget-walking');
            if (wWalking) wWalking.innerHTML = '';
            var wCycling = document.getElementById('widget-cycling');
            if (wCycling) wCycling.innerHTML = '';
        }
        
        if (config.transitApiKey && config.transitStopId) {
            if (typeof fetchTransit === 'function') {
                fetchTransit(config.transitStopId, config.transitApiKey, function(result) {
                    if (typeof renderTransit === 'function') {
                        renderTransit(result, 'transit-module');
                    }
                });
            }
        } else {
            var transitModule = document.getElementById('transit-module');
            if (transitModule) transitModule.innerHTML = '<p class="error-text">Configure Transit API in Settings</p>';
        }
    }

    window.refreshDashboard = function() {
        fetchAndRenderData(true);
    };

    if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                var db = firebase.firestore();
                db.collection('users').doc(user.uid).get().then(function(doc) {
                    if (doc.exists) {
                        var data = doc.data();
                        config.weatherApiKey = data.weatherApiKey || '';
                        config.lat = data.lat || '';
                        config.lon = data.lon || '';
                        config.units = data.units || 'metric';
                        config.transitApiKey = data.transitApiKey || '';
                        config.transitStopId = data.transitStopId || '';
                        
                        localStorage.setItem('weatherApiKey', config.weatherApiKey);
                        localStorage.setItem('lat', config.lat);
                        localStorage.setItem('lon', config.lon);
                        localStorage.setItem('units', config.units);
                        localStorage.setItem('transitApiKey', config.transitApiKey);
                        localStorage.setItem('transitStopId', config.transitStopId);
                    }
                    fetchAndRenderData(true);
                }).catch(function() {
                    fetchAndRenderData(true);
                });
            } else {
                fetchAndRenderData(true);
            }
        });
    } else {
        fetchAndRenderData(true);
    }

    setInterval(function() {
        fetchAndRenderData(false);
    }, 300000);
}

window.onload = initDashboard;