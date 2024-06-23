const allowedOrigins = require('./allowedOrigins')

const corsOptions = {
    origin: (origin, callback) => {
        // nel primo caso e' presente nella lista accettata
        // il "!origin" e' per permetterci di usare postman
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            // null: perche' non c'e' errore, true perche' permesso
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true, // allows credential headers
    optionSuccessStatus: 200 // default 204 but devices have problems
}

module.exports = corsOptions