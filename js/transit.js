import { escapeHTML } from './utils.js';

export function fetchTransit(stopIdsStr, apiKey, callback) {
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
    xhr.withCredentials = false;
    xhr.timeout = 15000;
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
            } else if (xhr.status === 0) {
                callback({ error: 'Network/SSL Error' });
            } else {
                callback({ error: 'API Error: ' + xhr.status });
            }
        }
    };
    
    xhr.onerror = function() {
        callback({ error: 'Network Error (CORS/SSL)' });
    };

    xhr.ontimeout = function() {
        callback({ error: 'Connection Timeout' });
    };
    
    xhr.send(payload);
}

export function renderTransit(result, elementId) {
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
                
                if (pKey === '1') {
                    trackLabel = 'Track 1 (Airport ✈️)';
                } else if (pKey === '2') {
                    trackLabel = 'Track 2 (Helsinki 🏙️)';
                }
                
                html += '<h3 style="color:#0a84ff; font-size:16px; margin:15px 0 5px 0; padding-bottom:5px; border-bottom:1px solid #1a1a1a;">' + escapeHTML(trackLabel) + '</h3>';
                
                var count = 0;
                for (var j = 0; j < pTimes.length; j++) {
                    if (count >= 5) break;
                    
                    var tData = pTimes[j];
                    var routeName = escapeHTML(tData.trip.route.shortName || '');
                    var rawHeadsign = tData.headsign || '';
                    var headsign = escapeHTML(rawHeadsign.substring(0, 15));
                    
                    var arrivalTime = tData.realtimeArrival !== null && tData.realtimeArrival !== undefined ? tData.realtimeArrival : tData.scheduledArrival;
                    if (arrivalTime === null || arrivalTime === undefined) continue;
                    
                    var absoluteSecs = arrivalTime % 86400;
                    var h = Math.floor(absoluteSecs / 3600);
                    var m = Math.floor((absoluteSecs % 3600) / 60);
                    var absoluteTimeStr = (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
                    
                    var waitSeconds = arrivalTime - secondsSinceMidnight;
                    if (waitSeconds < 0) {
                        waitSeconds += 86400;
                    }
                    
                    var waitMinutes = Math.floor(waitSeconds / 60);
                    var relativeTimeStr = waitMinutes <= 0 ? 'NOW' : escapeHTML(waitMinutes) + ' min';
                    
                    html += '<p><span>' + routeName + ' ' + headsign + '</span> <span class="retro-time">' + absoluteTimeStr + ' <span style="font-size:14px; opacity:0.7;">(' + relativeTimeStr + ')</span></span></p>';
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