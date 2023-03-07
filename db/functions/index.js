const FUNCTIONS = {
  GET_CATPCHA: {
    FUNCTION_NAME: "get_captcha",
    QUERY: "SELECT get_captcha($1)",
  },
  POST_CATPCHA: {
    FUNCTION_NAME: "post_captcha",
    QUERY: "SELECT post_captcha($1, $2, $3)",
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
};

module.exports = FUNCTIONS;
