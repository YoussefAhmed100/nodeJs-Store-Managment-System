const mongoose =require ("mongoose")
const bcrypt =require ("bcrypt")



const userSchema = mongoose.Schema({
    name: {
        type:String,
        required:[true , "Please enter your name"]
    },
    email :{
        type:String,
        required:[true , "Please enter your email"],
        unique :true,
        trim :true,
        match:[
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            "Please enter a valid email "
        ]

    },
    password :{
        type:String,
        required:[true , "Please enter your password"],
        minLength:[6 , "password must be up to 6 character"],


        
    },
    photo:{
        type:String,
        required:[true , "please enter the photo"],
        default:"https://e7.pngegg.com/pngimages/799/987/png-clipart-computer-icons-avatar-icon-design-avatar-heroes-computer-wallpaper-thumbnail.png"


    },
    phone:{
        type:String,
        default:"+01"
    },
    pio:{
        type:String,
        default:"pio",
        maxLength:[250 , "password must not be more than 250  character"],
    }

},{timestamps:true});

  // encrypt password and save 
  userSchema.pre("save" , async function(next){
    if(!this.isModified("password")){
        return next();
    }



    //hash password
    
  const salt = await bcrypt.genSalt(10);
  const hashedPassword =await bcrypt.hash(this.password , salt);
  this.password = hashedPassword;
  next();

  });




const User = mongoose.model("User" , userSchema);
module.exports = User;