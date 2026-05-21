function fetchTransit(stopId, apiKey, callback) {
    if (!stopId || !apiKey || !callback) return;
    
    var xhr = new XMLHttpRequest();
    var url = 'https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql';
    var query = '{ stop(id: "' + stopId + '") { name stoptimesWithoutPatterns { scheduledArrival realtimeArrival arrivalDelay realtime realtimeState pickupType dropoffType headsign trip { route { shortName } } } } }';
    
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/graphql');
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
                if (response && response.data && response.data.stop) {
                    callback({ data: response.data.stop });
                } else {
                    callback({ error: 'Stop not found' });
                }
            } else {
                callback({ error: 'API Error: ' + xhr.status });
            }
        }
    };
    xhr.send(query);
}

function renderTransit(result, elementId) {
    if (!result || !elementId) return;
    
    var container = document.getElementById(elementId);
    if (!container) return;

    if (result.error) {
        container.innerHTML = '<h2>DEPARTURES</h2><p class="error-text">' + result.error + '</p>';
        return;
    }

    var stopData = result.data;
    if (!stopData || !stopData.stoptimesWithoutPatterns) return;

    var html = '<h2>DEP: ' + (stopData.name || 'UNKNOWN') + '</h2>';
    var times = stopData.stoptimesWithoutPatterns;
    
    var now = new Date();
    var secondsSinceMidnight = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    
    for (var i = 0; i < Math.min(times.length, 5); i++) {
        var timeData = times[i];
        if (!timeData || !timeData.trip || !timeData.trip.route) continue;
        
        var routeName = timeData.trip.route.shortName || '';
        var headsign = timeData.headsign || '';
        var arrivalTime = timeData.realtimeArrival || timeData.scheduledArrival;
        
        if (!arrivalTime) continue;
        
        var waitSeconds = arrivalTime - secondsSinceMidnight;
        if (waitSeconds < 0) {
            waitSeconds += 86400;
        }
        
        var waitMinutes = Math.floor(waitSeconds / 60);
        var timeDisplay = waitMinutes <= 0 ? 'NOW' : waitMinutes + ' MIN';
        
        html += '<p><span>' + routeName + ' ' + headsign.substring(0, 15) + '</span> <span class="retro-time">' + timeDisplay + '</span></p>';
    }

    if (times.length === 0) {
        html += '<p>No upcoming departures.</p>';
    }

    container.innerHTML = html;
}