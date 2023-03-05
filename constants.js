const path = require("path");
const crypto = require("crypto");

const port = 3690;
const storageRootFolder = path.join(__dirname, "./storage");
const SUCCESS_HTTP_CODE = 200;
const SERVER_ERROR_CODE = 500;
const BAD_REQ_ERROR_CODE = 400;
const INCORRECT_RESULT_FROM_DB = "Recieved Incorrect Response from DB";
const SUCCESS_RESPONSE = {
  status: SUCCESS_HTTP_CODE,
  statusMessage: "OK",
  resp: {},
};
const ERROR_RESPONSE = {
  status: SERVER_ERROR_CODE,
  statusMessage: "Error",
  resp: {},
};
const PRIVATE_KEY = "32g!kF9RF7T8m1RS57OjgTUlgPsJHegi";
const ENC_ALGO = "aes256";
const INITIALIZATION_VECTOR = crypto.randomBytes(16);

module.exports = {
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
};
