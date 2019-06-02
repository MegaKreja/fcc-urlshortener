'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var dns = require("dns");
var bodyParser = require('body-parser');

const urlSchema = new mongoose.Schema({ 
  original_url: {
    type: String,
    required: true
  },
  short_url: {
    type: Number,
    default: 0,
    required: true
  }
});

const Url = mongoose.model("Url", urlSchema);

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.use(bodyParser.urlencoded({extended: 'false'}));
app.use(bodyParser.json());

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.post("/api/shorturl/new", (req, res, next) => {
  dns.lookup(req.body.url, (result, err) => {
    if(err) {
      return res.json({error: "invalid URL"})
    }
  })
  Url.findOne({original_url: req.body.url}).then(result => {
    if(result) {
      const {original_url, short_url} = result;
      return res.json({original_url, short_url});
    } else {
      Url.countDocuments({}).then(count => {
        const url = new Url({original_url: req.body.url, short_url: count + 1});
        url.save().then(result => {
          const {original_url, short_url} = result;
          return res.json({original_url, short_url})
        }).catch(err => console.log(err)) 
      })
    }
  }).catch(err => console.log(err))
})

app.get("/api/shorturl/:short_url", (req, res, next) => {
  const short_url = req.params.short_url;
  Url.findOne({short_url}).then(result => {
    res.redirect(result.original_url);
  })
})

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });

app.listen(port, function () {
  console.log('Node.js listening ...');
});