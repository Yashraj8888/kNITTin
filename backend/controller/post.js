const Post = require("../models/Post");
const User = require("../models/User");

exports.createPost = async (req, res) => {
  try {
    const newPostData = {
      caption: req.body.caption,
      avatar: {
        public_id: "dummy",
        url: "dummy",
      },
      owner: req.user._id,
    };

    const newPost = await Post.create(newPostData);
    const user = await User.findById(req.user._id); //finding user by id
    user.posts.push(newPost._id);

    await user.save();

    res.status(201).json({ success: true, post: newPost });
  } catch (error) {
    res.status(500).json({
      success: "failure",
      message: error.message,
    });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: "failure",
        message: "Post not found",
      });
    }
    if (post.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: "failure",
        message: "You are Unautherized",
      });
    } else {
      await post.remove();

      const user = await User.findById(req.user._id);

      const index = user.posts.indexOf(req.params.id);

      user.posts.splice(index, 1);

      await user.save();

      return res.status(200).json({
        success: "true",
        message: "Post Deleted",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: "failure",
      message: error.message,
    });
  }
};
exports.likeDislike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: "failure",
        message: "Post not found",
      });
    }
    if (post.like.includes(req.user._id)) {
      const index = post.like.indexOf(req.user._id);

      post.like.splice(index, 1);

      await post.save();
      return res.status(200).json({
        success: "true",
        message: "Post Unliked",
      });
    } else {
      post.like.push(req.user._id);

      await post.save();

      return res.status(200).json({
        success: "true",
        message: "Post liked",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: "failure",
      message: error.message,
    });
  }
};
exports.getPostsOfFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const posts = await Post.find({
      owner: { $in: user.following },
    });

    res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    res.status(500).json({
      success: "failure",
      message: error.message,
    });
  }
};

exports.updateCaption = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    post.caption = req.body.caption;
    await post.save();
    res.status(200).json({
      success: true,
      message: "Post updated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    let userIndex = -1;

    //  for(let i=0; i<post.comments.length;i++){
    //    if(post.comments.user.toString()===req.user._id.toString())
    //     userIndex = i
    //  }

    post.comments.forEach((item, index) => {
      if (item.user.toString() === req.user._id.toString()) {
        userIndex = index;
      }
    });

    if (userIndex !== -1) {
      post.comments[userIndex].comment = req.body.comment;
      await post.save();
      return res.status(200).json({
        success: true,
        message: "Comment Updated",
      });
    } else {
      post.comments.push({
        user: req.user._id,
        comment: req.body.comment,
      });

      await post.save();
      return res.status(200).json({
        success: true,
        message: "Comment added",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (post.owner.toString() === req.user._id.toString()) {
      if (req.body.commentId === undefined) {
        return res.status(400).json({
          success: false,
          message: "Please provide comment ID ",
        });
      }

      post.comments.forEach((item, index) => {
        if (item._id.toString() === req.body.commentId.toString()) {
          return post.comments.splice(index, 1);
        }
      });

      await post.save();

      return res.status(200).json({
        success: true,
        message: "Selected Comment has deleted",
      });
    } else {
      post.comments.forEach((item, index) => {
        if (item.user.toString() === req.user._id.toString()) {
          return item.splice(index, 1);
        }
      });

      await post.save();

      return res.status(200).json({
        success: true,
        message: "Comment Deleted",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
