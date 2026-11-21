const AuthService = require('../services/authService');
const { getClientInfo } = require('../../utils/request');

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

exports.forgotPassword = async (req, res) => {
  const { identifier } = req.body ?? {};
  res.json(await AuthService.requestPasswordReset({ identifier, ctx: getClientInfo(req) }));
};

exports.verifyResetToken = async (req, res) => {
  res.json(await AuthService.verifyResetToken({ token: req.query.token }));
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body ?? {};
  res.json(await AuthService.resetPassword({ token, newPassword, ctx: getClientInfo(req) }));
};