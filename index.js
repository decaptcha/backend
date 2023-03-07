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
  FORBIDDEN_ERROR_CODE,
  NOT_FOUND_CODE,
  INCORRECT_RESULT_FROM_DB,
  QUERY_PARAM_NOT_PRESENT,
  INVALID_WALLET_ID,
  INVALID_API_KEY,
  PROJECT_NOT_PRESENT,
  USER_NOT_PRESENT,
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
  let code;
  try {
    if (req && req.query && req.query.api_key) {
      const api_key = req.query.api_key;
      pool
        .query(DB_FUNCTIONS.GET_CATPCHA.QUERY, [api_key.toString()])
        .then((results) => {
          let resp = { label: null, images: [] };

          if (
            utils.validateDBResponse(
              results,
              DB_FUNCTIONS.GET_CATPCHA.FUNCTION_NAME
            )
          ) {
            if (
              results.rows[0][DB_FUNCTIONS.GET_CATPCHA.FUNCTION_NAME][
                "error"
              ] === INVALID_API_KEY
            ) {
              code = FORBIDDEN_ERROR_CODE;
              throw INVALID_API_KEY;
            }

            if (
              results.rows[0][DB_FUNCTIONS.GET_CATPCHA.FUNCTION_NAME]["label"]
            ) {
              resp.label =
                results.rows[0][DB_FUNCTIONS.GET_CATPCHA.FUNCTION_NAME][
                  "label"
                ];
            }

            if (
              results.rows[0][DB_FUNCTIONS.GET_CATPCHA.FUNCTION_NAME]["images"][
                "current_project_labelled_images"
              ]
            ) {
              for (const img of results.rows[0][
                DB_FUNCTIONS.GET_CATPCHA.FUNCTION_NAME
              ]["images"]["current_project_labelled_images"]) {
                resp.images.push({
                  url: utils.getImgURL(img.url),
                  id: utils.encryptValue(
                    `${crypto.randomInt(10000, 99999)}:cpli:${img.id}`
                  ),
                });
              }
            }

            if (
              results.rows[0][DB_FUNCTIONS.GET_CATPCHA.FUNCTION_NAME]["images"][
                "current_project_unlabelled_images"
              ]
            ) {
              for (const img of results.rows[0][
                DB_FUNCTIONS.GET_CATPCHA.FUNCTION_NAME
              ]["images"]["current_project_unlabelled_images"]) {
                resp.images.push({
                  url: utils.getImgURL(img.url),
                  id: utils.encryptValue(
                    `${crypto.randomInt(10000, 99999)}:cpui:${img.id}`
                  ),
                });
              }
            }

            if (
              results.rows[0][DB_FUNCTIONS.GET_CATPCHA.FUNCTION_NAME]["images"][
                "other_project_images"
              ]
            ) {
              for (const img of results.rows[0][
                DB_FUNCTIONS.GET_CATPCHA.FUNCTION_NAME
              ]["images"]["other_project_images"]) {
                resp.images.push({
                  url: utils.getImgURL(img.url),
                  id: utils.encryptValue(
                    `${crypto.randomInt(10000, 99999)}:opi:${img.id}`
                  ),
                });
              }
            }
          } else {
            throw INCORRECT_RESULT_FROM_DB;
          }

          resp.images = utils.shuffleArray(resp.images);

          res.status(SUCCESS_HTTP_CODE).json({ ...SUCCESS_RESPONSE, resp });
        })
        .catch((e) => {
          setImmediate(() => {
            res.status(code || SERVER_ERROR_CODE).json({
              ...ERROR_RESPONSE(code || SERVER_ERROR_CODE),
              resp: utils.getAndPrintErrorString(req.url, e),
            });
          });
        });
    } else {
      code = BAD_REQ_ERROR_CODE;
      throw QUERY_PARAM_NOT_PRESENT;
    }
  } catch (e) {
    res.status(SERVER_ERROR_CODE).json({
      ...ERROR_RESPONSE(code || SERVER_ERROR_CODE),
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
    if (req && req.body && req.body.images && req.body.api_key) {
      let images = req.body.images;
      const api_key = req.body.api_key;
      let humanCheckPassed = true;
      const labelledImages = [];
      const unlabelledImages = [];
      const otherProjectImages = [];

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
            } else if (decryptedId.includes("opi")) {
              otherProjectImages.push(img);
            }
          }
        }
      }

      // Check if user has passed the human check
      if (labelledImages && labelledImages.length > 0) {
        let oneFalseValueFound = false;
        for (const img of labelledImages) {
          if (img.selected.toString() === "false") {
            oneFalseValueFound = true;
            break;
          }
        }
        if (oneFalseValueFound) humanCheckPassed = false;
      }
      if (otherProjectImages && otherProjectImages.length > 0) {
        let oneTrueValueFound = false;
        for (const img of otherProjectImages) {
          if (img.selected.toString() === "true") {
            oneTrueValueFound = true;
            break;
          }
        }
        if (oneTrueValueFound) humanCheckPassed = false;
      }

      // Update data in DB for unlabelled images
      pool
        .query(DB_FUNCTIONS.POST_CATPCHA.QUERY, [
          JSON.stringify(unlabelledImages),
          unlabelledImages.length,
          api_key.toString(),
        ])
        .then((results) => {
          if (
            utils.validateDBResponse(
              results,
              DB_FUNCTIONS.POST_CATPCHA.FUNCTION_NAME
            )
          ) {
            if (
              results.rows[0][DB_FUNCTIONS.POST_CATPCHA.FUNCTION_NAME][
                "error"
              ] === INVALID_API_KEY
            ) {
              code = FORBIDDEN_ERROR_CODE;
              throw INVALID_API_KEY;
            }

            res.status(SUCCESS_HTTP_CODE).json({
              ...SUCCESS_RESPONSE,
              resp: { humanCheckPassed },
            });
          } else {
            throw INCORRECT_RESULT_FROM_DB;
          }
        })
        .catch((e) => {
          setImmediate(() => {
            res.status(code || SERVER_ERROR_CODE).json({
              ...ERROR_RESPONSE(code || SERVER_ERROR_CODE),
              resp: utils.getAndPrintErrorString(req.url, e),
            });
          });
        });
    } else {
      code = BAD_REQ_ERROR_CODE;
      throw REQUEST_BODY_NOT_PRESENT;
    }
  } catch (e) {
    res.status(code || SERVER_ERROR_CODE).json({
      ...ERROR_RESPONSE(code || SERVER_ERROR_CODE),
      resp: utils.getAndPrintErrorString(req.url, e),
    });
  }
});

