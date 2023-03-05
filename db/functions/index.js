const FUNCTIONS = {
  GET_CATPCHA: {
    FUNCTION_NAME: "get_captcha",
    QUERY: "SELECT get_captcha()",
  },
  POST_CATPCHA: {
    FUNCTION_NAME: "post_captcha",
    QUERY: "SELECT post_captcha($1)",
  },
};

module.exports = FUNCTIONS;
