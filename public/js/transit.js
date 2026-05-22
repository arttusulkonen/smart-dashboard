function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function fetchTransit(stopIdsStr, apiKey, callback) {
    if (!stopIdsStr || !apiKey || !callback) return;
    
    var stops = stopIdsStr.split(',');
    var queryParts = [];
    
    for (var i = 0; i < stops.length; i++) {
        var sId = stops[i].replace(/[^a-zA-Z0-9:-]/g, '').trim();
        if (sId) {
            queryParts.push('stop' + i + ': stop(id: "' + sId + '") { name stoptimesWithoutPatterns { scheduledArrival realtimeArrival arrivalDelay realtime realtimeState pickupType dropoffType headsign stop { platformCode } trip { route { shortName } } } }');
        }
    }
    
    if (queryParts.length === 0) return;
    
    var xhr = new XMLHttpRequest();
    var url = 'https://api.digitransit.fi/routing/v2/hsl/gtfs/v1';
    
    var payload = JSON.stringify({
        query: 'query {' + queryParts.join(' ') + '}'
    });
    
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('digitransit-subscription-key', apiKey);
    
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
                if (response && response.data) {
                    callback({ data: response.data });
                } else {
                    callback({ error: 'No data returned' });
                }
            } else {
                callback({ error: 'API Error: ' + xhr.status });
            }
        }
    };
    xhr.send(payload);
}

function renderTransit(result, elementId) {
    if (!result || !elementId) return;
    
    var container = document.getElementById(elementId);
    if (!container) return;

    if (result.error) {
        container.innerHTML = '<h2>DEPARTURES</h2><p class="error-text">' + escapeHTML(result.error) + '</p>';
        return;
    }

    var data = result.data;
    if (!data) return;

    var html = '';
    var now = new Date();
    var secondsSinceMidnight = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            var stopData = data[key];
            if (!stopData || !stopData.stoptimesWithoutPatterns) continue;

            html += '<div class="transit-stop-group">';
            html += '<h2>' + escapeHTML(stopData.name || 'STATION') + '</h2>';
            
            var times = stopData.stoptimesWithoutPatterns;
            var platforms = {};
            
            for (var i = 0; i < times.length; i++) {
                var timeData = times[i];
                if (!timeData || !timeData.trip || !timeData.trip.route) continue;
                
                var platCode = (timeData.stop && timeData.stop.platformCode) ? timeData.stop.platformCode : 'N/A';
                if (!platforms[platCode]) {
                    platforms[platCode] = [];
                }
                platforms[platCode].push(timeData);
            }
            
            var platformKeys = Object.keys(platforms).sort();
            
            for (var p = 0; p < platformKeys.length; p++) {
                var pKey = platformKeys[p];
                var pTimes = platforms[pKey];
                
                var trackLabel = pKey === 'N/A' ? 'Departures' : 'Track ' + pKey;
                html += '<h3 style="color:#0a84ff; font-size:16px; margin:15px 0 5px 0;">' + escapeHTML(trackLabel) + '</h3>';
                
                var count = 0;
                for (var j = 0; j < pTimes.length; j++) {
                    if (count >= 5) break;
                    
                    var tData = pTimes[j];
                    var routeName = escapeHTML(tData.trip.route.shortName || '');
                    var rawHeadsign = tData.headsign || '';
                    var headsign = escapeHTML(rawHeadsign.substring(0, 15));
                    
                    var arrivalTime = tData.realtimeArrival !== null && tData.realtimeArrival !== undefined ? tData.realtimeArrival : tData.scheduledArrival;
                    if (arrivalTime === null || arrivalTime === undefined) continue;
                    
                    var waitSeconds = arrivalTime - secondsSinceMidnight;
                    if (waitSeconds < 0) {
                        waitSeconds += 86400;
                    }
                    
                    var waitMinutes = Math.floor(waitSeconds / 60);
                    var timeDisplay = waitMinutes <= 0 ? 'NOW' : escapeHTML(waitMinutes) + ' MIN';
                    
                    html += '<p><span>' + routeName + ' ' + headsign + '</span> <span class="retro-time">' + timeDisplay + '</span></p>';
                    count++;
                }
            }

            if (times.length === 0) {
                html += '<p>No upcoming departures.</p>';
            }
            html += '</div>';
        }
    }

    if (html === '') {
        html = '<h2>DEPARTURES</h2><p>No transit data available.</p>';
    }

    container.innerHTML = html;
}