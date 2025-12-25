import login from '../controllers/auth/login.js';
import signIn from '../controllers/auth/signUp.js';
import logout from '../controllers/auth/logout.js';
import refreshTokenCheck from '../controllers/auth/RefreshToken.js';
import passwordValidator from '../middlewares/passwordValidator.js'
import verifyEmail from '../controllers/auth/verifyToken.js'
import express from 'express';

const router=express.Router();

router.route('/login').post(login);
router.route('/signup').post(passwordValidator,signIn);
router.route('/logout').post(logout);
router.route('/refreshToken').post(refreshTokenCheck);
router.route('/verify-email').get(verifyEmail);

export default router;
