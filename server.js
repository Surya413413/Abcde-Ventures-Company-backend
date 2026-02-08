
const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt")
const {open} = require("sqlite");
const sqlite3 = require("sqlite3")
const jwt = require("jsonwebtoken")
const cors = require("cors")
const app = express()
app.use(express.json())
app.use(cors())

const dbpath = path.join(__dirname, "abcde.db");

let db = null;

const initialization = async () => {
    try{
        db = await open({
            filename:dbpath,
            driver: sqlite3.Database
        })
        app.listen(3000, ()=> {
            console.log("server running on 3000 port")
        })

    }catch(e){
        console.log(`error occurs in db: ${e.message}`)
        process.exit(1)

    }

}
initialization()

//userRegister
app.post("/users/register", async (request,response) => {
    const {name,email,password,} = request.body;
    const hashedPassword = await bcrypt.hash(password,10);
    const userQuery = `
    SELECT * FROM users WHERE name = '${name}';
    `;
    const dbUser = await db.get(userQuery);
    if (dbUser === undefined){
        //create user in userdetails
        const createQuery = `
        INSERT INTO users (name,email,password) VALUES ('${name}','${email}','${hashedPassword}');
        `;
        await db.run(createQuery)
        response.status(201).json({ message: "User created successfully" });
    } 
    else{

  // handle user error
    response.status(400)
    response.send("Email id already created")
    }
})

//login user 
app.post("/users/login", async (request,response) => {
    const {email,password} = request.body;
    const userQuery = `
    SELECT * FROM users WHERE email = '${email}';
    `;
    const dbUser = await db.get(userQuery);
    if (dbUser === undefined){
        // user doesnt exit
        return response.status(400).send("Invalid user login");
       
       
    }else{
  // campare password
  const isPasswordMatched = await bcrypt.compare(password,dbUser.password)
  if (isPasswordMatched === true){
    const playload = {id: dbUser.id};
    const jwtToken = jwt.sign(playload,"abcde@413");
    //response.status(400)
    response.json({ token: jwtToken });

  }else{
    return response.status(400).send("Invalid password");
  

  }
    
    }
})

// authentication user 

const actunticationjwtToken = (request, response, next) => {
    let jwtToken;
    const authHeader = request.headers["authorization"];
    
    if (authHeader !== undefined) {
        jwtToken = authHeader.split(" ")[1];
    }
    
    if (jwtToken === undefined) {
        return response.status(401).send("User unauthorized");
    } else {
        jwt.verify(jwtToken, "abcde@413", async (error, payload) => {
            if (error) {
                return response.status(401).send("Invalid access token");
            } else {
                // Log the payload to ensure it contains the user ID
                console.log("Decoded payload: ", payload);
                
                if (!payload || !payload.id) {
                    return response.status(400).send("User ID is missing. Authentication failed.");
                }
                
                request.userId = payload.id;
                console.log("User ID: ", request.userId);  // Log to verify the userId
                next();
            }
        });
    }
};


