var express    = require('express');
var app        = express();
var mysql      = require('mysql');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var session = require('express-session');
var cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(session({secret: "chickenparm"}));
// app.use(express.json());
// app.use(express.urlencoded());
// app.use(app.router);

//ignore above for now
app.use(express.static('public'));
let transport = nodemailer.createTransport({
    host: 'smtp.mailtrap.io',
    port: 2525,
    auth: {
       user: '68c892b9b024dd',
       pass: '99eb97ffa70b2c'
    }
});

const fs = require('fs');

var connection = mysql.createConnection({
    host     : 'natcha-do-user-7221885-0.a.db.ondigitalocean.com',
    user     : 'doadmin',
    port: '25060',
    password : 'x9oksbfxzjuit4n6',
    database : 'defaultdb',
    connectTimeout: 30000,
    multipleStatements: true
});

connection.connect((err) => {
    if (err) {
        console.log('Connection error message: ' + err.message);
        return;
    }
    console.log('Connected!')
});

// app.get('/', function (req,res) {
//     res.send('Hello World!')
// })
app.get('/main/', urlencodedParser, function(req, res, next) {
    //console.log(req.body.menuid);
    
    var menuids = "";
    var queries = "";
    //var sql1 = "SELECT * FROM `restaurant-schema`.`menu-items` WHERE `menu-id` = ('"+menuids+"')";  
  var sql = mysql.format("SELECT `restaurant-schema`.menu.`menu-id` FROM `restaurant-schema`.menu WHERE `primary` = 1");

  connection.beginTransaction(function(err) {
    if (err) { throw err; }
    connection.query(sql, function(err, result) {
      if (err) { 
        connection.rollback(function() {
          throw err;
        });
      }
      menuids = result;
    

    for(var i = 0; i < menuids.length; i++){
        // console.log(menuids[i]["menu-id"]);
        queries += mysql.format("SELECT * FROM `restaurant-schema`.menu WHERE `menu-id` = ('"+menuids[i]["menu-id"]+"');");
        queries += mysql.format("SELECT * FROM `restaurant-schema`.`menu-items` WHERE `menu-id` = ('"+menuids[i]["menu-id"]+"');");
    };

  connection.query(queries, function(err, result)  {
    if (err) { 
        connection.rollback(function() {
          throw err;
        });
      }
   res.send(result);
   });
});
});
})
app.get('/location/', function (req, res) {    
    res.send('https://www.google.com/maps/place/Fresh+Market/@32.8223808,-96.9875728,11z/data=!4m8!1m2!2m1!1sfresh+market!3m4!1s0x864e9c17b1dc3141:0x9e04745ef18f024f!8m2!3d32.8223808!4d-96.8474971');  
})
app.get('/coupon/', urlencodedParser, function(req, res, next){    

    var sql = "SELECT * FROM `restaurant-schema`.coupon WHERE `coupon-id` = '"+req.body.couponid+"';"
    connection.query(sql, function(err, result)  {
        if(err) throw err;
        if(result.length < 1) res.send("There is no coupon with that ID");
        else res.send(result);
         });
})
app.post('/add-coupon', urlencodedParser, function(req, res, next){
    var sql = "INSERT INTO `restaurant-schema`.coupon(`coupon-code`,`coupon-image`) VALUES ('"+req.body.couponcode+"','"+req.body.couponimage+"')";
    connection.query(sql, function(err, result)  {
     if(err) throw err;
     res.send("coupon created");
      });
})
app.post('/contact/', urlencodedParser, function(req, res, next) {    
    var message = {
        from: req.body.email, // Sender address
        to: 'emails.freshmarket@gmail.com',         // List of recipients
        subject: 'Website Comment '+req.body.name+'', // Subject line
        text: ''+req.body.content+'' // Plain text body
    };
    if(req.body.mailinglistoption == true) message.text += ' \n\nI want to be on the mailing list';
    transport.sendMail(message, function(err, info) {
        if (err) {
          console.log(err)
        } else {
          console.log(info);
        }
    });  
    res.send("Message Sent!");
})
app.get('/admin-menu/', urlencodedParser, function(req, res, next) {
    //console.log(req.body.menuid);
    
  var amenus = "";
  var sql1 = "SELECT * FROM `restaurant-schema`.`menu-items`";  
  var sql = "SELECT * FROM `restaurant-schema`.menu";
  var queries = mysql.format( ""+sql+" ; "+sql1+"");
  connection.query(queries, function(err, result)  {
    if(err) throw err;
    res.send(result);
    }); 

})
app.post('/add-menu/',urlencodedParser, function(req, res, next) {
    // console.log(req.body.menuday);
    // console.log(req.body.menudayid);
    
  var sql = "INSERT INTO `restaurant-schema`.menu(`menu-day`,`menu-day-id`) VALUES ('"+req.body.menuday+"','"+req.body.menudayid+"')";
  connection.query(sql, function(err, result)  {
   if(err) throw err;
   res.send("menu created");
    });
})
app.post('/save-menu/', urlencodedParser, function(req, res, next) {
    // console.log(req.body.menuid);
  var queries = "";  


   for(var i = 0; i < req.body.menu.length; i++){
       queries += mysql.format("INSERT INTO `restaurant-schema`.`menu-items`(`menu-id`,`food-id`,`food-location-id`) VALUES ('"+req.body.menuid+"','"+req.body.menu[i].foodid+"','"+req.body.menu[i].location+"');")
   };

  var sql = "DELETE FROM `restaurant-schema`.`menu-items` WHERE `menu-id` = ('"+req.body.menuid+"')";
  connection.query(sql, function(err, result)  {
    if(err) throw err;
    
     }); 
  connection.query(queries, function(err, result)  {
   if(err) throw err;
   res.send("menu items saved");
    }); 
})
app.post('/add-item/',urlencodedParser, function(req, res, next) {
    // console.log(req.body.foodname);
    // console.log(req.body.categoryid);
    
  var sql = "INSERT INTO `restaurant-schema`.`food-items`(`food-name`,`category-id`) VALUES ('"+req.body.foodname+"','"+req.body.categoryid+"')";
  connection.query(sql, function(err, result)  {
   if(err) throw err;
   res.send("item created");
    });
})
app.post('/add-category/',urlencodedParser, function(req, res, next) {
    // console.log(req.body.foodid);

    var check = "SELECT * FROM `restaurant-schema`.category WHERE `category-name` = '"+req.body.category+"'";
    connection.beginTransaction(function(err) {
        if (err) { throw err; }
        connection.query(check, function(err, result) {
          if (err) { 
            connection.rollback(function() {
               throw err;
            });

           
          }
         if(result.length > 1 ){res.send("Error: category already exists.");}
         else{
         var sql = "INSERT INTO `restaurant-schema`.`category`(`category-name`) VALUE('"+req.body.category+"')";

         connection.query(sql, function(err, result)  {

           if(err) throw err;

           res.send("Category created.");
         
        });
        }
    

    });
});

})
app.post('/admin-login/',urlencodedParser, function(req, res, next) {    
    //console.log(req.body.username);
    if(!req.body.username || !req.body.password){
        res.send("Please enter both username and password");
    } else {
        sql = "SELECT * FROM `restaurant-schema`.login WHERE (`user-name`,`user-password`) = ('"+req.body.username+"','"+req.body.password+"' ) ";
        connection.query(sql, function(err, result)  {
            if(err) throw err;
            if(result.length < 1){res.send("Invalid Username or Password.");}
            else{
                //req.session.user = admin;
                res.send("Welcome, "+req.body.username+"");
                //res.redirect('/admin-menu');
            }
        });
    }  
})
app.post('/admin-logout/', function (req, res) {   
    //req.session.destroy(function(){
        res.send("user has logged out.");
    // });
    //res.redirect('/menu');
})
app.post('/admin-reset-password/', urlencodedParser, function(req, res, next) {  
    var password = "";  
    var sql = "SELECT `restaurant-schema`.login.`user-password` FROM `restaurant-schema`.login WHERE (`user-name`) = ('"+req.body.username+"')";
        connection.query(sql, function(err, result)  {
            if(err) throw err;
            password = result;
        

    var message = {
        from: 'emails.freshmarket@gmail.com', // Sender address
        to: req.body.email,         // List of recipients
        subject: 'Password Reset ', // Subject line
        text: password[0]["user-password"] // Plain text body
    };
    transport.sendMail(message, function(err, info) {
        if (err) {
          console.log(err)
        } else {
          console.log(info);
        }
    });  
    res.send("Password Reset");
});

})
app.post('/delete-item/',urlencodedParser, function(req, res, next) {
    // console.log(req.body.foodid);

    var check = "SELECT * FROM `restaurant-schema`.`menu-items` WHERE `food-id` = "+req.body.foodid+"";
    connection.beginTransaction(function(err) {
        if (err) { throw err; }
        connection.query(check, function(err, result) {
          if (err) { 
            connection.rollback(function() {
               throw err;
            });

        }
          });
          


          if(result.length > 1 )res.send("Error: cannot delete until item is removed from all menus.");
          else{
            var sql = "DELETE FROM `restaurant-schema`.`food-items` WHERE `food-id` = "+req.body.foodid+"";

            connection.query(sql, function(err, result)  {
  
              if(err){res.send("Error: item does not exist")}
  
              res.send("item deleted");
            });
        }
    

    });

})

