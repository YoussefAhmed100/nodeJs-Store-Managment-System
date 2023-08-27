const nodemailer = require("nodemailer")


const sendEmail = async(message,subject , send_to ,sent_from , reply_to)=>{
      // create Email Transporter 
    const transporter =nodemailer.createTransport({
        host:process.env.EMAIL_HOST,
        port:587,
        auth:{
            user:process.env.EMAIL_USER,
            pass:process.env.EMAIL_PAS
        },
        tls:{
            rejectUnauthorized:false
        }

    });
    //option for sending email
    const option ={
        form:sent_from,
        to:send_to,
        replyTo:reply_to,
        subject:subject,
        html:message

    };
    //send email
    transporter.sendMail(option , function(err , info){
        if(err){
            console.log(err)
        } else{
            console.log(info)
        }
    });

}
module.exports= sendEmail;
