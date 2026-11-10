const AuthService = require('../services/authService');
const { getClientInfo } = require('../../utils/request');

// HTTP only. Business rules live in services/authService.js.
// Express 5 forwards thrown/rejected errors to the global error handler,
// so no try/catch is needed here.

exports.login = async (req, res) => {
  const { username, password, rememberMe, birthday } = req.body ?? {};
  res.json(await AuthService.loginWithPassword({ username, password, rememberMe, birthday }));
};

exports.googleLogin = async (req, res) => {
  const { token } = req.body ?? {}; // access_token from @react-oauth/google
  res.json(await AuthService.loginWithGoogle({ accessToken: token, ctx: getClientInfo(req) }));
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  res.json(
    await AuthService.changePassword({
      userId: req.user.id,
      currentPassword,
      newPassword,
      ctx: getClientInfo(req),
    })
  );
};