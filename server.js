const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const cheerio = require("cheerio");
const handlebars = require("express-handlebars");
const logger = require("morgan");

const db = require("./models");
const PORT = process.env.PORT || 3000;


let MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);

const app = express();

app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// A GET route for scraping the echoJS website
app.get("/scrape", (req, res) => {
    axios.get("http://www.echojs.com/").then(response => {
      const $ = cheerio.load(response.data);
  
      $("article h2").each(function(i, element) {
        const result = {};
  
        result.title = $(this)
          .children("a")
          .text();
        result.link = $(this)
          .children("a")
          .attr("href");
  
        db.Article.create(result)
          .then(dbArticle => {
            console.log(dbArticle);
          })
          .catch(function(err) {
            console.log(err);
          });
      });
  
      res.send("Scrape Complete");
    });
  });
  
  // Route for getting all Articles from the db
  app.get("/articles", (req, res) => {
    // Grab every document in the Articles collection
    db.Article.find({})
      .then(dbArticle => {
        res.json(dbArticle);
      })
      .catch(err => {
        res.json(err);
      });
  });
  
  // Route for grabbing a specific Article by id, populate it with it's note
  app.get("/articles/:id", (req, res) => {
    db.Article.findOne({ _id: req.params.id })
      .populate("note")
      .then(dbArticle => {
        res.json(dbArticle);
      })
      .catch(err => {
        res.json(err);
      });
  });
  
  // Route for saving/updating an Article's associated Note
  app.post("/articles/:id", (req, res) => {
    db.Note.create(req.body)
      .then(dbNote => {
        return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
      })
      .then(dbArticle => {
        res.json(dbArticle);
      })
      .catch(err => {
        res.json(err);
      });
  });
  
  // Start the server
  app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });