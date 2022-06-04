const nodemailer = require('nodemailer')

exports.sendMail = async(options) =>{
    var transporter = nodemailer.createTransport({
        host: process.env.SMPT_HOST,
        port: process.env.SMPT_PORT,
        auth: {
          user: process.env.SMPT_MAIL,
          pass: process.env.SMPT_PASSWORD
        },
        service:process.env.SMPT_SERVICE

        // host: "smtp.mailtrap.io",
        // port: 2525,
        // auth: {
        //   user: "55dc7500a483f9",
        //   pass: "7241d6179937ad"
        // }
      });

      const mailOptions = {
        from: process.env.SMPT_MAIL,
        to: options.email,
        subject: options.subject,
        text: options.message,
      };
    
      await transporter.sendMail(mailOptions);

}