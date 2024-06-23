const { logEvents } = require("./logger");

const errorHandler = (err, req, res, next) => {
	logEvents(
		`${err.name}: ${err.message}\t${req.method}\t${req.url}\t${req.headers.origin}`,
		"errLog.log"
	);
	console.log(err.stack);

	// WE NEED TO CHANGE IT BACK TO res.statusCode ? res.statusCode : 500
	// otherwise it send too many errors or just remove the message
	const status = err.statusCode ? err.statusCode : 500; // server error

	res.status(status).json({ message: err.message, isError: true });
};

module.exports = errorHandler;
