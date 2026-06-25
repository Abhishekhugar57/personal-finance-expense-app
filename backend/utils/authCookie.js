const { authCookieOptions } = require("./corsConfig");

function setAuthCookie(res, token) {
  res.cookie("token", token, authCookieOptions);
}

function clearAuthCookie(res) {
  res.clearCookie("token", authCookieOptions);
}

module.exports = { setAuthCookie, clearAuthCookie, authCookieOptions };
