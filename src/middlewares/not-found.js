import { StatusCodes } from "http-status-codes";
const notFound =(req,res,next)=>{

    return res.json({msg:"Rout does not exist"}).status(StatusCodes.NOT_FOUND);
}
export default notFound;