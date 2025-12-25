import User from "../../models/user.js";
import crypto from "crypto";
import { NotFoundError , UnauthenticatedError} from "../../errors/index.js";
import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import { findPackageJSON } from "module";
const logout=async(req,res)=>{
const {refreshToken}=req.body;

  if (!refreshToken) {
    throw new UnauthenticatedError("No refresh token");
  }
  const hashedToken= crypto.createHash('sha256').update(refreshToken).digest('hex');
const existUser= await User.findOne({refreshToken:hashedToken})
if(!existUser)
{
    throw new UnauthenticatedError("Invalid token");
}
existUser.refreshToken=null;
await existUser.save();
res.status(StatusCodes.OK).json({msg:"user logged out successfully"})

}
export default logout;