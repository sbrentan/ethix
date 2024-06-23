const mongoose = require('mongoose')

const connectDB = async (testing = false) => {
    try {
        if (testing) {    // development
            await mongoose.connect(process.env.DATABASE_TEST_URI)
        } else if (process.env.NODE_ENV === "development") {   // dev
            console.log("Starting Development Database")
            await mongoose.connect(process.env.DATABASE_URI)
        } else {
            await mongoose.connect(process.env.DATABASE_URI) // xd I develop with production database :D
        }
    } catch (err) {
        console.log(err)
    }
}
module.exports = {
    connectDB
}