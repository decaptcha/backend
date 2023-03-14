const FUNCTIONS = {
  GET_CATPCHA: {
    FUNCTION_NAME: "get_captcha",
    QUERY: "SELECT get_captcha($1)",
  },
  POST_CATPCHA: {
    FUNCTION_NAME: "post_captcha",
    QUERY: "SELECT post_captcha($1, $2, $3, $4)",
  },
  GET_PROJECT: {
    FUNCTION_NAME: "get_project",
    QUERY_WITH_ONE_ARG: "SELECT get_project($1)",
    QUERY_WITH_TWO_ARGS: "SELECT get_project($1, $2)",
  },
  ADD_PROJECT: {
    FUNCTION_NAME: "add_project",
    QUERY: "SELECT add_project($1)",
  },
  UPDATE_PROJECT: {
    FUNCTION_NAME: "update_project",
    QUERY: "SELECT update_project($1)",
  },
  GET_API_KEY_STATS: {
    FUNCTION_NAME: "get_api_key_stats",
    QUERY: "SELECT get_api_key_stats($1)",
  },
  ADD_IMAGES: {
    FUNCTION_NAME: "add_images",
    QUERY: "SELECT add_images($1, $2, $3, $4)",
  },
  GET_WALLET_ID_FROM_API_KEY: {
    FUNCTION_NAME: "get_wallet_id_from_api_key",
    QUERY: "SELECT get_wallet_id_from_api_key($1)",
  },
  GET_PROJECT_MINT_FROM_IMAGE_ID: {
    FUNCTION_NAME: "get_project_mint_from_image_id",
    QUERY: "SELECT get_project_mint_from_image_id($1)",
  },
};

module.exports = FUNCTIONS;
