const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  },
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "abv90k"
  }
};

const users = {
  "aJ48lW": {
    id: "aJ48lW", 
    email: "user@example.com", 
    password: "12345"
  },
 "abv90k": {
    id: "abv90k", 
    email: "user2@example.com", 
    password: "hellothere"
  }
};

function generateRandomString() {
  let result = '';
  for (let i = 0; i < 6; i++) {
    //get a random # from 1 - 3
    let selectChoice = Math.floor(Math.random() * 3) + 1;
    let char = '';
    if (selectChoice === 1 || selectChoice === 2) {
      //select a random uppercase alphabet
      min = Math.ceil(65);
      max = Math.floor(90);
      let rand = Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
      char = selectChoice === 1 ? String.fromCharCode(rand) : String.fromCharCode(rand).toLowerCase();
    }

    //select a random # 
    if (selectChoice === 3) {
      let rand = Math.floor(Math.random() * 9) + 1;
      char = rand.toString();
    }
    result += char;
  }
  return result;
};

function userExist(id) {
  for (const user in users) {
    if (users[user].id === id) {
      return true;
    }
  }
  return false;
};

function emailExist(email) {
  for (const user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
};

function findUserbyEmail(email) {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return null;
};

function urlsForUser(id) {
  let output = { };
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      output[url] = urlDatabase[url];
    }
  }
  return output;
};

/*redirect root to /urls or /login*/
app.get('/', (req, res) => {
  let user = users[req.cookies["user_id"]];
  //redirect to login page if user is not logged in
  if (user) {
    //check if user exists in db
    iuserExist(user.id) ? res.redirect('/urls') : res.redirect('/login');
  } else {
    res.redirect('/login');
  }
});

app.get('/urls', (req, res) => {
  //retrieve user data from cookie
  let user = users[req.cookies["user_id"]];
  //retrieve user's url only
  let urls = { };
  if (user) {
    urls = urlsForUser(user.id);
  }
  let urlData = {urls: urls, user_id: user};
  res.render('urls_index', urlData);
});

app.post('/urls', (req, res) => {
  let user = users[req.cookies["user_id"]];
  if (user) {
    const shortURL = generateRandomString();
    const userID = user.id;
    const longURL = req.body.longURL;
    //save shortURL to our url database along with user id
    urlDatabase[shortURL] = { longURL, userID };
    console.log(urlDatabase);
    res.redirect("/urls/" + shortURL); //redirect user to /urls/:shortURL
  } else {
    res.sendStatus(403);
  } 
});

app.post('/urls/:id', (req, res) => {
  const user = users[req.cookies["user_id"]];
  //redirect user to error message if not logged in
  if (user) {
    const shortURL = req.params.id;
    if (urlDatabase[shortURL] === undefined) {
      res.sendStatus(404);
    } else if (urlDatabase[shortURL].userID !== user.id) {
      res.sendStatus(403);
    } else {
    //update the url database with new link
    urlDatabase[shortURL].longURL = req.body.longURL;
    res.redirect('/urls');
    }
  } else {
    res.sendStatus(403);
  }
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const user = users[req.cookies["user_id"]];
  if (user) {
    //fetch the short url to be deleted
    const shortURL = req.params.shortURL;
    if (urlDatabase[shortURL] === undefined) {
      res.sendStatus(404);
    } else if (urlDatabase[shortURL].userID !== user.id) {
      res.sendStatus(403);
    } else {
      //delete the urls from database
      delete urlDatabase[shortURL];
      res.redirect('/urls');
    }
  } else {
    res.sendStatus(403);
  }
});

app.get('/urls/new', (req, res) => {
  let user = users[req.cookies["user_id"]];
  //redirect unregistered and not logged in users to login form
  if (user) {
    const templateVars = { user_id: user };
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get('/u/:shortURL', (req, res) => {
  try {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } catch (error) {
    res.sendStatus(404);
  }
});

app.get('/urls/:shortURL', (req, res) => {
  let user = users[req.cookies["user_id"]];
  let shortURL = req.params.shortURL;
  let longURL = '';
  let user_id = '';
  let templateVars = { };
  if (user && urlDatabase[shortURL].userID === user.id) {
    longURL = urlDatabase[shortURL].longURL;
    user_id = user;
    templateVars = { shortURL, longURL, user_id };
    res.render('urls_show', templateVars);
  } else {
    user_id = undefined;
    templateVars = { user_id };
    res.render('urls_show', templateVars);
  }
});

/*login user*/
app.get('/login', (req, res) => {
  res.render('urls_login');
});

app.post('/login', (req, res) => {
  //error checking - email and password must match to login
  const email = (req.body.email).trim();
  const password = (req.body.password).trim();
  const foundUser = findUserbyEmail(email);
  if (foundUser) {
    if (foundUser.password === password) {
      //set the cookie and redirect
      res.cookie('user_id', foundUser.id);
      res.redirect('/urls');
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(403);
  }
});

app.post('/logout', (req, res) => {
  //clear cookies and redirect to /urls
  res.clearCookie('user_id');
  res.redirect('/urls');
});

/*register a new user*/
app.get('/register', (req, res) => {
  let user = users[req.cookies["user_id"]];
  const templateVars = { user_id: user };
  res.render('urls_register', templateVars);
});

app.post('/register', (req, res) => {
  const email = (req.body.email).trim();
  const password = (req.body.password).trim();
  //error checking - email and/or password can't be empty
  if (email.length === 0 || password.length === 0) {
    res.sendStatus(400);
  } else if (emailExist(email)) {
    //error checking - cannot have duplicate emails in db
    res.sendStatus(400);
  } else {
    //generate a new user
    const id = generateRandomString();
    users[id] = { id, email, password };
    //set a cookie containing user id
    res.cookie('user_id', id);
    console.log(users);
    res.redirect('/urls');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});