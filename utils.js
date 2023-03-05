const Pool = require("pg").Pool;
const crypto = require("crypto");
const { PRIVATE_KEY, ENC_ALGO, INITIALIZATION_VECTOR } = require("./constants");

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

const connectToDB = () =>
  new Pool({
    user: "postgres",
    host: "localhost",
    database: "",
    password: "",
    port: 5432,
  });

module.exports = {
  getAndPrintErrorString,
  encryptValue,
  decryptValue,
  connectToDB,
};
