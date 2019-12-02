var express = require("express");
var path = require("path");
var ejs = require("ejs");
const bodyParser = require("body-parser");
var app = express();
const gravatar = require("gravatar");
var mongoose = require("mongoose");
var passport = require("passport");
const bcrypt = require("bcryptjs");
var mysql = require("mysql");
var localStrategy = require("passport-local");

var User = require("./models/User");

// mongoose.connect("mongodb://localhost/webforall");

mongoose
  .connect("mongodb://localhost/webforall")
  .then(() => {
    console.log("Connected to Database");
  })
  .catch(err => {
    console.log("Not Connected to Database ERROR! ", err);
  });

app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next) {
  res.locals.currentUser = req.User;
  next();
});

passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.use(
  require("express-session")({
    secret: "I'm nithin",
    resave: false,
    saveUninitialized: false
  })
);

app.set("view engine", "ejs");

// mysql

var mysql = require("mysql");

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "webforall"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

// end mysql
app.get("/", function(req, res) {
  console.log(req.session.passport);
  res.render("home", { user: req.session.passport });
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/profile", function(req, res) {
  res.render("profile");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.post("/register", function(req, res) {
  const avatar = gravatar.url(req.body.username, {
    s: "200", // Size
    r: "pg", // Rating
    d: "mm" // Default
  });

  var newUser = new User({
    username: req.body.username,
    avatar
  });

  User.register(newUser, req.body.password, function(err, User) {
    if (err) {
      console.log(err);
    }
    passport.authenticate("local")(req, res, function() {
      console.log(newUser);
      return res.render("info", { newUser: newUser });
    });
  });
});
app.get("/info", function(req, res) {
  res.render("info");
});

app.post("/review", function(req, res) {
  console.log(req.body.review);
  console.log(req.body.courseid);
  var i = req.body.courseid;
  var q = "select user_id from user where email_id=?";
  con.query(q, [req.session.passport.user], function(err, results) {
    console.log(results[0].user_id);
    var p = "update user_courses set review=? where user_id=? and course_id=?";
    con.query(
      p,
      [[req.body.review], [results[0].user_id], [req.body.courseid]],
      function(err, result) {
        console.log(result);
        res.redirect(`/coursecontent/${i}`);
      }
    );
  });
});

app.post(
  "/login",
  passport.authenticate(
    "local",

    {
      successRedirect: "/p",
      failureRedirect: "/login"
    }
  ),
  function(req, res) {
    console.log(req);
  }
);

app.get("/logout", function(req, res) {
  req.session.destroy(function(err) {
    res.redirect("/"); //Inside a callback… bulletproof!
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.render("notlogged");
}

app.get("/p", function(req, res) {
  console.log(req.session.passport.user);
  var q = "select user_id from user where email_id=?";
  con.query(q, [req.session.passport.user], function(err, results) {
    console.log(results);
    var q2 = "select course_id from user_courses where user_id=?";

    con.query(q2, [results[0].user_id], function(e, r) {
      console.log(r);
      var q8 =
        "select * from courses,user_courses where courses.course_id = user_courses.course_id and user_courses.user_id=?";
      con.query(q8, [results[0].user_id], function(error, results2) {
        console.log(results2);
        var q9 = "select * from user where email_id=?";
        con.query(q9, [req.session.passport.user], function(er1, results1) {
          console.log(results1[0]);
          res.render("profile", { user: results1[0], course: results2 });
        });
      });
    });
  });
});

app.get("/coursecontent/:c_id", function(req, res) {
  var q = "select * from user where email_id=?";
  con.query(q, [req.session.passport.user], function(err, results) {
    var q1 = "select * from courses where course_id=?";
    con.query(q1, [req.params.c_id], function(er, result) {
      console.log(result);
      var q2 = "select * from user_courses where course_id=? and user_id=?";
      con.query(q2, [[req.params.c_id], [results[0].user_id]], function(
        er,
        resul
      ) {
        console.log(resul);
        var q3 = "select * from course_content where course_id=? ";
        con.query(q3, [req.params.c_id], function(e, resu) {
          console.log(resu);
          res.render("course", {
            user: results[0],
            course: result[0],
            review: resul[0],
            chapter: resu
          });
        });
      });
    });
  });
});

app.post("/info", function(req, res) {
  var person = {
    email_id: req.body.email,
    name: req.body.name,
    college: req.body.college,
    branch: req.body.branch,
    gravatar: "../img/image.png"
  };
  var q = "insert into user set ?";
  con.query(q, person, function(err, results, fields) {
    if (err) throw err;
    else {
      res.redirect("/p");
    }
  });
});

app.post("/c", function(req, res) {
  var q = "select user_id from user where email_id=?";

  con.query(q, [req.session.passport.user], function(err, results) {
    if (err) throw err;
    else {
      console.log(results[0]);
      var i = 0;
      var array = req.body.courses;
      console.log(array);
      for (i = 0; i < array.length; i++) {
        var cs = {
          user_id: results[0].user_id,
          course_id: array[i]
        };
        var q2 = "insert into user_courses set ?";
        con.query(q2, cs, function(err, results, fields) {
          if (err) throw err;
        });
      }
      res.redirect("/p");
    }
  });
});
app.listen(3000, function() {
  console.log("server is listening");
});
