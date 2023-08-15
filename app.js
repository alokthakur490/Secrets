//jshint esversion:6

require("dotenv").config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');
// const saltRounds = 10;

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const findOrCreate = require('mongoose-findorcreate');




const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

//TODO
app.use(session({
  secret: "Alokkumar.",
  resave: false,
  saveUninitialized: true
  
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1/UsersDB")
//mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    username : String,
    password  : String,
    facebookId: String,
    googleId : String,
    secret: String
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User",userSchema);
passport.use(User.createStrategy());



passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      secret:user.secret
      
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});





passport.use(new FacebookStrategy({
  clientID:process.env.APP_ID ,
  clientSecret:process.env.APP_SECRET,
  callbackURL: "http://localhost:3000/auth/facebook/callback"
  
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile);
  User.findOrCreate({ facebookId: profile.id }).then( function (err, user) {
    return cb(err, user);
  });
}
));

passport.use(new GoogleStrategy({
  clientID:     process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/callback",
  passReqToCallback   : true
},
function(request, accessToken, refreshToken, profile, done) {
  console.log(profile);
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return done(err, user);
  });
}
));






app.get("/", function(req, res){
  res.render("home");
});

app.get('/auth/facebook',
  passport.authenticate('facebook'));

  app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

  app.get('/auth/google',
  passport.authenticate('google', { scope:
      [ 'email', 'profile' ] }
));

app.get( '/auth/google/callback',
    passport.authenticate( 'google', {
        successRedirect: '/secrets',
        failureRedirect: '/login'
}));


app.get("/secrets", function(req, res){

  User.find({"secret": {$ne: null}}).then( function(foundUsers){
        res.render("secrets", {userswithsecrets: foundUsers});
      }
    
  )



});

app.get("/submit", function(req, res){
  if (req.isAuthenticated()){
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});
app.post("/submit",function(req,res){
 
  

  User.findById(req.user.id).then(function(foundUser){
    
        foundUser.secret = req.body.secret;
        foundUser.save().then(function(){
          res.redirect("/secrets");
        });
      })})
  
  
  









app.get("/register",function(req, res){
    res.render("register");
})

app.post("/register", function(req, res){

User.register({username :req.body.username},req.body.password).then(function(user,err){
  if(err){
    res.redirect("/register");
  }else{
    passport.authenticate("local")(req,res,function(){
      res.redirect("/secrets");
    })
  }
  }
)


//   bcrypt.hash(req.body.password, saltRounds).then( function(hash) {
//     // Store hash in your password DB.
//     //console.log(hash);
//     const newuser = new User({
//       username : req.body.username,
//       password : hash
//       });
  
//       newuser.save();
//       res.render("secrets");
// });
    
})


app.get("/login",function(req, res){
    res.render("login");
})

app.post("/login" ,function(req, res){
  const user = new User({
          username : req.body.username,
          password : req.body.password
          });
          req.login(user, function(err) {
            if (err) { console.log(err);
             }
            else{
              passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
              })
            }
           
          });

         

  // User.findOne({Username : Username}).then(function(obj){

  //   bcrypt.compare(password, obj.password).then( function(result) {
  //     if(result === true){
  //       res.render("secrets");
  //     } else{
  //       res.send("<h1>TRY AGAIN</h1>");
  //     }
  // }); 
  // })
})
app.get("/logout", function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});





app.listen(3000, function() {
  console.log("Server started on port 3000");
});