// profile route
app.get("/users/profile", actunticationjwtToken, async (req, res) => {
  try {
    const user = await db.get(
      `SELECT id, name, email FROM users WHERE id = ?`,
      [req.userId]
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      name: user.name,
      email: user.email
      

    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET all users
app.get("/users", actunticationjwtToken, async (request, response) => {
  try {
    const usersQuery = `
      SELECT id, name, email FROM users;
    `;
    const users = await db.all(usersQuery);
    response.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    response.status(500).send("Server error");
  }
});


// posting items 
app.post("/items", actunticationjwtToken, async (request, response) => {
  try {
    const { name, description, price, image_url } = request.body;

    if (!name || !price) {
      return response.status(400).json({ error: "Name and price are required" });
    }

    const createItemQuery = `
      INSERT INTO items (name, description, price, image_url, created_by)
      VALUES (?, ?, ?, ?, ?);
    `;

    await db.run(createItemQuery, [
      name,
      description || "",
      price,
      image_url || null,
      request.userId
    ]);

    response.status(201).json({ message: "Item created successfully" });
  } catch (error) {
    console.error("Error creating item:", error);
    response.status(500).json({ error: "Server error" });
  }
});


// Geting items
app.get("/items", actunticationjwtToken, async (request, response) => {
  try {
    const itemsQuery = `
      SELECT id, name, description, price, image_url, created_at
      FROM items;
    `;

    const items = await db.all(itemsQuery);
    response.json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    response.status(500).json({ error: "Server error" });
  }
});


// Posting carts

app.post("/carts", actunticationjwtToken, async (request, response) => {
  try {
    const { items } = request.body;

    if (!items || items.length === 0) {
      return response.status(400).json({ error: "Items are required" });
    }

    // Create cart
    const createCartQuery = `
      INSERT INTO carts (user_id)
      VALUES (?);
    `;
    const cartResult = await db.run(createCartQuery, [request.userId]);
    const cartId = cartResult.lastID;

    // Insert cart items
    const insertItemQuery = `
      INSERT INTO cart_items (cart_id, item_id, quantity)
      VALUES (?, ?, ?);
    `;

    for (const item of items) {
      await db.run(insertItemQuery, [
        cartId,
        item.item_id,
        item.quantity || 1
      ]);
    }

    response.status(201).json({
      message: "Cart created and items added successfully",
      cart_id: cartId
    });
  } catch (error) {
    console.error("Error creating cart:", error);
    response.status(500).json({ error: "Server error" });
  }
});

// Geting carts
app.get("/carts", actunticationjwtToken, async (request, response) => {
  try {
    const cartsQuery = `
      SELECT c.id AS cart_id, c.created_at, i.name, i.price, ci.quantity
      FROM carts c
      JOIN cart_items ci ON c.id = ci.cart_id
      JOIN items i ON ci.item_id = i.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC;
    `;

    const carts = await db.all(cartsQuery, [request.userId]);
    response.json(carts);
  } catch (error) {
    console.error("Error fetching carts:", error);
    response.status(500).json({ error: "Server error" });
  }
});


// Posting orders
app.post("/orders", actunticationjwtToken, async (request, response) => {
  try {
    const { cart_id } = request.body;

    if (!cart_id) {
      return response.status(400).json({ error: "cart_id is required" });
    }

    // Get cart items
    const cartItemsQuery = `
      SELECT ci.item_id, ci.quantity, i.price
      FROM cart_items ci
      JOIN items i ON ci.item_id = i.id
      WHERE ci.cart_id = ?;
    `;
    const cartItems = await db.all(cartItemsQuery, [cart_id]);

    if (cartItems.length === 0) {
      return response.status(400).json({ error: "Cart is empty or invalid" });
    }

    // Calculate total
    let totalAmount = 0;
    cartItems.forEach(item => {
      totalAmount += item.price * item.quantity;
    });

    // Create order
    const createOrderQuery = `
      INSERT INTO orders (user_id, total_amount)
      VALUES (?, ?);
    `;
    const orderResult = await db.run(createOrderQuery, [
      request.userId,
      totalAmount
    ]);

    const orderId = orderResult.lastID;

    // Insert order items
    const insertOrderItemQuery = `
      INSERT INTO order_items (order_id, item_id, quantity, price)
      VALUES (?, ?, ?, ?);
    `;

    for (const item of cartItems) {
      await db.run(insertOrderItemQuery, [
        orderId,
        item.item_id,
        item.quantity,
        item.price
      ]);
    }

    // Optional: clear cart after order
    await db.run(`DELETE FROM cart_items WHERE cart_id = ?`, [cart_id]);
    await db.run(`DELETE FROM carts WHERE id = ?`, [cart_id]);

    response.status(201).json({
      message: "Order placed successfully",
      order_id: orderId,
      total_amount: totalAmount
    });
  } catch (error) {
    console.error("Error creating order:", error);
    response.status(500).json({ error: "Server error" });
  }
});


// Geting orders
app.get("/orders", actunticationjwtToken, async (request, response) => {
  try {
    const ordersQuery = `
      SELECT o.id AS order_id, o.total_amount, o.status, o.created_at,
             i.name, oi.quantity, oi.price
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN items i ON oi.item_id = i.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC;
    `;

    const orders = await db.all(ordersQuery, [request.userId]);
    response.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    response.status(500).json({ error: "Server error" });
  }
});

// Geting item by id
app.get('/items/:id', actunticationjwtToken, async (request, response) => {
  const {id} = request.params

  const query = `
    SELECT id, name, description, price, image_url
    FROM items
    WHERE id = ?
  `

  const item = await db.get(query, [id])

  if (!item) {
    return response.status(404).json({error: 'Item not found'})
  }

  response.json(item)
})

// DELETE item by id
app.delete('/items/:id', actunticationjwtToken, async (request, response) => {
  try {
    const {id} = request.params

    // Check if item exists
    const itemQuery = `SELECT * FROM items WHERE id = ?`
    const item = await db.get(itemQuery, [id])

    if (!item) {
      return response.status(404).json({error: 'Item not found'})
    }

    // Delete item
    const deleteQuery = `DELETE FROM items WHERE id = ?`
    await db.run(deleteQuery, [id])

    response.json({message: 'Item deleted successfully'})
  } catch (error) {
    console.error('Delete item error:', error)
    response.status(500).json({error: 'Server error'})
  }
})



module.exports = app