app.post('/delete-menu/', urlencodedParser, function(req, res, next) {
    // console.log(req.body.menuid);
    var check = "SELECT * FROM `restaurant-schema`.menu WHERE `menu-id` = '"+req.body.menuid+"'";
    connection.beginTransaction(function(err) {
        if (err) { throw err; }
        connection.query(check, function(err, result) {
          if (err) { 
            connection.rollback(function() {
               throw err;
            });
        }
          

          if(result < 1)res.send("Error: menu does not exist.");
          else{


  
    var sql1 = "DELETE FROM `restaurant-schema`.`menu-items` WHERE `menu-id` = ('"+req.body.menuid+"')";  
  var sql = "DELETE FROM `restaurant-schema`.`menu` WHERE `menu-id` = ('"+req.body.menuid+"')";
  connection.query(sql1, function(err, result)  {
    if(err) throw err;
    
     }); 
     connection.query(sql, function(err, result)  {
     if(err) throw err;
     res.send("menu and menu-items deleted");
    });
            }
});


});

})
app.post('/set-primary/', urlencodedParser, function(req, res, next) {
    // console.log(req.body.menuid);
  var menusid = req.body.menuid;
  var menudayid = "";  
  var sql0 = "SELECT `restaurant-schema`.menu.`menu-day-id` FROM `restaurant-schema`.menu WHERE `menu-id`='"+req.body.menuid+"'";
  connection.query(sql0, function(err, result)  {
    if(err) throw err;
        menudayid = "'"+result+"'";
     }); 
  var sql1 = "UPDATE `restaurant-schema`.menu SET `restaurant-schema`.menu.`primary` = 0 WHERE (`menu-day-id`,`primary`) = ('"+menudayid+"', 1)";  
  var sql = "UPDATE `restaurant-schema`.menu SET `restaurant-schema`.menu.`primary` = 1 WHERE `menu-id`= '"+req.body.menuid+"'";
  connection.query(sql1, function(err, result)  {
    if(err) throw err;
    
     }); 
  connection.query(sql, function(err, result)  {
   if(err) throw err;
   res.send("menu set to primary");
    });
})
app.get('/search/', urlencodedParser, function(req, res, next) {
    // console.log(req.body.search);
    
  
  var sql = "SELECT * FROM `restaurant-schema`.`food-items` WHERE `food-name` LIKE '%"+req.body.search+"%' LIMIT 5";
  connection.query(sql, function(err, result)  {
    if(err) throw err;
    if(result.length < 1) res.send("...");
    else res.send(result);
    }); 
})
app.get('/item-list/', urlencodedParser, function(req, res, next) {
    
    
  var sql = "SELECT * FROM `restaurant-schema`.`food-items`";
  connection.query(sql, function(err, result)  {
   if(err) throw err;
   if(result.length < 1) res.send("There are currently no food items");
   else res.send(result);
    });
})
app.get('/category-list/', urlencodedParser, function(req, res, next) {
    
    
    var sql = "SELECT * FROM `restaurant-schema`.`category`";
    connection.query(sql, function(err, result)  {
     if(err) throw err;
     if(result.length < 1) res.send("There are currently no categories");
     else res.send(result);
      });
})
app.get('/menu/', urlencodedParser, function(req, res, next) {
    // console.log(req.body.menuid);
    
  
  var sql1 = "SELECT * FROM `restaurant-schema`.`menu-items` WHERE `menu-id` = ('"+req.body.menuid+"')";  
  var sql = "SELECT * FROM `restaurant-schema`.`menu` WHERE `menu-id` = ('"+req.body.menuid+"')";


  var queries = mysql.format( ""+sql+" ; "+sql1+"");
  connection.query(queries, function(err, result)  {
   if(err) throw err;
   if(result.length < 1) res.send("There are currently no menus with that menuid");
   else res.send(result);
   });
})
  
//connection.end();

app.listen(3000, function () {
console.log('Example app listening on port 3000');
});
