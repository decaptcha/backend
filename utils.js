const Pool = require("pg").Pool;
const crypto = require("crypto");
const util = require("util");
const fs = require("fs");
const path = require("path");
const {
  storageRootFolder,
  server_port,
  DB_CONFIG,
  PRIVATE_KEY,
  ENC_ALGO,
  INITIALIZATION_VECTOR,
} = require("./constants");

/**
 * Returns a formatted error string
 * @param {string} url - the API URL
 * @param {object|string} error - the error object/string
 * @returns string
 */
const getAndPrintErrorString = (url, error) => {
  const errorString = `Exception occurred at ${url}, Details \n ${util.inspect(
    error
  )}`;
  console.error(errorString);
  return errorString;
};

/**
 * Returns an encrypted value
 * @param {string} value - the value that needs to encrypted
 * @param {string} key - the key that will be used for encryption
 * @param {string} algo - the encryption algo
 * @param {Buffer} iv - the initialization vector for createCipheriv
 */
const encryptValue = (
  value,
  key = PRIVATE_KEY,
  algo = ENC_ALGO,
  iv = INITIALIZATION_VECTOR
) => {
  const cipher = crypto.createCipheriv(algo, key, iv);
  return cipher.update(value, "utf8", "hex") + cipher.final("hex");
};

/**
 * Returns a decrypted value
 * @param {string} value - the value that needs to decrypted
 * @param {string} key - the key that will be used for decryption
 * @param {string} algo - the decryption algo
 * @param {Buffer} iv - the initialization vector for createDecipheriv
 */
const decryptValue = (
  value,
  key = PRIVATE_KEY,
  algo = ENC_ALGO,
  iv = INITIALIZATION_VECTOR
) => {
  const decipher = crypto.createDecipheriv(algo, key, iv);
  return decipher.update(value, "hex", "utf8") + decipher.final("utf8");
};

/**
 * connects to the postgres DB
 * @returns pg Pool object
 */
const connectToDB = () => new Pool(DB_CONFIG);

/**
 * Returns a formated image string
 * @param {string} url
 * @returns string
 */
const getImgURL = (url) => {
  if (url && typeof url === "string") {
    if (url.startsWith("file://")) {
      // file://f872702d-b67f-4b5f-89af-b7264a89bfa8_bus/labelled/image-1.jpg
      url = url.replace(
        "file://",
        `http://localhost:${server_port}/image/?image_path=`
      );
    } else if (url.startsWith("s3://")) {
      // TODO: handle s3 urls here
    }
  }
  return url;
};

/**
 * Checks if the image is present or not
 * @param {string} image_path
 * @returns boolean
 */
const isImgPresent = (image_path) => {
  return fs.existsSync(path.join(storageRootFolder, image_path));
};

/**
 * Returns a complete path from storageRootFolder
 * @param {string} image_path
 * @returns string
 */
const getImgPath = (image_path) => {
  return path.join(storageRootFolder, image_path);
};

/**
 * Shuffles all the items of an array
 * @param {Array[string]} array - array that needs to be shuffled
 * @returns Array[string]
 */
const shuffleArray = (array) => {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
};

/**
 * Validates the DB Response
 * @param {string} response - db response object
 * @param {string} functionName - name of the db function used
 * @returns boolean
 */
const validateDBResponse = (response, functionName) => {
  return (
    response &&
    response.rows &&
    response.rows.length === 1 &&
    response.rows[0] &&
    response.rows[0][functionName]
  );
};

module.exports = {
  getAndPrintErrorString,
  encryptValue,
  decryptValue,
  connectToDB,
  getImgURL,
  isImgPresent,
  getImgPath,
  shuffleArray,
  validateDBResponse,
};
