import { StatusCodes } from "http-status-codes";
import { CustomAPIError } from "../../errors/index.js";
import User from "../../models/user.js";
import GenerateVerificationToken from "../../services/GenerateVerificationToken.js";
import sendVerificationEmail from "../../utils/sendVerificationEmail.js";

const signIn = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new CustomAPIError("missing information");
  }

  
  const newUser = new User({ name, email, password });
  

  const accessToken = newUser.createJWT();
  const refreshToken = newUser.createRefreshToken();
  const verificationToken = await GenerateVerificationToken(newUser);
  console.log(verificationToken);
  await sendVerificationEmail(email, verificationToken);
  await newUser.save();

  res.status(StatusCodes.CREATED).json({
    msg: "User registered successfully",
    user: { name: newUser.name, email: newUser.email },
    accessToken,
    refreshToken,
  });
};

export default signIn;