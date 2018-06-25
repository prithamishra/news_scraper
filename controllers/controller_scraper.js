var express = require("express");
var router = express.Router();
var request = require("request");
var cheerio = require("cheerio");
var mongoose = require("mongoose");

mongoose.Promise = Promise;

var Note = require("../models/Note.js");
var Article = require("../models/Article.js");

router.get("/", function(req, res) {
  res.render("index");
});

router.get("/savedarticles", function(req, res) {
  Article.find({}, function(error, doc) {
    if (error) {
      console.log(error);
    }
    else {
      var hbsArticleObject = {
        articles: doc
      };
      res.render("savedarticles", hbsArticleObject);
    }
  });
});

router.post("/scrape", function(req, res) {
  request("http://www.nytimes.com/", function(error, response, html) {
    var $ = cheerio.load(html);
    var scrapedArticles = {};
    $("article h2").each(function(i, element) {
      var result = {};
      result.title = $(this).children("a").text();
      result.link = $(this).children("a").attr("href");
      scrapedArticles[i] = result;
    });
    var hbsArticleObject = {
        articles: scrapedArticles
    };
    res.render("index", hbsArticleObject);
  });
});

router.post("/save", function(req, res) {
  console.log("This is the title: " + req.body.title);
  var newArticleObject = {};
  newArticleObject.title = req.body.title;
  newArticleObject.link = req.body.link;
  var savingArticle = new Article(newArticleObject);
  console.log("Article Saved " + savingArticle);
  savingArticle.save(function(err, doc) {
    if (err) {
      console.log(err);
    }
    else {
      console.log(doc);
    }
  });
  res.redirect("/savedarticles");
});

router.get("/delete/:id", function(req, res) {
  Article.findOneAndRemove({"_id": req.params.id}, function (err, offer) {
    if (err) {
      console.log("ERROR:" + err);
    } else {
      console.log("DELETED");
    }
    res.redirect("/savedarticles");
  });
});

router.get("/notes/:id", function(req, res) {
  Note.findOneAndRemove({"_id": req.params.id}, function (err, doc) {
    if (err) {
      console.log("ERROR:" + err);
    } else {
      console.log("DELETED");
    }
    res.send(doc);
  });
});

router.get("/articles/:id", function(req, res) {
  Article.findOne({"_id": req.params.id})
  .populate('notes')
  .exec(function(err, doc) {
    if (err) {
      console.log("ERROR finding article");
    }
    else {
      console.log("No Articles found" + doc);
      res.json(doc);
    }
  });
});

router.post("/articles/:id", function(req, res) {
  var newNote = new Note(req.body);
  newNote.save(function(error, doc) {
    if (error) {
      console.log(error);
    } 
    else {
      Article.findOneAndUpdate({ "_id": req.params.id }, {$push: {notes: doc._id}}, {new: true, upsert: true})
      .populate('notes')
      .exec(function (err, doc) {
        if (err) {
          console.log("Error:" + err);
        } else {
          console.log("Notes " + doc.notes);
          res.send(doc);
        }
      });
    }
  });
});
module.exports = router;