/**
 * API to get the list of a specified project or all the projects if not specified
 * RequstBody: {}
 * Response: {}
 */
app.get("/projects", (req, res) => {
  let code;
  try {
    if (req && req.query && req.query.wallet_id) {
      const pgParams = [req.query.wallet_id.toString()];
      let query = DB_FUNCTIONS.GET_PROJECT.QUERY_WITH_ONE_ARG;
      if (req.query.project_id) {
        pgParams.push(req.query.project_id.toString());
        query = DB_FUNCTIONS.GET_PROJECT.QUERY_WITH_TWO_ARGS;
      }
      pool
        .query(query, pgParams)
        .then((results) => {
          if (
            utils.validateDBResponse(
              results,
              DB_FUNCTIONS.GET_PROJECT.FUNCTION_NAME
            )
          ) {
            if (
              results.rows[0][DB_FUNCTIONS.GET_PROJECT.FUNCTION_NAME][
                "error"
              ] === USER_NOT_PRESENT
            ) {
              code = FORBIDDEN_ERROR_CODE;
              throw INVALID_WALLET_ID;
            } else if (
              results.rows[0][DB_FUNCTIONS.GET_PROJECT.FUNCTION_NAME][
                "error"
              ] === PROJECT_NOT_PRESENT
            ) {
              code = FORBIDDEN_ERROR_CODE;
              throw PROJECT_NOT_PRESENT;
            }

            res.status(SUCCESS_HTTP_CODE).json({
              ...SUCCESS_RESPONSE,
              resp: results.rows[0][DB_FUNCTIONS.GET_PROJECT.FUNCTION_NAME],
            });
          } else {
            throw INCORRECT_RESULT_FROM_DB;
          }
        })
        .catch((e) => {
          setImmediate(() => {
            res.status(code || SERVER_ERROR_CODE).json({
              ...ERROR_RESPONSE(code || SERVER_ERROR_CODE),
              resp: utils.getAndPrintErrorString(req.url, e),
            });
          });
        });
    } else {
      code = BAD_REQ_ERROR_CODE;
      throw QUERY_PARAM_NOT_PRESENT;
    }
  } catch (e) {
    res.status(code || SERVER_ERROR_CODE).json({
      ...ERROR_RESPONSE(code || SERVER_ERROR_CODE),
      resp: utils.getAndPrintErrorString(req.url, e),
    });
  }
});

/**
 * API to publish details of a new projects
 * RequstBody: {}
 * Response: {}
 */
app.post("/project", (req, res) => {
  let code;
  try {
    console.log(req.body);
    if (req && req.body && req.body.project) {
      const project = req.body.project;

      [isValid, validationMessage] = utils.validateProject(project);

      if (!isValid) {
        code = BAD_REQ_ERROR_CODE;
        throw validationMessage;
      }

      pool
        .query(DB_FUNCTIONS.ADD_PROJECT.QUERY, [JSON.stringify(project)])
        .then((results) => {
          if (
            utils.validateDBResponse(
              results,
              DB_FUNCTIONS.ADD_PROJECT.FUNCTION_NAME
            )
          ) {
            if (
              results.rows[0][DB_FUNCTIONS.ADD_PROJECT.FUNCTION_NAME][
                "error"
              ] === USER_NOT_PRESENT
            ) {
              code = NOT_FOUND_CODE;
              throw USER_NOT_PRESENT;
            }

            res.status(SUCCESS_HTTP_CODE).json({
              ...SUCCESS_RESPONSE,
              resp: results.rows[0][DB_FUNCTIONS.ADD_PROJECT.FUNCTION_NAME],
            });
          } else {
            throw INCORRECT_RESULT_FROM_DB;
          }
        })
        .catch((e) => {
          setImmediate(() => {
            res.status(code || SERVER_ERROR_CODE).json({
              ...ERROR_RESPONSE(code || SERVER_ERROR_CODE),
              resp: utils.getAndPrintErrorString(req.url, e),
            });
          });
        });
    } else {
      code = BAD_REQ_ERROR_CODE;
      throw REQUEST_BODY_NOT_PRESENT;
    }
  } catch (e) {
    res.status(code || SERVER_ERROR_CODE).json({
      ...ERROR_RESPONSE(code || SERVER_ERROR_CODE),
      resp: utils.getAndPrintErrorString(req.url, e),
    });
  }
});

