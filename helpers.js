//helper functions used by server

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

function userExist(id, database) {
  for (const user in database) {
    if (database[user].id === id) {
      return true;
    }
  }
  return false;
};

function emailExist(email, database) {
  for (const user in database) {
    if (database[user].email === email) {
      return true;
    }
  }
  return false;
};

function findUserbyEmail(email, database) {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return null;
};

function urlsForUser(id, database) {
  let output = { };
  for (const url in database) {
    if (database[url].userID === id) {
      output[url] = database[url];
    }
  }
  return output;
};

module.exports = { generateRandomString, userExist, emailExist, findUserbyEmail, urlsForUser };