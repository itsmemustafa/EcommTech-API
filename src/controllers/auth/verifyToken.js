import User from "../../models/user.js";
import crypto from "crypto";

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: "Verification token is required" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ error: "Invalid or expired verification token" });
    }

    // Mark user as verified
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();
    
// after the successful verification you should redirect to login page in frontend (do it later when frontend is ready)

    res.json({ message: "Email verified successfully! You can now log in." });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ error: "Email verification failed" });
  }
};
export default verifyEmail;
