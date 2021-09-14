const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');
mongoose.set('useFindAndModify', false);

// app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-kamal:test123@cluster0.wozip.mongodb.net/todolistDB?retryWrites=true&w=majority",
{useNewUrlParser : true, useUnifiedTopology:true});

const itemSchema = new mongoose.Schema({
  name : String
});

const Item = mongoose.model("item",itemSchema);

const item1 = new Item({
  name : "Starting Tasks"
});

const item2 = new Item({
  name : "Add Something"
});

const item3 = new Item({
  name : "Delete Task"
});

const defaultItems = [item1,item2,item3];

const listSchema = new mongoose.Schema({
  name : String,
  items : [itemSchema]
});

const List = mongoose.model("list",listSchema);

app.get('/favicon.ico', function(req, res) { 
  res.sendStatus(204); 
});

app.get("/", function(req, res) {

  Item.find({},function(err,foundItems){

    if(foundItems.length === 0) {
      Item.insertMany(defaultItems,function(err){
        if(err){
          console.log(err);
        }else {
          console.log("Successfully Saved.");
        }
      });
      res.redirect("/");
    }else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
    
  });  

});

app.get("/:customList",function(req,res){

  const customListName = _.capitalize(req.params.customList);

  List.findOne({name : customListName},function(err,foundList){
    if(!err){
      if(!foundList){
        list = new List({
          name : customListName,
          items : defaultItems
        });     
        list.save();
        res.redirect("/" + customListName);
      }else{
        res.render("list",{listTitle : foundList.name, newListItems : foundList.items});
      }
    }
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name : itemName
  });

  if(listName === "Today") {
    item.save();
    res.redirect("/");
  }else {   
    List.findOne({name : listName},function(err,foundList){      
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);      
    });
  } 
  
});

app.post("/delete",function(req,res){

  const checkedItemId = req.body.checkedbox;
  const listName = req.body.listName;
  
  if(listName === "Today") {
    Item.findOneAndDelete({_id : checkedItemId},function(err){
      if(!err){
        console.log("Successfully removed.");
      }
    });
  
    res.redirect("/");
  }else {
    List.findOneAndUpdate({name : listName},{$pull : {items : {_id : checkedItemId}}},function(err,foundList){
      if(!err){
        res.redirect("/"+listName);
      }
    });
  }
  
});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started Successfully.");
});
