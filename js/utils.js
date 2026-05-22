export function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function getConditionIcon(condition) {
    if (!condition) return '☁️';
    var lower = condition.toLowerCase();
    if (lower.indexOf('clear') > -1) return '☀️';
    if (lower.indexOf('cloud') > -1) return '☁️';
    if (lower.indexOf('rain') > -1) return '🌧';
    if (lower.indexOf('snow') > -1) return '❄️';
    if (lower.indexOf('thunder') > -1) return '⛈';
    return '☁️';
}

export function calculateActivityStatus(temp, wind, condition, type, units) {
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