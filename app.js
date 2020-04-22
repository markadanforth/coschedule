const express = require('express');
const fetch = require('node-fetch');
const pug = require('pug');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const port = process.env.PORT || 3000;

app.use('/static', express.static('css'))
app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use(session({
  'secret': 'coschedule',
  resave: false,
  saveUninitialized: true,
}));

app.engine('pug', require('pug').__express);
app.set('view engine', 'pug');

var db = mysql.createConnection({
  host       : 'localhost',
  user       : 'coschedule',
  password   : 'coschedule',
  //database   : 'coschedule' // <-----uncomment this after database created
});

// api key needed for theCatApi
const apikey = {
  'x-api-key': 'af36ddc9-7f16-4984-a731-83d235e5a365'
};

//---------------------LOGIC STARTS HERE------------------------------>
const getUrl = (key) => {
  urls = {
    default: 'https://api.thecatapi.com/v1/images/search',
    category: 'https://api.thecatapi.com/v1/images/search?category_ids=',
    breed: 'https://api.thecatapi.com/v1/images/search?breed_ids=',
    breedList: 'https://api.thecatapi.com/v1/breeds',
    categoryList: 'https://api.thecatapi.com/v1/categories'
  }
  return (urls[key] || urls['default']);
};

// fetch on user specified url with appended apiKey
const getApi = (url) => {
  return fetch(url, {headers: apikey});
};

// render the page for each url request
const renderPage = async (req,res,next) => {
  try {
    const key = Object.keys(req.params);
    const value = Object.values(req.params);

    const a = getApi(getUrl(key) + value);
    const b = getApi(getUrl("categoryList"));
    const c = getApi(getUrl("breedList"));

    const x = await Promise.all([a,b,c]);
    const y = x.map(x => x.json());
    const [url,category,breed] = y.map(x => x.then(z => {return z}));

    // get url object from api
    const z = await url.then(v => v.map(s => {return s}));
    
    // store image and id in session
    req.session.imgUrl = z[0].url;
    req.session.imgId = z[0].id;

    // get favorites from database
    const sql = 'SELECT * FROM favorites WHERE user_id = ?';
    favorites = db.query(sql, [req.session.userId], (error, result) => {
      if (error) throw error;
      req.session.favorites = result.map(x => {return x});
    });

    // get comments from database
    const commentSql = 'SELECT * FROM comments WHERE user_id = ? LIMIT 1';
    db.query(commentSql, [req.session.userId], (error, result) => {
      if (error) throw error;
      req.session.comment = result.map(x => {return x});
    });

    // render the actual show page
    res.render('show-cat', {
      cat: z,
      categories: await category,
      breeds: await breed,
      favoriteList: req.session.favorites 
    });

  } catch(err) {
    console.log(err);
  }
  next();
};

const filterRequest = (req,res,next) => {
  const arr = Object.entries(req.body);
  const results = arr.filter(x => {if (x[1] != "") {return x}});

  if (results[0]) {res.redirect('/' + results[0][0] + '/' + results[0][1])}
  else {res.redirect('/')}
  next();
};

const isAuth = async (req,res,next) => {
  if(!req.session.authenticated) {
    res.redirect('/login');
  } else {
    next();
  }
};

const processLogin = (req,res) => {
  // if submit button has value register run this code
  if (req.body.register) {
    // hash form submitted password
    bcrypt.hash(req.body.password, 10, (err, hash) => {
      // add user to db; username must be unique
      const sql = 'INSERT INTO users SET username = ?, user_password = ?'
      db.query(sql, [req.body.username, hash], (error, results) => {
        if (error) throw error;
        console.log(`user ${req.body.username} created successfully`);
        res.redirect('/login');
      });
    });
  // if submit button has value login run this code
  } else if (req.body.login) {
    // get user from db
    const sql = 'SELECT * FROM users WHERE username = ?';
    db.query(sql, [req.body.username], (error, result) => {
      if (error) throw error;
      req.session.userId = result[0].user_id;
      req.session.username = result[0].username;
      // compare db password with form submitted password
      bcrypt.compare(req.body.password, result[0].user_password, (error, result) => {
        if (error) throw error;
        if (result) {
          // if authorized set cookie and redirect to cat page
          req.session.authenticated = true;
          res.redirect('/');
        } else {
          console.log('wrong password try again');
          res.redirect('/login');
        }
      });
    });
  } else {
    res.redirect('/login');
  }
}

// -------------------------ROUTES START HERE------------------------------>

// database routes

