const express = require('express');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');

const port = 3690;
const storageRootFolder = path.join(__dirname, '../storage');
const SUCCESS_HTTP_CODE = 200;
const SERVER_ERROR_CODE = 500;
const BAD_REQ_ERROR_CODE = 400;
const successResponse = {
	status: SUCCESS_HTTP_CODE,
	statusMessage: "OK",
	resp: {}
}
const errorResponse = {
	status: SERVER_ERROR_CODE,
	statusMessage: "Error",
	resp: {}
}

const app = express();
app.use(fileUpload({
  useTempFiles : true,
  tempFileDir : `${storageRootFolder}/tmp`,
	createParentPath: true,
	limits: { fileSize: 50 * 1024 * 1024 }
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));

const getAndPrintErrorString = (url, error) => {
	const errorString = `Exception occurred at ${url}, Details \n ${util.inspect(error)}`;
	console.error(errorString);
	return errorString;
};

app.get('/', (req, res) => {
	res.status(SUCCESS_HTTP_CODE).json({...successResponse, resp: "HEALTH OK!"});
});

app.listen(port, () => {
  console.log(`decaptcha backend server initialized on port ${port}`)
});