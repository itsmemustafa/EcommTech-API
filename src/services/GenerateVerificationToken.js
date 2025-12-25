import crypto from "crypto";

const GenerateVerificationToken = async (user) => { 
const token = crypto.randomBytes(32).toString("hex");

user.verificationToken = crypto
  .createHash("sha256")
  .update(token)
  .digest("hex");

user.verificationTokenExpiry = Date.now() + 1000 * 60 * 60; // 1 hour

return token;
};

export default GenerateVerificationToken;