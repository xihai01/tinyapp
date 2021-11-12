//import functions to test
const { assert } = require('chai');
const { 
  generateRandomString,
  userExist,
  emailExist,
  findUserbyEmail,
  urlsForUser
} = require('../helpers');

const testUrlDatabase = {
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

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('generateRandomString', () => {
  it('should return a string of 6 characters', () => {
    const result = generateRandomString();
    const length = 6;
    assert.equal(result.length, length);
  });
});

describe('userExist', () => {
  it('should return true if an user with id exists in db', () => {
    const result = userExist('user2RandomID', testUsers);
    assert.isTrue(result);
  });
  it('should return false if an user with id does not exist in db', () => {
    const result = userExist('user2RdomID', testUsers);
    assert.isFalse(result);
  });
});

describe('emailExist', () => {
  it('should return true if email exist in db', () => {
    const result = emailExist('user2@example.com', testUsers);
    assert.isTrue(result);
  });
  it('should return false if email does not exist in db', () => {
    const result = emailExist('user2@exple.com', testUsers);
    assert.isFalse(result);
  });
});

describe('getUserByEmail', () => {
  it('should return a user with a valid email', () => {
    const user = findUserbyEmail('user@example.com', testUsers);
    const expectedUserID = 'userRandomID';
    assert.equal(user.id, expectedUserID);
  });
  it('should return null if user with email does not exist', () => {
    const user = findUserbyEmail('apple@orange.com', testUsers);
    const expectedUserID = null;
    assert.equal(user, expectedUserID);
  });
});

describe('urlsForUser', () => {
  it('should return an object of urls associated for user', () => {
    const result = urlsForUser('aJ48lW', testUrlDatabase);
    const expected = { b6UTxQ: {
        longURL: "https://www.tsn.ca",
        userID: "aJ48lW"
      },
      i3BoGr: {
        longURL: "https://www.google.ca",
        userID: "aJ48lW"
      }
    };
    assert.deepEqual(result, expected);
  });
  it('should return an empty object when user did not create any urls', () => {
    const result = urlsForUser("abv96k", testUrlDatabase);
    const expected = { };
    assert.deepEqual(result, expected);
  });
});