const express = require("express");

const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser =require("cookie-parser")

const errorHandler =require ("./middleWare/errorMiddleWare")
const userRoute = require("./routes/userRoute");


// const authRoute = require("./routes/auth");
// const postRoute = require("./routes/posts");
// ROUTES
// app.get("/", (req, res) => {
//   res.send("my home page");
// });

//Error Middleware
app.use(errorHandler)

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((res) => {
    console.log("mongodb connection successfully");
  })
  .catch((error) => {
    console.log(error);
  });

//middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.urlencoded({extended:false}));

app.use(cookieParser());
//middleware Router



// app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);


const PORT = 8080;
app.listen(PORT, () => {
  console.log("Backend server is running on port",PORT);
});
