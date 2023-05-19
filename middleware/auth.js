"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");

/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Middleware to use when user must be an admin for route.
 *
 * If not, raises Unauthorized.
 */

function ensureUserAdmin(req, res, next) {
  try {
    if (!res.locals.user || !res.locals.user.isAdmin)
      throw new UnauthorizedError("You must be an admin to access this route");
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Middleware to use when user must be an admin or the correct user (i.e. themselves) for manipulating the resource for route.
 *
 * If not, raises Unauthorized.
 */

function ensureAdminOrCorrectUser(req, res, next) {
  try {
    const user = res.locals.user;
    if (
      !(
        res.locals.user &&
        (user.isAdmin || user.username === req.params.username)
      )
    )
      throw new UnauthorizedError("You must either be an admin or said user");
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureUserAdmin,
  ensureAdminOrCorrectUser,
};
