const express = require("express");
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cors = require("cors");

const crypto = require("crypto");

const utils = require("./utils");

const DB_FUNCTIONS = require("./db/functions");

const {
  server_port,
  storageRootFolder,
  SUCCESS_HTTP_CODE,
  SERVER_ERROR_CODE,
  BAD_REQ_ERROR_CODE,
  NOT_FOUND_CODE,
  INCORRECT_RESULT_FROM_DB,
  QUERY_PARAM_NOT_PRESENT,
  IMG_NOT_PRESENT,
  REQUEST_BODY_NOT_PRESENT,
  SUCCESS_RESPONSE,
  ERROR_RESPONSE,
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
app.use(cors());
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

      let resp = [];

      if (
        utils.validateDBResponse(
          results,
          DB_FUNCTIONS.GET_CATPCHA.FUNCTION_NAME
        )
      ) {
        for (const img of results.rows[0][
          DB_FUNCTIONS.GET_CATPCHA.FUNCTION_NAME
        ]["current_project_labelled_images"]) {
          resp.push({
            url: utils.getImgURL(img.url),
            id: utils.encryptValue(
              `${crypto.randomInt(10000, 99999)}:cpli:${img.id}`
            ),
          });
        }

        for (const img of results.rows[0][
          DB_FUNCTIONS.GET_CATPCHA.FUNCTION_NAME
        ]["current_project_unlabelled_images"]) {
          resp.push({
            url: utils.getImgURL(img.url),
            id: utils.encryptValue(
              `${crypto.randomInt(10000, 99999)}:cpui:${img.id}`
            ),
          });
        }

        for (const img of results.rows[0][
          DB_FUNCTIONS.GET_CATPCHA.FUNCTION_NAME
        ]["other_project_images"]) {
          resp.push({
            url: utils.getImgURL(img.url),
            id: utils.encryptValue(
              `${crypto.randomInt(10000, 99999)}:opi:${img.id}`
            ),
          });
        }
      } else {
        throw INCORRECT_RESULT_FROM_DB;
      }

      resp = utils.shuffleArray(resp);

      res.status(SUCCESS_HTTP_CODE).json({ ...SUCCESS_RESPONSE, resp });
    });
  } catch (e) {
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
  let code;
  try {
    if (req && req.body) {
      let images = req.body;
      let humanCheckPassed = true;
      const labelledImages = [];
      const unlabelledImages = [];

      // segregate images into correct arrays
      for (const img of images) {
        if (img && img.id) {
          const decryptedId = utils.decryptValue(img.id);
          if (decryptedId) {
            decryptedIdSplit = decryptedId.split(":");
            if (!decryptedIdSplit || decryptedIdSplit.length !== 3) {
              console.log(
                `Invalid decryptedId found: ${decryptedId}. Request Body: ${images}`
              );
              continue;
            }

            img.id = decryptedId.split(":")[2];
            if (decryptedId.includes("cpli")) {
              labelledImages.push(img);
            } else if (decryptedId.includes("cpui")) {
              unlabelledImages.push(img);
            }
          }
        }
      }

      // Check if user has passed the human check
      if (labelledImages && labelledImages.length > 0) {
        for (const img of labelledImages) {
          if (!img.selected) {
            humanCheckPassed = false;
            break;
          }
        }
      }

      // Update data in DB for unlabelled images
      pool.query(
        DB_FUNCTIONS.POST_CATPCHA.QUERY,
        [JSON.stringify(unlabelledImages)],
        (e, results) => {
          if (e) {
            throw e;
          }

          if (
            utils.validateDBResponse(
              results,
              DB_FUNCTIONS.POST_CATPCHA.FUNCTION_NAME
            )
          ) {
            res.status(SUCCESS_HTTP_CODE).json({
              ...SUCCESS_RESPONSE,
              resp: results.rows[0][DB_FUNCTIONS.POST_CATPCHA.FUNCTION_NAME],
            });
          } else {
            throw INCORRECT_RESULT_FROM_DB;
          }
        }
      );
    } else {
      code = BAD_REQ_ERROR_CODE;
      throw REQUEST_BODY_NOT_PRESENT;
    }
  } catch (e) {
    res.status(code || SERVER_ERROR_CODE).json({
      ...ERROR_RESPONSE,
      resp: utils.getAndPrintErrorString(req.url, e),
    });
  }
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

/**
 * API to serve image files
 * RequstBody: {}
 * Response: {}
 */
app.get("/image", (req, res) => {
  let code;
  try {
    if (req && req.query && req.query.image_path) {
      const image_path = req.query.image_path;
      if (utils.isImgPresent(image_path)) {
        res.status(SUCCESS_HTTP_CODE).sendFile(utils.getImgPath(image_path));
      } else {
        code = NOT_FOUND_CODE;
        throw IMG_NOT_PRESENT;
      }
    } else {
      code = BAD_REQ_ERROR_CODE;
      throw QUERY_PARAM_NOT_PRESENT;
    }
  } catch (e) {
    res.status(code || SERVER_ERROR_CODE).json({
      ...ERROR_RESPONSE,
      resp: utils.getAndPrintErrorString(req.url, e),
    });
  }
});

app.listen(server_port, () => {
  console.log(`decaptcha backend server initialized on port ${server_port}`);
});
