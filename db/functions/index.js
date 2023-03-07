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
};

module.exports = FUNCTIONS;
