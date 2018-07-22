var mysql = require("mysql");
var inquirer = require('inquirer');
var Table = require('cli-table');

// var ui = new inquirer.ui.BottomBar();


var connection = mysql.createConnection({
    host: "localhost",
  
    // Your port; if not 3306
    port: 3307,
  
    // Your username
    user: "root",
  
    // Your password
    password: "mace00",
    database: "bamazon"
  });

  connection.connect(function(err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
    showData();
  });

  function showData(){

    connection.query("SELECT products.department_name FROM products GROUP BY products.department_name", function(err, res) {
        if (err) throw err;
        // console.log(res);
        var departmentArray = [];

        for (var i =0; i < res.length ; i++){
            // console.log(res[i].department_name);
            departmentArray.push(res[i].department_name)
        }
        // console.log(departmentArray);

  inquirer
  .prompt([
    {
      type: 'list',
      name: 'department',
      message: 'Which department would you like to buy from?',
      choices: departmentArray
    },
  ])
  .then(answers => {
    // console.log(JSON.stringify(answers, null, '  '));
    var departmentSelection = answers.department
    console.log('You selected: '+ departmentSelection);
    showproducts(departmentSelection);
  })

      });

  }

  function showproducts(department){
    connection.query("SELECT * FROM products WHERE products.department_name = ?",[department], function(err, res) {
        if (err) throw err;
        // console.log('*****Product Listing Start*****');
        var table = new Table({
            head: ['ID', 'Product Name','Price($)','Stock']
          , colWidths: [5,35,10,10]
        });
        for(var i=0; i<res.length;i++){
            table.push([res[i].id, res[i].product_name , res[i].price,res[i].stock_quantity]);
        }

        console.log(table.toString());

        // console.log('*****Product Listing End*****');
        

        inquirer
  .prompt([
    {
      type: 'name',
      name: 'id',
      message: 'Which product would you like to buy - enter product ID ?'
    },
    {
        type: 'name',
        name: 'quantity',
        message: 'Enter # units you wish to purchase ?'
      }
  ])
  .then(answers => {
    // console.log(JSON.stringify(answers, null, '  '));
    var prodid = answers.id;
    var quantity= answers.quantity;
    // console.log('ID Selected:'+prodid);
    // console.log('Quantity required:'+quantity);
    processOrder(prodid,quantity);
  })
    });
  }

  function processOrder(id,quantity){

    // console.log('ID Selected:'+id);
    // console.log('Quantity required:'+quantity);

    connection.query("SELECT * FROM products WHERE products.id = ?",[id], function(err, res) {
        if (err) throw err;
        // console.log(res);
        var stock = parseInt(res[0].stock_quantity);
        var quantityRequired = parseInt(quantity);
        // console.log(stock + 'is of type'+ typeof(stock));
        // console.log(quantityRequired + 'is of type'+ typeof(quantityRequired));

        if (quantityRequired > stock){
            console.log("Sorry! Insufficient quantity..The max items we have in stock is "+stock);
            connection.end();
        } else {
            var stockRemain = stock - quantityRequired;
            // console.log('StockRemain'+stockRemain);
            var query = 'UPDATE products SET products.stock_quantity = ? WHERE id =  ?';
            if (stockRemain > 0){
                connection.query(query, [stockRemain, id], function (err, res){
                if (err) throw err;
                presentInvoice(id,quantityRequired);
                });
            } else {
                stockRemain = 0;
                connection.query(query, [stockRemain, id], function (err, res){
                    if (err) throw err;
                    presentInvoice(id,quantityRequired);
                    });

            }
            

            }
        });
        
        
    }

    function presentInvoice(id,quantityRequired){
       
            console.log("Your order has been processed sucessfully! ");
            console.log('****Invoice Start****');

        connection.query("SELECT * FROM products WHERE products.id = ?",[id], function(err, res) {
            if (err) throw err;

            var price = parseFloat(res[0].price);
                
                var cost = parseFloat(quantityRequired * price).toFixed(2);

                var table = new Table({
                    head: ['Product Name','Quantity','Price/Unit($)','Total($)']
                  , colWidths: [35,10,15,10]
                });
                
                table.push([res[0].product_name , quantityRequired, price,cost]);
                console.log(table.toString());

                console.log('****updated products data****');

                table2 = new Table({
                    head: ['Product ID','Product Name','Quantity Remain']
                  , colWidths: [10,35,20]
                });
                table2.push([res[0].id , res[0].product_name, res[0].stock_quantity]);
                console.log(table2.toString());

                connection.end();
        });
    }

  



