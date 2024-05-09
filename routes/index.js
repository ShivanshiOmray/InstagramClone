var express = require("express");
var router = express.Router();
const passport = require("passport");
var userModel = require("./users");
var postModel = require("./post");
var storyModel = require("./story");
const upload = require("./multer");

const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));

router.get("/", function (req, res) {
  res.render("index", { footer: false });
});

router.get("/login", function (req, res) {
  res.render("login", { footer: false });
});

router.get("/story", isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render("story", { footer: false, user });
});
router.get("/story/:id", isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  const story = await storyModel.findOne({ _id: req.params.id });
  res.render("story", { footer: false, user, story });
});

router.get("/feed", isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  const posts = await postModel.find().populate("user");

  const stories = await storyModel.find().populate("user");
  var obj = {};
  const packs = stories.filter(function (story) {
    if (!obj[story.user._id]) {
      obj[story.user._id] = "";
      return true;
    }
  });
  console.log(packs);
  res.render("feed", { footer: true, posts, user, stories: packs });
});
router.get("/like/:postid", isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  const post = await postModel.findOne({ _id: req.params.postid });
  if (post.likes.indexOf(user._id) === -1) {
    post.likes.push(user._id);
  } else {
    post.likes.splice(post.likes.indexOf(user._id), 1);
  }
  await post.save();
  res.json(post);
});

router.get("/save/:postid", isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  user.saved.push(req.params.postid);
  await user.save();
  res.json(user);
});

router.get("/profile", isLoggedIn, async function (req, res) {
  const user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("posts");
  res.render("profile", { footer: true, user });
});

router.get("/edit", isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render("edit", { footer: true, user });
});
router.post(
  "/update",
  upload.single("image"),
  isLoggedIn,
  async function (req, res) {
    const user = await userModel.findOneAndUpdate(
      { username: req.session.passport.user },
      { username: req.body.username, name: req.body.name, bio: req.body.bio },
      { new: true }
    );

    if (req.file) {
      user.profileImage = req.file.filename;
    }
    await user.save();
    req.logIn(user, function (err) {
      if (err) throw err;
      res.redirect("/profile");
    });
  }
);

router.get("/search", isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render("search", { footer: true, user });
});
router.get("/username/:username", isLoggedIn, async function (req, res) {
  const regex = new RegExp(`^${req.params.username}`, "i");
  const users = await userModel.find({ username: regex });
  res.json(users);
});

router.get("/upload", isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render("upload", { footer: true, user });
});
router.post(
  "/upload",
  isLoggedIn,
  upload.single("image"),
  async function (req, res) {
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });

    if (req.body.type === "post") {
      const post = await postModel.create({
        picture: req.file.filename,
        user: user._id,
        caption: req.body.caption,
      });
      user.posts.push(post._id);
    } else if (req.body.type === "story") {
      const story = await storyModel.create({
        image: req.file.filename,
        user: user._id,
      });
      user.stories.push(story._id);
    }

    await user.save();
    res.redirect("/feed");
  }
);

router.post("/register", function (req, res) {
  var userData = new userModel({
    username: req.body.username,
    name: req.body.name,
    email: req.body.email,
  });

  userModel.register(userData, req.body.password).then(function () {
    passport.authenticate("local")(req, res, function () {
      res.redirect("/feed");
    });
  });
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/feed",
    failureRedirect: "/login",
  }),
  function (req, res, next) {}
);

router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/login");
  }
}

module.exports = router;
