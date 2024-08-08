const express = require('express')
const app = express()

const session = require('express-session');
const cookieParser = require('cookie-parser')

const path = require('path')
const cors = require('cors')
const corsOptions = require('./config/corsOptions')

const { logger, logEvents } = require('./middleware/logger')
const errorHandler = require('./middleware/errorHandler')

const routes = require('./routes'); // Import the combined router from routes/index.js

app.use(logger)
app.use(express.json());

app.use(cors(corsOptions))

app.use(cookieParser())

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use('/', express.static(path.join(__dirname, 'public')))
app.use('/', routes); // Use the combined router from routes/index.js

app.all('*', (req, res) => {
    res.status(404)
    if (req.accepts('json')) {
        res.json({ message: '404 Not Found'})
    } else if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views', '404.html'))
    } else {
        res.type('txt').send('404 Not Found')
    }
})

app.use(errorHandler)

module.exports = app;