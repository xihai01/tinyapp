const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');
const {
  generateRandomString,
  userExist,
  emailExist,
  findUserbyEmail,
  urlsForUser
} = require('./helpers');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(cookieSession({
  name: "session",
  keys: ["I like security because it is cool", "to be or not to be that is the question"]
}));
app.use(methodOverride('_method'));

const salt = bcrypt.genSaltSync(10);

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
    password: bcrypt.hashSync("12345", salt)
  },
  "abv90k": {
    id: "abv90k",
    email: "user2@example.com",
    password: bcrypt.hashSync("hellothere", salt)
  }
};

/*redirect root to /urls or /login*/
app.get('/', (req, res) => {
  let user = req.session.user_id;
  //redirect to login page if user is not logged in
  userExist(user, users) ? res.redirect('/urls') : res.redirect('/login');
});

/*HOMEPAGE*/
app.get('/urls', (req, res) => {
  //retrieve user data from cookie
  let user = req.session.user_id;
  let email = '';
  //retrieve user's url only (make sure they exist first)
  let urls = { };
  if (userExist(user, users)) {
    urls = urlsForUser(user, urlDatabase);
    email = users[user].email;
  } else {
    user = undefined;
  }
  let urlData = {urls: urls, email, user_id: user};
  res.render('urls_index', urlData);
});

/*create a new url*/
app.put('/urls', (req, res) => {
  let user = req.session.user_id;
  //make sure the cookie is the users
  if (userExist(user, users)) {
    const shortURL = generateRandomString();
    const longURL = req.body.longURL;
    //save shortURL to our url database along with user id
    let userID = user;
    urlDatabase[shortURL] = { longURL, userID };
    res.redirect("/urls/" + shortURL); //redirect user to /urls/:shortURL
  } else {
    res.status(403).send('403 - Please login or register.');
  }
});

/*request to edit a link (private)*/
app.put('/urls/:id', (req, res) => {
  let user = req.session.user_id;
  //redirect user to error message if not logged in
  if (userExist(user, users)) {
    const shortURL = req.params.id;
    //send 404 - not found if url does not exist
    if (urlDatabase[shortURL] === undefined) {
      res.status(404).send('404 - This url does not exist.');
    } else if (urlDatabase[shortURL].userID !== user) {
      //send 403 - forbidden to prevent user accessing other's links
      res.status(403).send('403 - You do not have permission to access.');
    } else {
      //update the url database with new link
      urlDatabase[shortURL].longURL = req.body.longURL;
      res.redirect('/urls');
    }
  } else {
    res.status(403).send('403 - You do not have permission to access.');
  }
});

/*request to delete a link (private)*/
app.delete('/urls/:shortURL', (req, res) => {
  let user = req.session.user_id;
  if (userExist(user, users)) {
    //fetch the short url to be deleted
    const shortURL = req.params.shortURL;
    if (urlDatabase[shortURL] === undefined) {
      res.status(404).send('404 - The link you are trying to delete does not exist.');
    } else if (urlDatabase[shortURL].userID !== user) {
      res.status(403).send('403 - You do not have permission to delete this link.');
    } else {
      //delete the urls from database
      delete urlDatabase[shortURL];
      res.redirect('/urls');
    }
  } else {
    res.status(403).send('403 - You do not have permission to delete this link.');
  }
});

/*show a page for url creations (private)*/
app.get('/urls/new', (req, res) => {
  let user = req.session.user_id;
  let email = '';
  //redirect unregistered and not logged in users to login form
  if (userExist(user, users)) {
    email = users[user].email;
    const templateVars = { email, user_id: user };
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

/*redirect to full urls (public)*/
app.get('/u/:shortURL', (req, res) => {
  try {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } catch (error) {
    res.status(404).send('404 - This url does not exist.');
  }
});

/*show a specific link (private)*/
app.get('/urls/:shortURL', (req, res) => {
  let user = req.session.user_id;
  let shortURL = req.params.shortURL;
  let longURL = '';
  let email = '';
  let user_id = '';
  let templateVars = { };
  if (!userExist(user, users)) {
    user_id = undefined;
    templateVars = { user_id };
    res.render('urls_show', templateVars);
  }
  //make sure short url exists in db and belongs to user
  if (urlDatabase[shortURL] && urlDatabase[shortURL].userID === user) {
    longURL = urlDatabase[shortURL].longURL;
    email = users[user].email;
    templateVars = { shortURL, longURL, email, user_id: user };
    res.render('urls_show', templateVars);
  } else {
    user_id = undefined;
    email = users[user].email;
    templateVars = { email, user_id };
    res.render('urls_show', templateVars);
  }
});

/*login user*/
app.get('/login', (req, res) => {
  let user = req.session.user_id;
  //redirect user to /urls if already logged in
  if (userExist(user, users)) {
    res.redirect('/urls');
  }
  res.render('urls_login');
});

/*request to login user*/
app.put('/login', (req, res) => {
  //error checking - email and password must match to login
  const email = (req.body.email).trim();
  const password = (req.body.password).trim();
  const foundUser = findUserbyEmail(email, users);
  if (foundUser) {
    if (bcrypt.compareSync(password, foundUser.password)) {
      //set the cookie and redirect
      req.session.user_id = foundUser.id;
      res.redirect('/urls');
    } else {
      res.status(403).send('403 - You entered the wrong email/password. Please try again.');
    }
  } else {
    res.status(403).send('403 - Please enter a valid email and password.');
  }
});

/*logout and clear cookies*/
app.put('/logout', (req, res) => {
  //clear cookies and redirect to /urls
  delete req.session.user_id;
  res.redirect('/urls');
});

/*register a new user*/
app.get('/register', (req, res) => {
  let user = req.session.user_id;
  if (!userExist(user, users)) {
    const templateVars = { user_id: undefined };
    res.render('urls_register', templateVars);
  } else {
    res.redirect('/urls');
  }
});

app.put('/register', (req, res) => {
  const email = (req.body.email).trim();
  let password = (req.body.password).trim();
  //error checking - email and/or password can't be empty
  if (email.length === 0 || password.length === 0) {
    res.status(400).send('400 - Email and/or password cannot be left empty.');
  } else if (emailExist(email, users)) {
    //error checking - cannot have duplicate emails in db
    res.status(400).send('400 - An account with this email already exists.');
  } else {
    //generate a new user and store password as a hash
    const id = generateRandomString();
    password = bcrypt.hashSync(password, salt);
    users[id] = { id, email, password };
    //set a cookie containing user id
    req.session.user_id = id;
    res.redirect('/urls');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});