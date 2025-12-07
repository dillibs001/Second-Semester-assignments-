const http = require("http");
const fs = require("fs");
const path = require("path");

const itemsPath = path.join(__dirname, "file", "items.json");
let itemsDb = [];

const PORT = 4000;
const HOST_NAME = "localhost";

//request handler for the server

function requestHandler(req, res) {
  if (req.url === "/items" && req.method === "GET") {
    //READ items
    getItems(req, res);
  } else if (req.url === "/items" && req.method === "POST") {
    // Create
    addItems(req, res);
  } else if (req.url === "/items" && req.method === "PUT") {
    // Update
    updateItems(req, res);
  } else if (req.url === "/items" && req.method === "DELETE" && req.url.split("/").length === 3) {
    //delete
    deleteItem(req, res);
  } else if (req.method === "GET" && req.url.startsWith("/items/") && req.url.split("/").length === 3) {
    return getOneItem(req, res); // RETURNS immediately after calling getOneItem)
  }
}

function getItems(req, res) {
  fs.readFile(itemsPath, "utf8", (err, data) => {
    if (err) {
      console.log(err);
      res.writeHead(400);
      res.end("An error occured");
    }

    res.end(data);
  });
}

// CREATE AN ITEM ==> POST: /ITEMS
const addItems = function (req, res) {
  const body = [];

  req.on("data", (chunk) => {
    // data event is fired when the server receives data from the client
    body.push(chunk); // push each data received to the body array
  });

  req.on("end", () => {
    const parsedBody = Buffer.concat(body).toString(); // concatenate raw data into a single buffer string
    const newItem = JSON.parse(parsedBody); // parse the buffer string into a JSON object

    // get ID of last ITEM in the database
    const lastItem = itemsDb[itemsDb.length - 1];
    const lastItemId = lastItem.id;
    newItem.id = lastItemId + 1;

    //save to db
    itemsDb.push(newItem);
    fs.writeFile(itemsPath, JSON.stringify(itemsDb), (err) => {
      if (err) {
        console.log(err);
        res.writeHead(500);
        res.end(
          JSON.stringify({
            message: "Internal Server Error. Could not item to database.",
          })
        );
      }

      res.end(JSON.stringify(newItem));
    });
  });
};


// // UPDATE ITEMS ==> PUT: /ITEMS
const updateItems = function (req, res) {
  const body = [];

  req.on("data", (chunk) => {
    // data event is fired when the server receives data from the client
    body.push(chunk); // push each data received to the body array
  });

  req.on("end", () => {
    const parsedBody = Buffer.concat(body).toString(); // concatenate raw data into a single buffer string
    const itemToUpdate = JSON.parse(parsedBody); // parse the buffer string into a JSON object

     // find the item in the database
    const itemIndex = itemsDb.findIndex((item) => {
      return item.id === itemToUpdate.id;
    });

    // Return 404 if item not found
    if (itemIndex === -1) {
      res.writeHead(404);
      res.end(
        JSON.stringify({
          message: "Item not found",
        })
      );
      return;
    }

    //      update the item in the database
    itemsDb[itemIndex] = { ...itemsDb[itemIndex], ...itemToUpdate };

    //         // save to db
    fs.writeFile(itemsPath, JSON.stringify(itemsDb), (err) => {
      if (err) {
        console.log(err);
        res.writeHead(500);
        res.end(
          JSON.stringify({
            message:
              "Internal Server Error. Could not update item in database.",
          })
        );
      }

      res.end(JSON.stringify(itemToUpdate));
    });
  });
};

// // DELETE AN ITEM ==> DELETE: /items
const deleteItem = function (req, res) {
  const itemId = req.url.split("/")[2];

  //     // Remove item from database
  const itemIndex = itemsDb.findIndex((item) => {
    return item.id === parseInt(itemId);
  });

  if (itemIndex === -1) {
    res.writeHead(404);
    res.end(JSON.stringify({
message: "Item not found"})
    );

    return;
  }

  itemsDb.splice(itemIndex, 1); // remove the item from the database using the index

  //     // update the db
  fs.writeFile(itemsPath, JSON.stringify(itemsDb), (err) => {
    if (err) {
      console.log(err);
      res.writeHead(500);
      res.end(
        JSON.stringify({
          message:
            "Internal Server Error. Could not delete item from database.",
        })
      );
    }

    res.end(
      JSON.stringify({
        message: "item deleted",
      })
    );
  });
};

// READ ALL ITEMS ==> GET: /items
function getItems(req, res) {
  fs.readFile(itemsPath, "utf8", (err, data) => {
    if (err) {
      console.log(err);
      // Error handling for file reading failure
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ message: "An error occurred while reading the file" })
      );
    }

    // Send the file contents (which should be the JSON data)
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(data);
  });
}

// READ ONE ITEM ==> GET: /items/{id}
function getOneItem(req, res) {
  // 1. Get ID from the URL (e.g., /items/123 -> ID is 123)
  // The ID is the third part of the path, assuming the URL looks like /items/123
  const itemIdString = req.url.split("/")[2];
  const itemId = parseInt(itemIdString);

  if (isNaN(itemId)) {
    res.writeHead(400, { "Content-Type": "application/json" });
    return res.end(
      JSON.stringify({ message: "Invalid item ID format in URL." })
    );
  }

  // 2. Read the file to find the item
  fs.readFile(itemsPath, "utf8", (err, data) => {
    if (err) {
      console.log(err);
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Internal Server Error." }));
    }

    // 3. Parse the data
    let itemsDbFromFile;
    try {
      itemsDbFromFile = JSON.parse(data || "[]");
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({ message: "Error parsing inventory data." })
      );
    }

    // 4. Find the item
    const item = itemsDbFromFile.find((item) => item.id === itemId);

    if (!item) {
      // Item not found
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Item not found" }));
    }

    // 5. Success
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(item));
  });
}

// Create server
const server = http.createServer(requestHandler);

server.listen(PORT, HOST_NAME, () => {
  // booksDB = JSON.parse(fs.readFileSync(booksDbPath, 'utf8'));
  itemsDb = JSON.parse(fs.readFileSync(itemsPath,'utf8'))
  console.log(`Server is listening on ${HOST_NAME}:${PORT}`);
});