/**
 * API to change the status of a project active|inactive
 * RequstBody: {}
 * Response: {}
 */
app.post("/update_project", (req, res) => {
  let code;
  try {
    console.log(req.body);
    if (req && req.body && req.body.project) {
      const project = req.body.project;

      [isValid, validationMessage] = utils.validateProject(project, true);

      if (!isValid) {
        code = BAD_REQ_ERROR_CODE;
        throw validationMessage;
      }

      pool
        .query(DB_FUNCTIONS.UPDATE_PROJECT.QUERY, [JSON.stringify(project)])
        .then((results) => {
          if (
            utils.validateDBResponse(
              results,
              DB_FUNCTIONS.UPDATE_PROJECT.FUNCTION_NAME
            )
          ) {
            if (
              results.rows[0][DB_FUNCTIONS.UPDATE_PROJECT.FUNCTION_NAME][
                "error"
              ] === USER_NOT_PRESENT
            ) {
              code = NOT_FOUND_CODE;
              throw USER_NOT_PRESENT;
            } else if (
              results.rows[0][DB_FUNCTIONS.UPDATE_PROJECT.FUNCTION_NAME][
                "error"
              ] === PROJECT_NOT_PRESENT
            ) {
              code = NOT_FOUND_CODE;
              throw PROJECT_NOT_PRESENT;
            }

            res.status(SUCCESS_HTTP_CODE).json({
              ...SUCCESS_RESPONSE,
              resp: results.rows[0][DB_FUNCTIONS.UPDATE_PROJECT.FUNCTION_NAME],
            });
          } else {
            throw INCORRECT_RESULT_FROM_DB;
          }
        })
        .catch((e) => {
          setImmediate(() => {
            res.status(code || SERVER_ERROR_CODE).json({
              ...ERROR_RESPONSE(code || SERVER_ERROR_CODE),
              resp: utils.getAndPrintErrorString(req.url, e),
            });
          });
        });
    } else {
      code = BAD_REQ_ERROR_CODE;
      throw REQUEST_BODY_NOT_PRESENT;
    }
  } catch (e) {
    res.status(code || SERVER_ERROR_CODE).json({
      ...ERROR_RESPONSE(code || SERVER_ERROR_CODE),
      resp: utils.getAndPrintErrorString(req.url, e),
    });
  }
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
 * API to get the API Key Stats
 * RequstBody: {}
 * Response: {}
 */
app.get("/api_key_stats", (req, res) => {
  let code;
  try {
    if (req && req.query && req.query.wallet_id) {
      const wallet_id = req.query.wallet_id;
      pool
        .query(DB_FUNCTIONS.GET_API_KEY_STATS.QUERY, [wallet_id])
        .then((results) => {
          if (
            utils.validateDBResponse(
              results,
              DB_FUNCTIONS.GET_API_KEY_STATS.FUNCTION_NAME
            )
          ) {
            if (
              results.rows[0][DB_FUNCTIONS.GET_API_KEY_STATS.FUNCTION_NAME][
                "error"
              ] === USER_NOT_PRESENT
            ) {
              code = FORBIDDEN_ERROR_CODE;
              throw INVALID_WALLET_ID;
            }

            res.status(SUCCESS_HTTP_CODE).json({
              ...SUCCESS_RESPONSE,
              resp: results.rows[0][
                DB_FUNCTIONS.GET_API_KEY_STATS.FUNCTION_NAME
              ],
            });
          } else {
            throw INCORRECT_RESULT_FROM_DB;
          }
        })
        .catch((e) => {
          setImmediate(() => {
            res.status(code || SERVER_ERROR_CODE).json({
              ...ERROR_RESPONSE(code || SERVER_ERROR_CODE),
              resp: utils.getAndPrintErrorString(req.url, e),
            });
          });
        });
    } else {
      code = BAD_REQ_ERROR_CODE;
      throw QUERY_PARAM_NOT_PRESENT;
    }
  } catch (e) {
    res.status(code || SERVER_ERROR_CODE).json({
      ...ERROR_RESPONSE(code || SERVER_ERROR_CODE),
      resp: utils.getAndPrintErrorString(req.url, e),
    });
  }
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
      ...ERROR_RESPONSE(code || SERVER_ERROR_CODE),
      resp: utils.getAndPrintErrorString(req.url, e),
    });
  }
});

app.listen(server_port, () => {
  console.log(`decaptcha backend server initialized on port ${server_port}`);
});
