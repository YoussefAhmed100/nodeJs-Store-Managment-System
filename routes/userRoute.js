const router = require ("express").Router();
const {userRegister , userLogin ,userLogout ,getUser ,loginStatus
     ,updateUser ,changePassword ,forgotPassword,resetPassword} =require ("../controller/userController") 
const protect = require("../middleWare/auth")

router.post("/register", userRegister);
router.post("/login", userLogin);
router.get("/logout",userLogout)
router.get("/getuser",protect,getUser)
router.get("/loggedIn",loginStatus)
router.put("/updateUser",protect,updateUser)
router.put("/change",protect,changePassword)
router.post("/forgotPassword" ,forgotPassword)
router.put("/resetpassword/:resetToken" ,resetPassword)


module.exports =router