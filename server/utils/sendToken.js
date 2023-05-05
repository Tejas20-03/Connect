export const sendToken = (res, user, statusCode, message) => {
  const token = user.getJWTToken();

  const options = {
    httpOnly: true,
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
  };

  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    branch: user.branch,
    year: user.year,
    college: user.college,
    avatar: user.avatar,
    verified: user.verified,
  };

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({ success: true, message, user: userData });
};
