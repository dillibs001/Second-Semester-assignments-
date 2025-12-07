const http = require('http')
const fs = require('fs').promises
const path = require('path')
const PORT = 4000
const HOST_NAME = 'localhost';

//create file path for the student html document
const studentFilePath = path.join(__dirname,'file','index.html')

//create file path for the error html file 
const errorFilePath = path.join(__dirname,'file','error.html')


//creation of a request handler for requests 
const requestHandler = async(req, res)=>{
    //if statement to check for the targer url 
    if(req.url === studentFilePath || req.url === '/' )
    {

    
        try{
                //read the html file 
                const content = await fs.readFile(studentFilePath,'utf-8')
                //Set successful status code(200 OK) and content type
                res.writeHead(200, { 'Content-Type': 'text/html'});
                //Send the HTML content to the client and close the connection
                res.end(content);

           }catch (error) {
            // If the file cannot be read 
            console.error('ERROR: Could not read file:', error.message);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Server Error: File not available.');


        }
        
    }
    // === ELSE statement: Handle the 404 Not Found case (Any other URL) ===
    else {
        const content = await fs.readFile(errorFilePath,'utf-8')
        
        // Set the 404 status code (Not Found)
        res.writeHead(404, { 'Content-Type': 'text/html' });
        
        // Send a simple, hardcoded 404 HTML response
        res.end(content);
    }
}

//server created
const Server = http.createServer(requestHandler)

//server starts 
Server.listen(PORT,HOST_NAME, ()=>{
    console.log(`Server started successfully on http://${HOST_NAME}:${PORT}`)
    
})