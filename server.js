var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
db = require('./db')(); //global hack
var jwt = require('jsonwebtoken');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.text({
    type: function(req) {
        return 'text';
    }
}));

app.use(passport.initialize());

var router = express.Router();
//Generic GET and POST for root.
router.all('/', function(req, res) {
    console.log(req.body);
    res = res.status(403).send({success: false, msg: 'Requests not permitted on the root page.'});
});

router.route('/post')
    .post(authController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            res.send(req.body);
        }
    )
    .all(function(req, res) {
        console.log(req.body);
        res.status(405).send({success: false, msg: 'Unsupported method.'});
    });

router.route('/postjwt')
    .post(authJwtController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            res.send(req.body);
        }
    )
    .all(function(req, res) {
        console.log(req.body);
        res.status(405).send({success: false, msg: 'Unsupported method.'});
//Define POST method for signup
router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please pass username and password.'});
    } else {
        var newUser = {
            username: req.body.username,
            password: req.body.password
        };
        // save the user
        db.save(newUser); //no duplicate checking
        res.json({success: true, msg: 'Successful created new user.'});
    }
});

//All other methods should return 405 unsupported method
router.all('/signup', function(req, res) {
    console.log(req.body);
    res.status(405).send({success: false, msg: 'Unsupported method.'});
});

//Define POST method for signin
router.post('/signin', function(req, res) {

        var user = db.findOne(req.body.username);
        //In a production environment, a generic "wrong credentials" message would be more secure.
        //But for testing purposes it's good to be able to differentiate wrong user vs wrong password
        if (!user) {
            res.status(401).send({success: false, msg: 'Authentication failed. User not found.'});
        }
        else {
            // check if password matches
            if (req.body.password == user.password)  {
                var userToken = { id : user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed. Wrong password.'});
            }
        };
});

//All other methods should return 405 unsupported method
router.all('/signin', function(req, res) {
    console.log(req.body);
    res.status(405).send({success: false, msg: 'Unsupported method.'});
});

router.route('/movies')
//Define GET method for movies
    .get(function(req, res) {
        res.json({status: 200, msg: 'Get the list of movies', headers: req.headers, query: req.query, env: process.env.UNIQUE_KEY});
    })

    //Define POST method for movies
    .post(function(req, res) {
    console.log(req.body);
    res.json({status: 200, msg: 'Created a new movie', headers: req.headers, query: req.query, env: process.env.UNIQUE_KEY});
    })

    //Define PUT method for movies
    .put(authJwtController.isAuthenticated, function(req, res) {
        //Authentication required for this. JWT for PUT.
        console.log(req.body)
        if(req.get('Content-Type')) {
            res.json({status: 200, msg: 'Saved a new movie.', headers: req.headers, query: req.query, env: process.env.UNIQUE_KEY});
        }
    
    })

    //Define DELETE method for movies
    .delete(authController.isAuthenticated, function(req, res) {
        //Authentication required. Basic auth for DELETE
        //Using a generic "user or password incorrect" to mimic what an actual site would do.
        console.log(req.body);
        res = res.status(200);
        if(req.get('Content-Type')) {
            res.json({status: 200, msg: 'Deleted a movie.', headers: req.headers, query: req.query, env: process.env.UNIQUE_KEY});
        
        }
    });

//All other methods should return 405 unsupported method
router.all('/movies', function(req, res) {
    res.status(405).send({success: false, msg: 'Unsupported method.'});
});

app.use('/', router);
app.listen(process.env.PORT || 8080);
