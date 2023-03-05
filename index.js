const express = require("express");
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const morgan = require("morgan");

const crypto = require("crypto");

const utils = require("./utils");

const DB_FUNCTIONS = require("./db/functions");

const {
  port,
  storageRootFolder,
  SUCCESS_HTTP_CODE,
  SERVER_ERROR_CODE,
  BAD_REQ_ERROR_CODE,
  INCORRECT_RESULT_FROM_DB,
  SUCCESS_RESPONSE,
  ERROR_RESPONSE,
  PRIVATE_KEY,
  ENC_ALGO,
  INITIALIZATION_VECTOR,
} = require("./constants");

const app = express();
// add middlewares to express server
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

// connect to the DB
const pool = utils.connectToDB();

/**
 * Health Check API
 */
app.get("/", (req, res) => {
  res
    .status(SUCCESS_HTTP_CODE)
    .json({ ...SUCCESS_RESPONSE, resp: "HEALTH OK!" });
});

/**
 * API to load a captcha challenge page
 * Response: {}
 */
app.get("/captcha", (req, res) => {
  try {
    pool.query(DB_FUNCTIONS.GET_CATPCHA.QUERY, (e, results) => {
      if (e) {
        throw e;
      }

      const resp = [];

      if (
        results &&
        results.rows &&
        results.rows.length === 1 &&
        results.rows[0][DB_FUNCTIONS.GET_CATPCHA.FUNCTION_NAME]
      ) {
        for (const img of results.rows[0][
          DB_FUNCTIONS.GET_CATPCHA.FUNCTION_NAME
        ]["current_project_labelled_images"]) {
          resp.push({
            url: img.url,
            id: utils.encryptValue(
              `${crypto.randomInt(10000, 99999)}:cpli:${img.id}`
            ),
          });
        }

        for (const img of results.rows[0][
          DB_FUNCTIONS.GET_CATPCHA.FUNCTION_NAME
        ]["current_project_unlabelled_images"]) {
          resp.push({
            url: img.url,
            id: utils.encryptValue(
              `${crypto.randomInt(10000, 99999)}:cpui:${img.id}`
            ),
          });
        }

        for (const img of results.rows[0][
          DB_FUNCTIONS.GET_CATPCHA.FUNCTION_NAME
        ]["other_project_images"]) {
          resp.push({
            url: img.url,
            id: utils.encryptValue(
              `${crypto.randomInt(10000, 99999)}:opi:${img.id}`
            ),
          });
        }
      } else {
        throw INCORRECT_RESULT_FROM_DB;
      }

      res.status(SUCCESS_HTTP_CODE).json({ ...SUCCESS_RESPONSE, resp });
    });
  } catch (e) {
    console.log("here3");
    res.status(SERVER_ERROR_CODE).json({
      ...ERROR_RESPONSE,
      resp: utils.getAndPrintErrorString(req.url, e),
    });
  }
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
