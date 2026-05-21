function setupModals() {
    var overlay = document.getElementById('modal-overlay');
    var closeBtn = document.getElementById('modal-close');
    var modalBody = document.getElementById('modal-body');
    
    if (!overlay || !closeBtn || !modalBody) return;

    var clickableWidgets = document.querySelectorAll('.clickable');
    for (var i = 0; i < clickableWidgets.length; i++) {
        clickableWidgets[i].onclick = function(e) {
            if (e.target.tagName.toLowerCase() === 'button') return;
            var content = this.dataset.modalHtml;
            if (content) {
                modalBody.innerHTML = content;
                overlay.classList.remove('hidden');
            }
        };
    }

    closeBtn.onclick = function() {
        overlay.classList.add('hidden');
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

    function updateData(isManual) {
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
        }
        
        if (config.transitApiKey && config.transitStopId && typeof fetchTransit === 'function') {
            fetchTransit(config.transitStopId, config.transitApiKey, function(result) {
                if (typeof renderTransit === 'function') {
                    renderTransit(result, 'transit-module');
                }
            });
        }
    }

    window.refreshDashboard = function() {
        updateData(true);
    };

    updateData(true);
    setInterval(function() {
        updateData(false);
    }, 300000);
}

window.onload = initDashboard;