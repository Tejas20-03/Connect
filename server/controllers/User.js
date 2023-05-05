import { User } from "../models/users.js";
import { sendMail } from "../utils/sendMail.js";
import { sendToken } from "../utils/sendToken.js";

export const register = async (req, res) => {
  try {
    const { name, email, password, branch, year, college } = req.body;

    // const { avatar } = req.files;

    let user = await User.findOne({ email });

    if (user) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const otp = Math.floor(100000 + Math.random() * 1000000);

    user = await User.create({
      name,
      email,
      password,
      branch,
      year,
      college,
      avatar: {
        public_id: "",
        url: "",
      },
      otp,
      otp_expiry: new Date(Date.now() + process.env.OTP_EXPIRE * 60 * 1000),
    });

    await sendMail(email, "OTP for registration", `Your OTP is ${otp}`);

    sendToken(
      res,
      user,
      201,
      "OTP sent to your email, please verify your account"
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verify = async (req, res) => {
  try {
    const otp = Number(req.body.otp);
    const user = await User.findById(req.user._id);

    if (user.otp !== otp || user.otp_expiry < Date.now()) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP or has beed Expired" });
    }

    user.verified = true;
    user.otp = null;
    user.otp_expiry = null;
    await user.save();
    sendToken(res, user, 200, "User verified successfully");
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter all fields",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Email or Password" });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Email or Password" });
    }

    sendToken(res, user, 200, "Login Successful");
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    res
      .status(200)
      .cookie("token", null, {
        expires: new Date(Date.now()),
      })
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addPost = async (req, res) => {
  try {
    const { title, description, url } = req.body;
    const user = await User.findById(req.user._id);
    user.posts.push({
      title,
      description,
      url,
      createdAt: new Date(Date.now()),
    });

    await user.save();

    res.status(200).json({ success: true, message: "Post added successfully" });
  } catch (error) {}
};

export const removePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const user = await User.findById(req.user._id);
    user.posts = user.posts.filter(
      (post) => post._id.toString() !== postId.toString()
    );

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Post removed successfully" });
  } catch (error) {}
};

export const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const user = await User.findById(req.user._id);
    user.post = user.posts.find(
      (post) => post._id.toString() === postId.toString()
    );

    user.post.push({
      title,
      description,
      url,
      createdAt: new Date(Date.now()),
    });

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Post updated successfully" });
  } catch (error) {}
};
