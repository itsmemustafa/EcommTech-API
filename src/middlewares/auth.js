import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import env from 'dotenv'
env.config();

const auth = async (req, res, next) => {

const authHeader=req.header.authorization;

if(!authHeader||!authHeader.startsWith("Bearer "))
{
      return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: "Access denied. No token provided." });
}
const token= authHeader.split(" ",1);
try{

    const payload=jwt.verify(token,process.env.JWT_SECRET);

    // this info can be used later to connect the data with the user (Ownership) that made the request
      req.user = {
      userId: payload.userId,
      name: payload.name,

     // role: payload.role,
    };

}
catch(err)
{

  if (error.name === "TokenExpiredError") {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Access token expired" });
    }

    

    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: "Invalid access token" });
  }

};
