const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

const PORT = process.env.PORT || 9876;
const BASE_API = process.env.BASE_API;
const TOKEN_TYPE = process.env.TOKEN_TYPE;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const WINDOW_SIZE = parseInt(process.env.WINDOW_SIZE) || 10;

let numberWindow = [];

const apiMap = {
    p: 'primes',
    f: 'fibo',
    e: 'even',
    r: 'rand'
};

const fetchNumbers = async (type) => {
    const url = `${BASE_API}/${apiMap[type]}`;
    try {
        const response = await axios.get(url, {
            timeout: 500,
            headers: {
                Authorization: `${TOKEN_TYPE} ${ACCESS_TOKEN}`
            }
        });

        console.log(` Response from ${url}:`, response.data);

        if (response.status === 200) {
            const data = response.data;
            if (Array.isArray(data.numbers)) {
                return data.numbers;
            } else if (Array.isArray(data.numbersL)) {
                return data.numbersL;
            } else {
                console.log(' Unexpected data format:', data);
            }
        }
    } catch (err) {
        console.error(` Error fetching numbers from ${url}:`, err.message);
    }
    return [];
};

app.get('/numbers/:numberid', async (req, res) => {
    const startTime = Date.now();
    const { numberid } = req.params;
    const prevState = [...numberWindow];

    if (!apiMap[numberid]) {
        return res.status(400).json({ error: 'Invalid number ID. Use p, f, e, or r.' });
    }

    const newNumbers = await fetchNumbers(numberid);

    

    for (const num of newNumbers) {
        if (!numberWindow.includes(num)) {
            if (numberWindow.length >= WINDOW_SIZE) {
                numberWindow.shift();
            }
            numberWindow.push(num);
        }
    }

    

    const avg = numberWindow.length > 0
        ? parseFloat((numberWindow.reduce((acc, n) => acc + n, 0) / numberWindow.length).toFixed(2))
        : 0.00;

    const timeTaken = Date.now() - startTime;
    if (timeTaken > 500) {
        return res.status(504).json({ error: 'Request took too long' });
    }

    return res.json({
        windowPrevState: prevState,
        windowCurrState: [...numberWindow],
        numbers: [...numberWindow],
        avg
    });
});

app.listen(PORT, () => {
    console.log(` Server running at http://localhost:${PORT}`);
});
