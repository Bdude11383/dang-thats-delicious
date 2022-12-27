const mongoose = require('mongoose')
const User = mongoose.model('User')
const promisify = require('es6-promisify')

exports.loginForm = (req, res) => {
  res.render('login', { title: 'Login' })
}

exports.registerForm = (req, res) => {
  res.render('register', { title: 'Register' })
}

exports.validateRegister = (req, res, next) => {
  req.sanitizeBody('name')
  req.checkBody('name', 'You must supply a name').notEmpty()
  req.checkBody('email', 'That email is not valid').isEmail()
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false
  })
  req.checkBody('password', 'password cannot be blank').notEmpty()
  req.checkBody('password-confirm', 'confirmed password cannot be blank').notEmpty()
  req.checkBody('password-confirm', 'whoops your passwords do not match').equals(req.body.password)

  const errors = req.validationErrors()
  if (errors) {
    req.flash('error', errors.map(error => error.msg))
    res.render('register', { title: 'Register', body: req.body, flashes: req.flash() })
    return //given that there is an error, stop the function from running
  }
  next() //given there were no errors, send them to the next middleware and get registration completed
}

exports.register = async (req, res, next) => {
  const user = new User({ email: req.body.email, name: req.body.name })
  const register = promisify(User.register, User) //this gives is the register method
  await register(user, req.body.password)
  next() //pass to auth controller.login
}

exports.account = (req, res) => {
  res.render('account', { title: 'Edit your account' })
}

exports.updateAccount = async (req, res) => {
  const updates = {
    name: req.body.name,
    email: req.body.email
  }

  const user = await User.findOneAndUpdate(
    { _id: req.user._id },
    { $set: updates },
    { new: true, runValidators: true, context: 'query' }
  )
  req.flash('success', 'profile updated!')
  res.redirect('back')
}

