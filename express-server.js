const express = require("express");
const app = express();
const PORT = 8080;
const fs = require("fs");
const urlDatabase = require("./app-db.json");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(__dirname + '/public'));
app.set("view engine", "ejs");

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "Walter": {
    id: "fakeId",
    email: "walter@disney.com",
    password: "goodpassword"
  }
}

const generateRandomString = () => {
  let outStr = ""
  while(outStr.length < 6){
    let randCharCode = Math.floor(Math.random() * 122 + 48)
    //number
    if(randCharCode < 58){
      outStr += String.fromCharCode(randCharCode);
    //cap and lower letters
    }else if((randCharCode >= 65 && randCharCode <= 90) || (randCharCode >= 97 && randCharCode <= 122)) {
      outStr += String.fromCharCode(randCharCode);
    }
  }
  return outStr;
};

const dbToDisk = () => {
  let outJSON = JSON.stringify(urlDatabase)
  fs.writeFile("./app-db.json", outJSON, () => {
    console.log("Database Updated On Disk")
  });
}

const emailAlreadyExists = (database, newAddress) => {
  for(key in database){
    if(database[key]["email"] === newAddress){
      return true
    }
  }
  return false;
}

const getUserFromEmail = (database, email) => {
  for(key in database){
    if(database[key]["email"] === email){
      return key
    }
  }
  console.log("Error: email address not found")
}

//returns true if password is valid
const validatePassword = (database, user_id, password) => {
  return database[user_id]["password"] === password;
}

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/403", (req, res) => {
  templateVars = {user_id: req.cookies.user_id};
  res.render("403", templateVars);
});

app.get("/404", (req, res) => {
  templateVars = {user_id: req.cookies.user_id};
  res.render("404", templateVars);
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user_id: req.cookies.user_id
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user_id:req.cookies.user_id,
  }
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  dbToDisk();
  var redirectURL = `http://localhost:8080/urls/${shortURL}`;
  res.redirect(redirectURL);
});


//Add a POST route that removes a URL resource: POST /urls/:id/delete
app.post("/urls/:id/delete", (req, res) => {
  let shortURL = req.params.id;
  delete urlDatabase[shortURL];
  dbToDisk();
  res.status(301);
  res.redirect("/urls/");
});

app.get("/urls/:id", (req, res) => {

  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    user_id:req.cookies.user_id
  };
  res.render("urls_show", templateVars);
});

//Add a POST route that updates a URL resource; POST /urls/:id
app.post("/urls/:id", (req, res) => {

  let newLongURL = req.body.newLongURL;
  let shortURL = req.params.id
  urlDatabase[req.params.id] = newLongURL;
  dbToDisk();
  res.status(301);
  res.redirect("/urls/");
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  res.status(301);
  res.redirect(longURL);
});

app.get("/login", (req, res) => {
  templateVars = {user_id: req.cookies.user_id};
  res.render("login", templateVars);
});

//logic is a bit redundant - fix later if time
app.post("/login", (req, res) => {
  let user_id = getUserFromEmail(users, req.body.email);

  if(user_id){
    let passwordIsValid = validatePassword(users, user_id, req.body.password);
    if(passwordIsValid){
      res.cookie("user_id", user_id);
      res.redirect("/");
    }
  }
  res.status(403).redirect("403");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls/");
});

app.get("/register", (req, res) => {
  let templateVars = {
    user_id: req.cookies.user_id
  };
  res.render("register", templateVars)
});

app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let randId = generateRandomString();

  if(!email || !password){
    res.status(400).redirect("register");

  }else if(emailAlreadyExists(users, email)){
    res.status(400).redirect("register");

  //new user passes validators
  }else{
    users[randId] = {
      id: randId,
      email: email,
      password: password,
    }
    console.log(users)
    res.cookie("user_id", randId)
    let templateVars = {user_id: randId}
    res.redirect("/urls/");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

