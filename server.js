require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
const shortid = require('shortid');
const { Schema } = mongoose;
const dns = require('dns');

mongoose.connect(process.env.DATABASE_URI, {useNewUrlParser: true, useUnifiedTopology: true });
// Basic Configuration
const port = process.env.PORT || 2000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', (req, res) => {
  res.json({ greeting: 'hello API' });
});

var ModelURL = mongoose.model('ModelURL', new Schema({
  short_url: String,
  original_url: String,
  fragment: String
}));

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


app.post('/api/shorturl/new', (req, res) => {
  const originalURL = req.body.url;
  const urlObject = originalURL.replace(/^https?:\/\//, '');
  dns.lookup(urlObject, (err) => {
    if (err) {
      res.json({error: 'invalid url'});
    }
  });
  let fragment = shortid.generate();
  let fixedURL = new ModelURL({
    short_url: __dirname + '/api/shorturl/' + fragment,
    original_url: originalURL,
    fragment: fragment
  })

  fixedURL.save((err, doc) => {
    if (err) return console.error(err);
    console.log("URL shortened successfully!", fixedURL);
    res.json({original_url: fixedURL.original_url, short_url: fixedURL.short_url, fragment: fixedURL.fragment})
  })
});

app.get('/api/shorturl/:fragment', (req, res) => {
  let inputURL = req.params.fragment;
  ModelURL.find({fragment: inputURL}).then((result) => {
    let newLink = result[0];
    console.log(newLink.original_url);
    res.redirect(newLink.original_url);
  })
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
