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
    );


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
    );
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
    res.status(405).send({success: false, msg: 'Unsupported method.'});
    res.send(body);
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
    res.status(405).send({success: false, msg: 'Unsupported method.'});
});

//Define GET method for movies
//router.get('/movies', function(req, res) {
    
//Define POST method for movies
//Define PUT method for movies
//Define DELETE method for movies

//All other methods should return 405 unsupported method
router.all('/movies', function(req, res) {
    res.status(405).send({success: false, msg: 'Unsupported method.'});
    res.send(body);
});
app.use('/', router);
app.listen(process.env.PORT || 8080);
