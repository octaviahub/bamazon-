
const mysql = require("mysql");
const inquirer = require("inquirer");
require("console.table");

const connection = mysql.createConnection({
  host: "localhost",
  port: 3306,

  
  user: "root",

  password: "",
  database: "bamazon"
});


connection.connect(function(err) {
  if (err) {
    console.error("error connecting: " + err.stack);
  }
  loadManagerMenu();
});

// Get product data from the database
function loadManagerMenu() {
  connection.query("SELECT * FROM products", function(err, res) {
    if (err) throw err;

    
    loadManagerOptions(res);
  });
}


function loadManagerOptions(products) {
  inquirer
    .prompt({
      type: "list",
      name: "choice",
      choices: ["View Products for Sale", "View Low Inventory", "Add to Inventory", "Add New Product", "Quit"],
      message: "What would you like to do?"
    })
    .then(function(val) {
      switch (val.choice) {
        case "View Products for Sale":
          console.table(products);
          loadManagerMenu();
          break;
        case "View Low Inventory":
          loadLowInventory();
          break;
        case "Add to Inventory":
          addToInventory(products);
          break;
        case "Add New Product":
          addNewProduct(products);
          break;
        default:
          console.log("Goodbye!");
          process.exit(0);
          break;
      }
    });
}


function loadLowInventory() {
  
  connection.query("SELECT * FROM products WHERE stock_quantity <= 5", function(err, res) {
    if (err) throw err;
   
    console.table(res);
    loadManagerMenu();
  });
}

// Prompt the manager for a product to replenish
function addToInventory(inventory) {
  console.table(inventory);
  inquirer
    .prompt([
      {
        type: "input",
        name: "choice",
        message: "What is the ID of the item you would you like add to?",
        validate: function(val) {
          return !isNaN(val);
        }
      }
    ])
    .then(function(val) {
      const choiceId = parseInt(val.choice);
      const product = checkInventory(choiceId, inventory);

      if (product) {
      
        promptManagerForQuantity(product);
      }
      else {
        
        console.log("\nThat item is not in the inventory.");
        loadManagerMenu();
      }
    });
}

// Ask for the quantity that should be added to the chosen product
function promptManagerForQuantity(product) {
  inquirer
    .prompt([
      {
        type: "input",
        name: "quantity",
        message: "How many would you like to add?",
        validate: function(val) {
          return val > 0;
        }
      }
    ])
    .then(function(val) {
      const quantity = parseInt(val.quantity);
      addQuantity(product, quantity);
    });
}

function addQuantity(product, quantity) {
  connection.query(
    "UPDATE products SET stock_quantity = ? WHERE item_id = ?",
    [product.stock_quantity + quantity, product.item_id],
    function(err, res) {
     
      console.log("\nSuccessfully added " + quantity + " " + product.product_name + "'s!\n");
      loadManagerMenu();
    }
  );
}


function addNewProduct() {
  getDepartments(function(err, departments) {
    getProductInfo(departments).then(insertNewProduct);
  });
}

function getProductInfo(departments) {
  return inquirer.prompt([
    {
      type: "input",
      name: "product_name",
      message: "What is the name of the product you would like to add?"
    },
    {
      type: "list",
      name: "department_name",
      choices: getDepartmentNames(departments),
      message: "Which department does this product fall into?"
    },
    {
      type: "input",
      name: "price",
      message: "How much does it cost?",
      validate: function(val) {
        return val > 0;
      }
    },
    {
      type: "input",
      name: "quantity",
      message: "How many do we have?",
      validate: function(val) {
        return !isNaN(val);
      }
    }
  ]);
}

// Adds new product to the db
function insertNewProduct(val) {
  connection.query(
    "INSERT INTO products (product_name, department_name, price, stock_quantity) VALUES (?, ?, ?, ?)",
    [val.product_name, val.department_name, val.price, val.quantity],
    function(err, res) {
      if (err) throw err;
      console.log(val.product_name + " ADDED TO BAMAZON!\n");
      
      loadManagerMenu();
    }
  );
}


function getDepartments(cb) {
  connection.query("SELECT * FROM departments", cb);
}

function getDepartmentNames(departments) {
  return departments.map(function(department) {
    return department.department_name;
  });
}

function checkInventory(choiceId, inventory) {
  for (let i = 0; i < inventory.length; i++) {
    if (inventory[i].item_id === choiceId) {
     
      return inventory[i];
    }
  }
  // Otherwise return null
  return null;
}
