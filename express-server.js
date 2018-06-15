const express = require("express");
const app = express();
const PORT = 8080;
const fs = require("fs");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require("bcrypt");
const methodOverride = require("method-override");

//Decided to save the dbs to disk so that changes wouldn't be whiped every server restart
const users = require("./user-db.json");
const urlDatabase = require("./app-db.json");


//Pageviews are not persistent - recreated every server restart
const pageviews = buildPageviewDB();

app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: "session",
  keys: ["supersecret"],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");



// const users = {
//   "userRandomID": {
//     id: "userRandomID",
//     email: "user@example.com",
//     password: "$2b$10$fxrcS0SsOrsaRwxxgN6s/Os0obNAXHlIHuLh9gLr3scGl2tBL4yj",
//     urls: ["TaEMFI"]
//   },
//  "user2RandomID": {
//     id: "user2RandomID",
//     email: "user2@example.com",
//     password: "$2b$10$xXa5UovQ1aalgdbOf61Kr.pnl1GCMQHimoRl4umMM.bfZjVFY1CJ",
//     urls: []
//   },
//   "Walter": {
//     id: "fakeId",
//     email: "walter@disney.com",
//     password: "$2b$10$5NK/M0274su8TXpwxMcdq.le5dfkYJiil59dWm6SGllrbQ3qlYTx2",
//     urls: ["b2xVn2", "9sm5xK"]
//   }
// }

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

function createNewPageviewTracker(){
  let newTracker = {
    visitor_ids: [],
    hits: [],
    uniqueVisitors: 0
  }
  return newTracker;
};

function buildPageviewDB(){
  let urlKeys = Object.keys(urlDatabase);
  return urlKeys.reduce((acc, cur) => {
    acc[cur] = createNewPageviewTracker();
    return acc;
  }, {})
};

const visitorIdExists = (pageviews, url_id, visitor_id) => {
  return pageviews[url_id].visitor_ids.reduce((acc, cur) => {
    if(cur === visitor_id){
      acc = true;
    }
    return acc;
  }, false)
};

//tracker does not distinguish between registered users and unregistered users
const updatePageviews = (pageviews, url_id, visitor_id) => {
  console.log(pageviews, url_id, visitor_id)
  let curPageviewObj = pageviews[url_id];
  if(! visitorIdExists(pageviews, url_id, visitor_id)){
    curPageviewObj.uniqueVisitors += 1;
    curPageviewObj.visitor_ids.push(visitor_id);
  }
  let date = new Date();
  let curTimestamp = date.toString();
  let newPageviewEntry = {
    timestamp: curTimestamp,
    visitor_id: visitor_id,
  }
  curPageviewObj.hits.push(newPageviewEntry);
};

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
    console.log("URL Database Updated On Disk")
  });
};

const usersToDisk = () => {
  let outJSON = JSON.stringify(users)
  fs.writeFile("./user-db.json", outJSON, () => {
    console.log("User Database Updated On Disk")
  });
};

const emailAlreadyExists = (database, newAddress) => {
  for(key in database){
    if(database[key]["email"] === newAddress){
      return true
    }
  }
  return false;
};

const getUserFromEmail = (database, email) => {
  for(key in database){
    if(database[key]["email"] === email){
      return key
    }
  }
  console.log("Error: email address not found")
};

//returns true if password is valid
const validatePassword = (database, user_id, plaintextPassword) => {
  let hashedPassword = database[user_id]["password"];
  return bcrypt.compareSync(plaintextPassword, hashedPassword);
};

const urlExists = (urls, shortURL) => {
  return urls.hasOwnProperty(shortURL);
};

const urlBelongsToUser = (users, user_id, shortURL) => {
  let userObj = users[user_id];
  return userObj.urls.reduce((acc, elem) => {
    if(elem === shortURL){
      acc = true;
    }
    return acc;
  }, false)
};

const getUserUrls = (users, urlDatabase, user_id) => {
  let curUserObj = users[user_id];
  return curUserObj.urls.reduce((acc, cur) => {
    acc[cur] = urlDatabase[cur];
    return acc
  }, {})
}

//deletes the link between a user and a url
const removeUserURL = (users, user_id, shortURL) => {
  let urlArr = users[user_id]["urls"];
  urlArr.forEach((elem, i) => {
    if(elem === shortURL){
      urlArr.splice(i, 1);
    }
  })
};

app.get("/", (req, res) => {
  templateVars = {user_id: req.session.user_id};
  res.render("home", templateVars);
});

app.get("/403", (req, res) => {
  templateVars = {user_id: req.session.user_id};
  res.render("403", templateVars);
});

app.get("/404", (req, res) => {
  templateVars = {user_id: req.session.user_id};
  res.render("404", templateVars);
});

//get list of urls
app.get("/urls", (req, res) => {
  let user_id = req.session.user_id;
  let urls = user_id ? getUserUrls(users, urlDatabase, user_id) : {};
  let urlsLength = Object.keys(urls).length;
  //Boolean used as a flag in the template to display a message
  let userHasNoUrls = urlsLength === 0;

  let templateVars = {
    urls: urls,
    userHasNoUrls: userHasNoUrls,
    user_id: req.session.user_id
  };
  res.render("urls_index", templateVars);
});

