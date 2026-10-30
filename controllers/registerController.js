const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");

function generateAuthToken(user) {
  // Only what the frontend needs; never the password hash.
  const payload = { user_id: user.user_id, username: user.username, email: user.email };
  const secretKey = process.env.TOKEN_SECRET; 
  const options = { expiresIn: "1h" }; 

  return jwt.sign(payload, secretKey, options);
}

class UserController {
  async registerUser(req, res) {
    try {
      const { username, email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      await userModel.createUser(username, email, hashedPassword);

      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async loginUser(req, res) {
    
    try {
      const { email, password } = req.body;

      const user = await userModel.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateAuthToken(user);
      res.cookie("dataToken", token, { maxAge: 900000, httpOnly: true, sameSite: 'None',
      secure: true});
      console.log("Login Successful")
      res.status(200).json("Cookie Set");
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // requireLogin has already verified the token and set req.user.
  async userData(req, res){
    res.json({
        message: 'Successful log in',
        authorizedData: req.user
    });
  }

  async logOut(req,res){
    // Clear the 'dataToken' cookie on the client-side
    res.clearCookie('dataToken', { sameSite: 'None', secure: true, httpOnly: true });

    // Send a response indicating successful logout
    return res.status(200).json({ message: 'Logout successful' });

  }

  async checkLogin(req, res){
    res.status(200).json({ message: 'Cookie Works' });
  }
  
}

module.exports = new UserController();
