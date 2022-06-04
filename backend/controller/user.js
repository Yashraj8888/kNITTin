// const res = require("express/lib/response");
// const { findOne } = require("../models/Post");
const { sendMail } = require("../middleware/sendMail");
const Post = require("../models/Post");
const User = require("../models/User");
const crypto = require("crypto")
// const { post } = require("../routes/user");

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });

    if (user) {
      return res
        .status(400)
        .json({ success: "failure", message: "user already exists" });
    }

    user = await User.create({
      name,
      email,
      password,
      avatar: { public_id: "dummy", url: "dummy "},
    });

    const token = await user.generateToken();
    
    const options ={
        httpOnly:true,
        expires: new Date(Date.now() + 90*24*60*60*1000),
    }

    res.status(201).cookie("token",token,options).json({ success: true, user,token });
  } catch (error) {
    res.status(500).json({
      success: "failure",
      message: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res
        .status(400)
        .json({ success: "failure", message: "user doesn't exist" });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      res.status(500).json({
        success: "failure",
        message: "Incorrect password",
      });
    }

    const token = await user.generateToken();
    
    const options ={
        httpOnly:true,
        expires: new Date(Date.now() + 90*24*60*60*1000),
    }
    res
      .status(200)
      .cookie("token", token,options)
      .json({ success: true, user, token });
  } catch (error) {
    res.status(500).json({
      success: "failure",
      message: error.message,
    });
  }
};
exports.logout = async (req, res) => {
  try {
   res.status(200).cookie("token",null,{expires: new Date(Date.now()),httpOnly: true}).json({
     success:true,
     message:"logged out successfully"
   })

  } catch (error) {
    res.status(500).json({
      success: "failure",
      message: error.message,
    });
  }
};



exports.followunfollow = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const loggedInUser = await User.findById(req.user._id);

    // console.log(req.params.id)

    if(!userToFollow) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if(loggedInUser.following.includes(userToFollow._id)) {
      const indexfollowing = loggedInUser.following.indexOf(userToFollow._id);
      const indexfollowers = userToFollow.followers.indexOf(loggedInUser._id);

      loggedInUser.following.splice(indexfollowing, 1);
      userToFollow.followers.splice(indexfollowers, 1);

      await loggedInUser.save();
      await userToFollow.save();

      res.status(200).json({
        success: true,
        message: "User Unfollowed",
      });
    } else {
      loggedInUser.following.push(userToFollow._id);
      userToFollow.followers.push(loggedInUser._id);

      await loggedInUser.save();
      await userToFollow.save();

      res.status(200).json({
        success: true,
        message: "User followed",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateProfile = async (req,res)=>{

  try {
    const user = await User.findById(req.user._id)

    const {name,email} = req.body;

    if(name){
      user.name = name
    }

    if(email){
      user.email = email
    }

    await user.save();
    
    res.status(200).json({
      success: true,
      message:"Profile Updated",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}


exports.updatePassword = async (req,res)=>{

  try {
    const user = await User.findById(req.user._id).select("+password")

    const {oldPassword, newPassword} = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide old and new password",
      });
    }

    const isMatch = await user.matchPassword(oldPassword);


    if(!isMatch){
      res.status(400).json({
        success:false,
        message:"incorrect old password"
      })
    }

    user.password = newPassword

    await user.save();

    res.status(200).json({
      success:true,
      message:"password updated"
    })
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}
exports.deleteProfile = async (req,res)=>{

  try {
    const user = await User.findById(req.user._id)

    const posts = user.posts

    const followers = user.followers

    const followings = user.following

    const userID = user._id
    
    //delete user
    await user.remove();

    //logout
    res.status(200).cookie("token",null,{expires: new Date(Date.now()),httpOnly: true})

    //delete all posts related to user
    for(let i=0;i<posts.length;i++){
      const post = await Post.findById(posts[i])
      await post.remove()
    }

    //removing user from followings of followers
    //agar koi user ko follow krta hai toh 
    for(let i=0;i<followers.length;i++){
      const follower = await User.findById(followers[i])
      const index = follower.following.indexOf(userID)
      follower.following.splice(index,1)
      await follower.save()
    }

    //removing user from followers of followings
    //agar user kisi ko follow krta hai toh
    for(let i=0;i<followings.length;i++){
      const following = await User.findById(followings[i])
      const index = following.followers.indexOf(userID)
      following.followers.splice(index,1)
      await following.save()
    }


    res.status(200).json({
      success:true,
      message:"Profile Deleted"
    })



    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}


exports.myProfile = async(req,res) =>{
  try {
     const user = await User.findById(req.user._id).populate("posts followers following")
     
    //  const posts = await user.populate(posts)

     res.status(200).json({
       success:true,
       user
     })

  } catch (error) {
     res.status(500).json({
       success:false,
       message:error.message
     })
  }
}


exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "posts followers following"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({
      name: { $regex: req.query.name, $options: "i" },
    });

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.forgotPassword = async(req,res)=>{
  try {
   const user = await User.findOne({email: req.body.email})

   if(!user){
     return res.status(404).json({
       success:false,
       message:"user doesn't exist"
     })
   }

   const resetPasswordToken = user.getResetPasswordToken()
   
   await user.save()

   const resetUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetPasswordToken}`

   const message = `Click on the link below to reset your password: \n\n ${resetUrl}`
   
   try {
    await sendMail({
      email: req.body.email,
      subject: "Reset password",
      message
    }) 
    
    res.status(200).json({
      success:true,
      message:`Email sent to ${user.email}`
    })

   } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(500).json({
      success: false,
      message: error.message,
    });
   }
  } catch (error) {
    res.status(500).json({
      success: false,
      message:error.message
    })
  }
}

exports.resetPassword = async(req,res)=>{
  try {

    const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex")

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: {$gt:Date.now()}
    })

    if(!user){
      return res.status(401).json({
        success: false,
        message: "Token is invalid or has expired",
      });
    }

    user.password = req.body.password

    user.resetPasswordToken = undefined
    user.resetPasswordTokenExpire = undefined

    await user.save()

    res.status(200).json({
      success: true,
      message: "Password Updated",
    });


   
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message:error.message
    })
  }
}