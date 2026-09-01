var express = require("express");
var router = express.Router();
const userModel = require("./users");
const postModel = require("./posts");
const passport = require("passport");
const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));
const upload=require('./multer');//import the multer middleware setup

router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.get("/login", function (req, res, next) {
  res.render("login",{error:req.flash('error')});
});


//handle file upload
router.post('/upload',isLoggedIn,upload.single('file'),async function(req,res,next){
  //access the uploaded file details via req.file
  if(!req.file){
    return res.status(404).send("No files were uploaded");
  }
  const user=await userModel.findOne({username:req.session.passport.user});
 const post=await postModel.create({
    image:req.file.filename,
    imageText:req.body.filecaption,
    userid:user._id
});
 user.posts.push(post._id);
 await user.save();
 res.redirect("/profile");
});


router.get("/profile", isLoggedIn, async function (req, res, next) {
  const user=await userModel.findOne({
    username:req.session.passport.user
  })
  .populate("posts")
  console.log(user);
  res.render("profile",{user});
});

router.get("/feed", isLoggedIn, function (req, res, next) {
  res.render("feed.ejs")
});

router.post("/register", function (req, res) {
  const { username, email, fullname } = req.body;
  const userData = new userModel({ username, email, fullname });
  userModel.register(userData, req.body.password).then(function () {
    passport.authenticate("local")(req, res, function () {
      res.redirect("/profile");
    });
  });
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/login",
    failureFlash:true
  }),
  function (req, res) {},
);

router.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}
module.exports = router;
