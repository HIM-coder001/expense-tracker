import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";

//generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

//Register User
export const registerUser = async (req, res) => {
  const { fullName, email, password, profileImageUrl } = req.body;

  //validation check for missing fields
  if (!fullName || !email || !password) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  try {
    //check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "Email already in use",
      });
    }

    //create the user
    const user = await User.create({
      fullName,
      email,
      password,
      profileImageUrl,
    });

    res.status(201).json({
      id: user._id,
      user,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({
      message: "Error registering user",
      error: err.message,
    });
  }
};

//Login User
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  //validation checks for missing fields
  if (!email || !password) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  try {
    //check if user exists
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    //check if passwords match
    const isMatch = await bcrypt.compare( password ,existingUser.password );
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = generateToken(existingUser._id);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: existingUser._id,
        fullName: existingUser.fullName,
        email: existingUser.email,
        profileImageUrl: existingUser.profileImageUrl,
      },
    });
  } 

  catch (err) {
    return res.status(500).json({
        message: "Error logging in",
        error:err.message
    })
  }
};

//getUserInfo

export const getUserInfo = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({
            message: "Error fetching user information",
            error: error.message,
        });
    }
};
