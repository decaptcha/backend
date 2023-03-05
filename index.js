const express = require("express");
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const path = require("path");

const port = 3690;
const storageRootFolder = path.join(__dirname, "./storage");
const SUCCESS_HTTP_CODE = 200;
const SERVER_ERROR_CODE = 500;
const BAD_REQ_ERROR_CODE = 400;
const successResponse = {
  status: SUCCESS_HTTP_CODE,
  statusMessage: "OK",
  resp: {},
};
const errorResponse = {
  status: SERVER_ERROR_CODE,
  statusMessage: "Error",
  resp: {},
};

const app = express();
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: `${storageRootFolder}/tmp`,
    createParentPath: true,
    limits: { fileSize: 50 * 1024 * 1024 },
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));

const getAndPrintErrorString = (url, error) => {
  const errorString = `Exception occurred at ${url}, Details \n ${util.inspect(
    error
  )}`;
  console.error(errorString);
  return errorString;
};

/**
 * Health Check API
 */
app.get("/", (req, res) => {
  res
    .status(SUCCESS_HTTP_CODE)
    .json({ ...successResponse, resp: "HEALTH OK!" });
});

/**
 * API to load a captcha challenge page
 * Response: {}
 */
app.get("/captcha", (req, res) => {
  res.sendStatus(501);
});

/**
 * API to publish the details of a captcha challenge page
 * and returns if the challenge was passed/failed
 * RequstBody: {}
 * Response: {}
 */
app.post("/captcha", (req, res) => {
  res.sendStatus(501);
});

/**
 * API to load details of the projects
 * if project_id is undefined then return minimal details of all projects of the user.
 * if project_id is defined then return details of the selected project of the user.
 * RequstBody: {}
 * Response: {}
 */
app.get("/projects/:project_id", (req, res) => {
  res.sendStatus(501);
});

/**
 * API to publish details of a new projects
 * RequstBody: {}
 * Response: {}
 */
app.post("/project", (req, res) => {
  res.sendStatus(501);
});

/**
 * API to mark a project as inactive
 * RequstBody: {}
 * Response: {}
 */
app.delete("/project/:project_id", (req, res) => {
  res.sendStatus(501);
});

/**
 * API to upload images for a project
 * RequstBody: {}
 * Response: {}
 */
app.put("/upload_images/:project_id", (req, res) => {
  res.sendStatus(501);
});

app.listen(port, () => {
  console.log(`decaptcha backend server initialized on port ${port}`);
});
