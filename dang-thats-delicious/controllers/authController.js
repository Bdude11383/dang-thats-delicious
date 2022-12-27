const passport = require('passport')
const crypto = require('crypto')
const mongoose = require('mongoose')
const User = mongoose.model('User')
const promisify = require('es6-promisify')
const mail = require('../handlers/mail')

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed Login!',
  successRedirect: '/',
  successFlash: 'You are now logged in'
})

exports.logout = (req, res) => {
  req.logout()
  req.flash('success', 'You are now logged out')
  res.redirect('/')
}

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next() //carry on, they're logged in
    return
  }
  req.flash('error', 'Oops you must be logged in to do that')
  res.redirect('/login')
}

exports.forgot = async (req, res) => {
  //see if user exists
  const user = await User.findOne({ email: req.body.email })
  if (!user) {
    req.flash('success', 'A password reset has been mailed to you if the email address exists')
    return res.redirect('/login')
  }
  // if user exists, set reset tokens and expiry on the account
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex')
  user.resetPasswordExpires = Date.now() + 36000000 //1 hour from now
  await user.save()

  // send them an email with the token
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`
  //await the mail send
  await mail.send({
    user,
    subject: 'Password Reset',
    resetURL,
    filename: 'password-reset',
  })
  //flash the success
  req.flash('success', `You have been emailed a password request link`)
  res.redirect('/login')
  //redirect to the login page after the email token has been sent
}

exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    reserPasswordExpires: { $gt: Date.now() }
  })
  if (!user) {
    req.flash('error', 'Password reset token is invalid or expired')
    return res.redirect('/login')
  }
  //if there is a user, then show the reset form
  res.render('reset', { title: 'Reset your password' })
}

exports.confirmPasswords = (req, res, next) => {
  if (req.body.password === req.body['password-confirm']) {
    next()
    return
  }
  req.flash('error', 'passwords do not match')
  res.redirect('back')
}

exports.update = async (req, res) => {

  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    reserPasswordExpires: { $gt: Date.now() }
  })

  if (!user) {
    req.flash('error', 'A password reset has been mailed to you if the email address exists')
    return res.redirect('/login')
  }

  const setPassword = promisify(user.setPassword, user)
  await setPassword(req.body.password)
  user.resetPasswordToken = undefined
  user.resetPasswordExpires = undefined
  const updatedUser = await user.save()
  await req.login(updatedUser)
  req.flash('success', 'nice your password has been reset')
  res.redirect('/')
}