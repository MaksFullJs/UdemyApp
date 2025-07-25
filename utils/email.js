const nodemailer = require('nodemailer');
const pug = require('pug');
const path = require('path');
const { console } = require('inspector');
const { htmlToText } = require('html-to-text');

class Email {
  constructor(user, url) {
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.to = user.email;
    this.from = `Maksym Pelyshko ${process.env.DOMAIN_EMAIL}`;
  }

  createTransport() {
    if (process.env.NODE_ENV == 'production') {
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: 'your_sendgrid_user',
          pass: 'your_sendgrid_pass',
        },
      });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    return transporter;
  }

  async send(template, subject) {
    const html = pug.renderFile(
      path.join(__dirname, `../views/emails/${template}.pug`),
      { firstName: this.firstName, url: this.url, subject }
    );
    console.log(__dirname, `../views/emails/${template}.pug`);
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
    };

    await this.createTransport().sendMail(mailOptions);
  }

  sendWelcome = async () => {
    await this.send('welcome', 'Welcome to the Natours Family');
  };

  sendResetPassword = async () => {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes'
    );
  };
}

module.exports = Email;
