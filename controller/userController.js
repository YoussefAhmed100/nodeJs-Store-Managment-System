const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Token = require("../models/tokenModel");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};
// REGISTER

const userRegister = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  //validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("please fill in all required fields");
    //.json({ message: "please fill in all required fields" });
  }
  if (password.length < 6) {
    res.status(400).json({ message: "password must be up to 6 character" });
  }

  //chick if user email already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400).json({ message: "Email has already exist" });
  }

  //create new user
  const user = await User.create({
    name,
    email,
    password,
  });

  //Generate Token
  const token = generateToken(user._id);

  // send http-only cookie
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400),
    sameSite: "none",
    secure: true,
  });

  if (user) {
    const { _id, name, email, photo, pio, phone } = user;
    res.status(200).json({ _id, name, email, photo, pio, phone, token });
  } else {
    res.status(400).json({ message: "invalid user data" });
  }
});
//LOGIN
const userLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "please enter your email and password" });
  }
  //chick if user exists
  const user = await User.findOne({ email }).exec();
  if (!user) {
    res.status(400).json({ message: "User not found , please signUp" });
  }
  //User correct / chick if password correct
  const passwordIsCorrect = await bcrypt.compare(password, user.password);
  //Generate Token
  const token = generateToken(user._id);

  // send http-only cookie
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400),
    sameSite: "none",
    secure: true,
  });
  if (user && passwordIsCorrect) {
    const { _id, name, email, photo, pio, phone } = user;
    res.status(200).json({ _id, name, email, photo, pio, phone, token });
  } else {
    res.status(400).json({ message: "invalid email or password" });
  }
});

//LOGOUT
const userLogout = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
    sameSite: "none",
    secure: true,
  });
  return res.status(200).json({ message: "logout successfully  " });
});

// Get User Data
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  try {
    if (user) {
      const { _id, name, email, photo, pio, phone } = user;
      res.status(200).json({ _id, name, email, photo, pio, phone });
    } else {
      res.status(400).json({ message: "user isn`t found" });
    }
  } catch (err) {
    res.status(403).json(err);
  }
});

//get login status
const loginStatus = asyncHandler(async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json(false);
  }

  //verify token
  const verified = jwt.verify(token, process.env.JWT_SECRET);
  if (verified) {
    return res.json(true);
  } else {
    return res.json(false);
  }
});

//Update User
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    const { name, email, photo, pio, phone } = user;
    user.email = email;
    user.name = req.body.name || name;
    user.photo = req.body.photo || photo;
    user.pio = req.body.pio || pio;
    user.phone = req.body.phone || phone;

    const updatedUser = await user.save();
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      photo: updatedUser.photo,
      pio: updatedUser.pio,
      phone: updatedUser.phone,
    });
  } else {
    res.status(404).json({ message: "User not found" });
  }
});
//change password
const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { oldPassword, password } = req.body;
  // validate
  if (!user) {
    res.status(400).json({ message: "user not found " });
  }
  if (!oldPassword || !password) {
    res.status(400).json({ message: "please add old and new password" });
  }
  // check the oldPassword matches password in db
  const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);
  //save anew password
  if (user && passwordIsCorrect) {
    user.password = password;
    await user.save();
    res.status(200).json("password changed successfully");
  } else {
    res.status(400).json("the two password is same !");
  }
});
// forgot password

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404).json("User does not exist");
  }

  //delete token if it exists in DB
  let token = await Token.findOne({ userId: user._id });
  if (token) {
    await token.deleteOne();
  }
  // create Rest token
  let resetToken = crypto.randomBytes(32).toString("hex") + user._id;

  //hash token before save in DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  //save token to DB
  await new Token({
    userId: user._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * (60 * 1000),
  }).save();

  //construct reset url

  const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  //reset email
  const message = `
          <h2> Hello ${user.name}</h2>
   
         <p>Please use the url below to reset your password</p>
         <p> this reset link is valid only 30 minutes</p>
         <a href=${resetUrl} clicktracking =off ></a>

         <p>Regards...</p>
         <p>Pinvent team </p>
   `;

  const subject = "Password reset request ";
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;

  try {
    await sendEmail(subject, send_to, sent_from, message);

    res.status(200).json({ success: true, message: "reset email sent " });
  } catch (err) {
    res.status(500);
    throw new Error("Email not sent , Please try again ");
  }
});

//reset password
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { resetToken } = req.params;

  //hash token , then compare token in DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // find Token in DB
  const userToken = await Token.findOne({
    token: hashedToken,
    expiresAt: { $gt: Date.now() },
  });
  if (!userToken) {
    res.status(500);
    throw new Error("invalid or expire token ");
  }

  //find user
  const user = await User.findOne({ _id: userToken.userId });
  user.password = password;
  await user.save();
  res.status(200)
    .json({ message: "Password reset successfully , Please login" });
});
module.exports = {
  userRegister,
  userLogin,
  userLogout,
  getUser,
  loginStatus,
  updateUser,
  changePassword,
  forgotPassword,
  resetPassword,
};
