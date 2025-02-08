const bcrypt = require("bcryptjs");
const { User } = require("../models");
const jwt = require("jsonwebtoken");
require("dotenv").config();

async function register(req, res) {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      dateOfBirth,
      gender,
      height,
      weight,
      goalWeight,
      fitnessGoal,
    } = req.body;

    if (!email || !password || !weight || !height || !gender) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      dateOfBirth,
      gender,
      height,
      weight,
      goalWeight,
      fitnessGoal,
    });

    // Return response (excluding password)
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        fitnessGoal: newUser.fitnessGoal,
      },
    });
  } catch (error) {
    console.error("❌ Registration Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Set JWT as HttpOnly cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days Expiry
    });

    res.status(200).json({
      message: "Login successful",
      token,
    });

    console.log("Login successful");
  } catch (error) {
    
    console.error("❌ Login Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { register, login };
