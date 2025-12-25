// middleware/passwordValidator.js
import  zxcvbn from 'zxcvbn';

const checkPassword = (req, res, next) => {
  const { password, email, username } = req.body;
 
  if (!password) {
    return res.status(400).json({ 
      error: 'Password is required' 
    });
  }
  

  if (password.length < 8) {
    return res.status(400).json({ 
      error: 'Password must be at least 8 characters' 
    });
  }
  
  if (password.length > 128) {
    return res.status(400).json({ 
      error: 'Password must be less than 128 characters' 
    });
  }
  
 
  const userInputs = [
    email,
    username,,
    email?.split('@')[0],
    email?.split('@')[1]
  ].filter(Boolean);
  
 
  const result = zxcvbn(password, userInputs);
  

  const MIN_SCORE = 3;
  if (result.score < MIN_SCORE) {
    return res.status(400).json({
      error: 'Password is too weak',
      score: result.score,
      warning: result.feedback.warning,
      suggestions: result.feedback.suggestions,
      crackTime: result.crack_times_display.offline_slow_hashing_1e4_per_second
    });
  }
  
  
  next();
};

export default checkPassword;