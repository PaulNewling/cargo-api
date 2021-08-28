/**
 * Author: Paul Newling
 * Date: 24AUG21
 * File: app.js
 * Description: Entry point into the project that contains the imports, connection with secrets, and base routes
 *  */ 

/**
 * Imports and requirements
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const cookieParser = require('cookie-parser');
const { addUser, getUserInformation } = require('./functions/userFunctions');
const { checkJSONError } = require('./middleware/reqContentAcceptsCheck');

/**
 * App setup and use statements
 */
require('dotenv').config();
const app = express();
app.use(express.json());
app.use(checkJSONError);
app.use(cookieParser());
app.set('view engine', 'ejs');
app.use('/static', express.static('public'));
app.enable('trust proxy');

/**
 * Secrets and env usage, dependent on development or production
 */
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
var redirect;
if (app.get('env') === 'development') {
  redirect = process.env.REDIR1;
  const morgan = require('morgan');
  app.use(morgan('dev'));
} else {
  redirect = process.env.REDIR2;
}
const usageDataPackage = [client_id, client_secret, redirect];


/**
 * Base routes that are rendered to the user
 */
app.get('/', (req, res) => {
  res.render('home');
});

/**
 * Linked from the 'home' page in the above route this route is the start of OAuth2.0 for this site.
 * We create a state variable and redirect through Google's API asking the user to log in
 */
app.get('/authenticate', (req, res) => {

  // Create a universal unique identifier for the state value
  const state = uuidv4();
  const redirectURL = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${client_id}&redirect_uri=${redirect}&scope=profile&state=${state}`;
  res.redirect(redirectURL);
});

/**
 * After the user has logged in through the Google endpoint we check that a code has been generated through the OAuth2.0 workflow.
 * With this code we then hand the code, request object and usage data to the getUserInformation() function which will complete the OAuth2.0 workflow.
 * After the function returns we redirect the user the success page.
 */
app.get('/oauth', async (req, res) => {
  const { code } = req.query;
  if (code) {
    try {
      await getUserInformation(code, res, usageDataPackage);
      res.redirect('/success');
    } catch (e) {
      console.log(e);
      res.redirect('/error');
    }
  } else {
    res.redirect('/');
  }
});

/**
 * Information pulled from the Google API using the OAuth2.0 workflow allows us to display the JWT, user name and user ID.
 */
app.get('/success', (req, res) => {
  const { displayName, userID, token } = req.cookies;
  addUser(req, userID, displayName);
  res.render('oauth', { displayName, userID, token });
});

/**
 * Error page to collect any issues with Google People OAuth2.0 and clears cookies (they have a timer, but this is to ensure a reset)
 *  */ 
app.get('/error', (req, res) => {
  res.clearCookie('displayName');
  res.clearCookie('userID');
  res.clearCookie('token');
  res.render('errorPage');
});

/**
 * Use Routes for project data
 */
app.use('/users', require('./routes/users'));
app.use('/cargo', require('./routes/cargo'));
app.use('/boats', require('./routes/boats'));


// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`CS493 Final Project is listening on port ${PORT}...`);
});