// create comments table
app.get('/createCommentsTable', (req,res) => {
  const x = ' \
  CREATE TABLE IF NOT EXISTS comments ( \
    comment_id INT AUTO_INCREMENT PRIMARY KEY, \
    comment VARCHAR(255) NOT NULL, \
    imgId VARCHAR(255) NOT NULL, \
    user_id INT NOT NULL, \
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP \
  ) ENGINE = INNODB';

  db.query(x, (err,result) => {
    if(err) throw err;
    console.log(result);
  });
  res.redirect('/login');
});

// create favorites table
app.get('/createFavoritesTable', (req,res) => {
  const x = ' \
  CREATE TABLE IF NOT EXISTS favorites ( \
    favorite_id INT AUTO_INCREMENT PRIMARY KEY, \
    imgUrl VARCHAR(255) NOT NULL, \
    imgId VARCHAR(255) NOT NULL, \
    user_id INT NOT NULL, \
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP \
  ) ENGINE = INNODB';

  db.query(x, (err,result) => {
    if(err) throw err;
    console.log(result);
  });
  res.redirect('/login');
});

// create users table
app.get('/createUsersTable', (req,res) => {
  const x = ' \
  CREATE TABLE IF NOT EXISTS users ( \
    user_id INT AUTO_INCREMENT PRIMARY KEY, \
    username VARCHAR(255) NOT NULL UNIQUE, \
    user_password VARCHAR(255) NOT NULL, \
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP \
  ) ENGINE = INNODB';

  db.query(x, (err,result) => {
    if(err) throw err;
    console.log(result);
  });
  res.redirect('/login');
});

// creates the database for the app
app.get('/createdb', (req,res) => {
  const x = 'CREATE DATABASE coschedule';
  db.query(x, (err,result) => {
    if(err) throw err;
    console.log(result);
  });
});

// user routes

// logout user
app.get('/logout', (req,res) => {
  req.session.destroy();
  req.session = null; 
  res.redirect('/');
})
//login user processing
app.post('/login', processLogin);
// show login page
app.get('/login', (req,res) => {
  res.render('login');
});

//--------------MUST LOGIN TO USE ROUTES BELOW------------------------->

app.use(isAuth);

// comments routes

// create a comment
app.post('/comment/create/:imgId', (req,res) => {
  const sql = 'SELECT comment FROM comments WHERE user_Id = ? AND imgId = ?';
  const a = req.params.imgId;
  const b = req.session.userId;
  db.query(sql, [b,a], (error, results) => {
    if (error) throw error;

    // checks if comment in DB already
    if  (Array.isArray(results) && results.length) 
    {
      // update a comment
      const updateSql = "UPDATE comments SET comment = ? WHERE user_id = ? and imgId = ?";
      const c = req.body.comment; 
      db.query(updateSql, [c,b,a], (err, result) => {
        if (err) throw err;
        console.log(result.affectedRows + " record(s) updated");
        res.redirect('/');
      });
    } 
    else 
    {
      //enter comment into database
      const insertSql = 'INSERT INTO comments SET imgId = ?, user_Id = ?, comment = ?';
      const c = req.body.comment; 
      db.query(insertSql, [a,b,c], (error, results) => {
        if (error) throw error;
        console.log(`${req.session.username} comment created successfully.`);
        res.redirect('/');
      });
    }
  });
});

// favorites routes

//delete a favorite
app.post('/favorites/delete/:imgId', (req,res) => {
  const sql = "DELETE FROM favorites WHERE imgId = ? and user_id = ?";
  db.query(sql, [req.params.imgId, req.session.userId], (err, result) => {
    if (err) throw err;
    console.log(`${req.session.username} deleted: ` + result.affectedRows + ' favorite.');
    res.redirect('/');
  });
});

//create a favorite
app.post('/favorites/create', (req,res) => {
  const sql = 'INSERT INTO favorites SET imgUrl = ?, imgId = ?, user_Id = ?';
  const a = req.session.imgUrl;
  const b = req.session.imgId;
  const c = req.session.userId;
  db.query(sql, [a,b,c], (error, results) => {
    if (error) throw error;
    console.log(`${req.session.username} favorite created successfully.`);
    res.redirect('/');
  });
});

// post show a favorite
app.post('/favorites/show/:imgId', (req,res) => {
  const x = req.session.favorites
              .filter(x => {if (x.imgId === req.params.imgId) {return x}});

  const arr = req.session.comment;

  res.render('show-favorite', {
    name: req.session.username,
    image: x[0].imgUrl,
    imgId: x[0].imgId,
    comment: Array.isArray(arr) && arr.length ? req.session.comment[0].comment : ''
  });
});

// cats routes
app.post('/filter', filterRequest);
app.get('/category/:category', renderPage);
app.get('/breed/:breed', renderPage);
app.get('/', renderPage);

app.listen(port, () =>
  console.log(`listening on port: ${port}`));