const Pool = require("pg").Pool;
const crypto = require("crypto");
const util = require("util");
const fs = require("fs");
const path = require("path");
const {
  storageRootFolder,
  server_port,
  INCORRECT_RESULT_FROM_DB,
  DB_CONFIG,
  PRIVATE_KEY,
  ENC_ALGO,
  INITIALIZATION_VECTOR,
  PROJECT_STATUS,
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
        `https://c4e8-183-87-63-158.in.ngrok.io/image/?image_path=`
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
 * Forms an image path where the uploaded image will be stored.
 * @param {string} imgName
 * @param {boolean} labelled
 * @param {string} projectId
 * @param {string} projectLabel
 * @returns string
 */
const formImgPath = (imgName, labelled, projectId, projectLabel) => {
  return path.join(
    storageRootFolder,
    `${projectId}_${projectLabel}/${
      labelled ? "labelled" : "unlabelled"
    }/${imgName}`
  );
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

/**
 * Validates the project object that is used for the creation/updation of the project
 * @param {object} project - the project object that will be used for creating the object
 * @param {boolean} isUpdate - [optional] this involves validation of additional properties
 * @returns Array[boolean, string]
 */
const validateProject = (project, isUpdateObject = false) => {
  if (!project) return [false, "Project Object undefined"];

  if (isUpdateObject && !project.id) return [false, "Project ID undefined"];
  if (isUpdateObject && project.id.toString().trim() === "")
    return [false, "Project ID empty"];

  if (!project.wallet_id) return [false, "Wallet ID undefined"];
  if (project.wallet_id.toString().trim() === "")
    return [false, "Wallet ID empty"];

  if (!project.name) return [false, "Project Name undefined"];
  if (project.name.toString().trim() === "")
    return [false, "Project Name empty"];

  if (!project.label_value) return [false, "Project Label undefined"];
  if (project.label_value.toString().trim() === "")
    return [false, "Project Label empty"];

  if (!project.threshold) return [false, "Project Threshold undefined"];
  if (project.threshold.toString().trim() === "")
    return [false, "Project Threshold empty"];

  if (isUpdateObject && project.active.toString().trim() === "")
    return [false, "Project Active empty"];

  // Not doing this
  // if (!project.expiry) return [false, "Project Expiry undefined"];
  // if (project.expiry.toString().trim() === "")
  //   return [false, "Project Expiry empty"];
  // try {
  //   const date = new Date(project.expiry);
  //   if (date == "Invalid Date")
  //     return [false, "Project Expiry is not a valid date"];
  //   if (date < new Date())
  //     return [false, "Project Expiry cannot be less than current date"];
  // } catch (e) {
  //   return [false, "Project Expiry is not a valid date"];
  // }

  return [true, "Valid Project Object"];
};

/**
 * Sets the project status for frontend
 * @param {object} project
 * @returns object
 */
const setProjectStatusForFrontend = (project) => {
  if (project.status === PROJECT_STATUS.NOT_STARTED) {
    project.active = false;
    project.is_completed = false;
  } else if (project.status === PROJECT_STATUS.ONGOING) {
    project.active = true;
    project.is_completed = false;
  } else if (project.status === PROJECT_STATUS.COMPLETED) {
    project.active = false;
    project.is_completed = true;
  }
  return project;
};

/**
 * Returns simple values from DB
 * @param {Pool} pool
 * @param {string} query
 * @param {string} functionName
 * @param {string} params
 * @returns Promise
 */
const getValueFromDB = (pool, query, functionName, params = []) => {
  return new Promise((resolve, reject) => {
    pool.query(query, params, (err, results) => {
      if (err) {
        reject(err);
      }

      if (validateDBResponse(results, functionName)) {
        resolve(results.rows[0][functionName]);
      } else {
        reject(INCORRECT_RESULT_FROM_DB);
      }
    });
  });
};

module.exports = {
  getAndPrintErrorString,
  encryptValue,
  decryptValue,
  connectToDB,
  getImgURL,
  isImgPresent,
  getImgPath,
  formImgPath,
  shuffleArray,
  validateDBResponse,
  validateProject,
  setProjectStatusForFrontend,
  getValueFromDB,
};
