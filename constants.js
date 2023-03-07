const path = require("path");
const crypto = require("crypto");

const server_port = 3690;
const db_port = 5432;
const DB_CONFIG = {
  user: "postgres",
  host: "localhost",
  database: "",
  password: "",
  port: db_port,
};

const storageRootFolder = path.join(__dirname, "./storage");
const SUCCESS_HTTP_CODE = 200;
const SERVER_ERROR_CODE = 500;
const BAD_REQ_ERROR_CODE = 400;
const FORBIDDEN_ERROR_CODE = 403;
const NOT_FOUND_CODE = 404;
const INCORRECT_RESULT_FROM_DB = "Recieved Incorrect Response from DB";
const QUERY_PARAM_NOT_PRESENT = "Query param is not present";
const INVALID_WALLET_ID = "Invalid Wallet ID";
const INVALID_API_KEY = "Invalid API Key";
const PROJECT_NOT_PRESENT = "Project not present";
const USER_NOT_PRESENT = "User not present";
const IMG_NOT_PRESENT = "Image not present";
const REQUEST_BODY_NOT_PRESENT = "Request body not present";
const SUCCESS_RESPONSE = {
  status: SUCCESS_HTTP_CODE,
  statusMessage: "OK",
  resp: {},
};
const ERROR_RESPONSE = (code = SERVER_ERROR_CODE) => {
  return {
    status: code,
    statusMessage: "Error",
    resp: {},
  };
};
const PRIVATE_KEY = "32g!kF9RF7T8m1RS57OjgTUlgPsJHegi";
const ENC_ALGO = "aes256";
const INITIALIZATION_VECTOR = crypto.randomBytes(16);

module.exports = {
  server_port,
  DB_CONFIG,
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
  PRIVATE_KEY,
  ENC_ALGO,
  INITIALIZATION_VECTOR,
};
