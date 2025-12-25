import User from "../../models/user.js";
import { CustomAPIError, UnauthenticatedError } from "../../errors/index.js";
import { StatusCodes } from "http-status-codes";

const login = async (req, res) => {
  const { email, password } = req.body;
  
  // You don't need 'name' for login, just email and password
  if (!email || !password) {
    throw new CustomAPIError("Please provide email and password");
  }
  
  const existUser = await User.findOne({ email });

  if (!existUser) {
    throw new UnauthenticatedError("Invalid credentials");
  }

  // Use the comparePassword method from the user instance
  const isPasswordCorrect = await existUser.comparePassword(password);
  
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError("Invalid credentials");
  }

  // Generate tokens
  const jwt = existUser.createJWT();
  const refreshToken = existUser.createRefreshToken();
  
  // Save user with updated refresh token
  await existUser.save();
  
  res.status(StatusCodes.OK).json({
    user: { name: existUser.getName(), role: existUser.role },
    token: jwt,
    refreshToken,
  });
};

export default login;