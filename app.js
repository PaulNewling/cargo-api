const axios = require('axios');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const cookieParser = require('cookie-parser');
const { checkJSONError } = require('./middleware/reqContentAcceptsCheck');


require('dotenv').config();

const app = express();
app.use(express.json());
app.use(checkJSONError);
app.use(cookieParser());
app.set('view engine', 'ejs');
app.use('/static', express.static('public'));
app.enable('trust proxy');

const { verify } = require('./functions/jwt-functions');
const { addUser } = require('./functions/user-functions');

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
let redirect;

if (app.get('env') === 'development') {
  redirect = process.env.REDIR1;
  const morgan = require('morgan');
  app.use(morgan('dev'));
}
else {
  redirect = process.env.REDIR2;
}

app.get('/', (req, res) => {
  res.clearCookie('displayName');
  res.clearCookie('userID');
  res.clearCookie('token');

  res.render('home');
});

app.get('/authenticate', (req, res) => {
  const state = uuidv4();

  const redirectURL = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${client_id}&redirect_uri=${redirect}&scope=profile&state=${state}`;

  res.redirect(redirectURL);
});

app.get('/oauth', (req, res) => {
  const { code } = req.query;
  const oAuthTokenURL = 'https://oauth2.googleapis.com/token';
  // console.log(code);

  if (code) {
    let config = {
      headers: {
        withCredentials: true,
      },
    };

    const data = {
      code: `${code}`,
      client_id: `${client_id}`,
      client_secret: `${client_secret}`,
      redirect_uri: `${redirect}`,
      grant_type: 'authorization_code',
    };

    axios
      .post(oAuthTokenURL, data, config)
      .then((postRes) => {
        const { access_token, id_token } = postRes.data;
        // console.log(postRes.data);

        config = {
          headers: {
            Authorization: `Bearer ${access_token}`,
            withCredentials: true,
          },
        };

        const peopleURL = 'https://people.googleapis.com/v1/people/me?personFields=names';

        axios
          .get(peopleURL, config)
          .then((response) => {
            const { displayName } = response.data.names[0];
            res.cookie('displayName', displayName);

            res.cookie('token', id_token);
            verify(id_token)
              .then((userID) => {
                res.cookie('userID', userID);
                res.redirect('/success');
              })
              .catch((e) => {
                console.log(e);
              });
          })

          .catch((e) => {
            // eslint-disable-next-line no-console
            console.log(e);
            res.redirect('/error');
          });
      })

      .catch((e) => {
        // eslint-disable-next-line no-console
        console.log(e);
        res.redirect('/error');
      });
  }
  else {
    res.redirect('/');
  }
});

app.get('/success', (req, res) => {
  const { displayName, userID, token } = req.cookies;
  addUser(userID, displayName);
  res.render('oauth', { displayName, userID, token });
});

app.get('/error', (req, res) => {
  res.clearCookie('displayName');
  res.clearCookie('userID');
  res.clearCookie('token');

  res.render('errorPage');
});

app.use('/users', require('./routes/users'));
app.use('/cargo', require('./routes/cargo'));
app.use('/boats', require('./routes/boats'));

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${PORT}...`);
});