//form to create new short urls
app.get("/urls/new", (req, res) => {
  let templateVars = {
    user_id:req.session.user_id,
  }

  if(req.session.user_id){
    res.render("urls_new", templateVars);
  }else{
    res.status(403).redirect("/login");
  }
});

//post to create new short url
app.post("/urls", (req, res) => {
  let url_id = generateRandomString();
  let user_id = req.session.user_id;

  if(user_id){
    users[user_id].urls.push(url_id);
    urlDatabase[url_id] = req.body.longURL;
    dbToDisk();
    usersToDisk();

    //push add new tracker object to pageviews object
    let newTrackerObj = createNewPageviewTracker();
    pageviews[url_id] = newTrackerObj;

    let redirectURL = `http://localhost:8080/urls/${url_id}`;
    res.redirect(redirectURL);
  }else{
    res.status(403).redirect("/login");
  }
});

//Add a POST route that removes a URL resource: POST /urls/:id/delete
//Override as DELETE request method
app.delete("/urls/:id/delete", (req, res) => {
  let shortURL = req.params.id;
  let user_id = req.session.user_id;

  //if url doesn't exist, 404 it
  if(! urlExists(urlDatabase, shortURL)){
    res.status(404).redirect("/404");

  //if user is logged in they can delete
  }else if(user_id && urlBelongsToUser(users, user_id, shortURL)){
    delete urlDatabase[shortURL];
    removeUserURL(users, user_id, shortURL);
    dbToDisk();
    usersToDisk();
    res.status(301).redirect("/urls/");
  }else{
    res.status(403).redirect("/403");
  }
});

//Display single url info
app.get("/urls/:id", (req, res) => {
  let url_id = req.params.id;

  //url_id not found
  if(! urlExists(urlDatabase, url_id)){
    res.status(404).redirect("/404");

  //url_id exists
  }else{
    let user_id = req.session.user_id;
    let templateVars = {
      url_id: url_id,
      longURL: urlDatabase[url_id],
      user_id: user_id,
      url_tracker: pageviews[url_id],
    };

    if(user_id && urlBelongsToUser(users, user_id, url_id)){
      res.render("urls_show", templateVars);
    }else{
      res.status(403).redirect("/403")
    }
  }
});

//Edit existing url
app.put("/urls/:id", (req, res) => {

  //If user is logged in then they can edit
  if(req.session.user_id){
    if(urlBelongsToUser(users, req.session.user_id, req.params.id)){
      let newLongURL = req.body.newLongURL;
      let shortURL = req.params.id;
      urlDatabase[shortURL] = newLongURL;

      //update the urls but we don't need to update users on disk because the url_id is unchanged
      dbToDisk();
      res.status(301).redirect("/urls/");
    } else {
      let templateVars = {user_id: req.session.user_id};
      res.status(403).redirect("/403");
    }
  } else {
    let templateVars = {user_id: req.session.user_id};
    res.status(403).redirect("/403");
  }
});

//redirects short url to long url
app.get("/u/:url_id", (req, res) => {

  let url_id = req.params.url_id;

  //first check to make sure short url actually exists
  if(urlExists(urlDatabase, url_id )){
    let user_id = req.session.user_id;

    //if tracking cookie has not been set
    if(! req.session.tracker_id){
      //if the user is already logged in, use their id as the tracker
      if(user_id){
        req.session.tracker_id = user_id;
      //else create a new random tracker_id
      }else{
        req.session.tracker_id = generateRandomString();
      }
    }

    let longURL = urlDatabase[url_id];
    updatePageviews(pageviews, url_id, req.session.tracker_id);
    res.status(301);
    res.redirect(longURL);
  }else{
    res.status(404).redirect("/404");
  }
});

app.get("/login", (req, res) => {
  let templateVars = {user_id: req.session.user_id};
  res.render("login", templateVars);
});

//logic is a bit redundant - fix later if time
app.post("/login", (req, res) => {
  let user_id = getUserFromEmail(users, req.body.email);

  if(user_id){
    let passwordIsValid = validatePassword(users, user_id, req.body.password);
    if(passwordIsValid){
      req.session.user_id = user_id
      //res.cookie("user_id", user_id);
      res.redirect("/");
    }else{
      res.redirect(403, "403");
    }
  }else{
    res.status(403).redirect("403");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls/");
});

app.get("/register", (req, res) => {
  let templateVars = {
    user_id: req.session.user_id
  };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  //email or password are missing
  if(!email || !password){
    res.status(400).redirect("register");

  //email already exists in database
  }else if(emailAlreadyExists(users, email)){
    res.status(403).redirect("register");

  //new user passes validators
  }else{
    let randId = generateRandomString();
    let hashedPassword = bcrypt.hashSync(password, 10);

    users[randId] = {
      id: randId,
      email: email,
      password: hashedPassword,
      urls:[],
    }
    usersToDisk();

    req.session.user_id = randId;
    //res.cookie("user_id", randId);
    let templateVars = {user_id: randId};
    res.redirect("/urls/");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
  console.log(urlDatabase)
  console.log(pageviews)
});

