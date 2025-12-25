import User from "../../models/user.js";
import { CustomAPIError, UnauthenticatedError } from "../../errors/index.js";
import { StatusCodes } from "http-status-codes";
import crypto from "crypto";
const refreshTokenCheck = async (req,res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new UnauthenticatedError("No refresh token");
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const existUser = await User.findOne({ refreshToken: hashedToken });

  if (!existUser) {
    throw new UnauthenticatedError("invalid token");
  }
  if (existUser.refreshTokenExpiry < Date.now()) {
    throw new UnauthenticatedError("Expired token");
  }

  const AccessToken = await existUser.createJWT();

  // rotate the refresh token , but same expire date remain
  const newRefreshToken = await existUser.createRefreshToken();
  const nawHashedToken = crypto
    .createHash("sha256")
    .update(newRefreshToken)
    .digest("hex");
  existUser.refreshToken = nawHashedToken;
  await existUser.save();

  res.status(StatusCodes.OK).json({accessToken: AccessToken ,refreshToken:newRefreshToken});
};
export default refreshTokenCheck;
