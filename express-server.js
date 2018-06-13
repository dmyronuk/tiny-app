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

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
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
    longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show", templateVars);
});

//Add a POST route that updates a URL resource; POST /urls/:id
app.post("/urls/:id", (req, res) => {
  console.log(req.body)
  let newLongURL = req.body.newLongURL;
  let shortURL = req.params.id
  console.log("newLongURL, shortURL", newLongURL, shortURL);
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

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username)
  res.redirect("/urls/");
})



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

