const { onRequest } = require("firebase-functions/v2/https");

exports.getweatherdata = onRequest({ region: "us-central1" }, async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS' || req.method === 'HEAD') {
        res.status(204).send('');
        return;
    }

    const { lat, lon, units, appid } = req.query;

    if (!lat || !lon || !appid) {
        res.status(400).json({ error: 'Missing parameters', received: req.query });
        return;
    }

    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=${units || 'metric'}&appid=${appid}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});