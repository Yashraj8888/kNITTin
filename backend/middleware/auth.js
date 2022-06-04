const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

exports.isAuthenticated = async (req, res,next) => {
    try {
      const {token} = req.cookies;
      if(!token){
          return res.status(401).json({
              message:"please login first"
          })
        }

      const decoded = await jwt.verify(token,process.env.JWT_SECRET);
      // console.log(decoded);
      req.user = await User.findById(decoded._id);
      // console.log(req.user);

      
      next();

    } catch (error) {
      res.status(500).json({
        success: "failure",
        message: error.message,
      });
    }
  };
  