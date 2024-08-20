require('dotenv').config()

const { connectDB } = require('./config/dbConn')
const mongoose = require('mongoose')
const app = require("./app");

const PORT = process.env.PORT || 3500

console.log(process.env.NODE_ENV)

connectDB()

mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB')
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`) )
})

mongoose.connection.on('error', err => {
    console.log(err)
    logEvents(`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`, 'mongoErrLog.log')
})