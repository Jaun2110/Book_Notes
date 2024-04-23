import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import axios from "axios";

const app = express()
const port = 5000

// middelwares
app.use(bodyParser.urlencoded({extended:true}))
// point to static files
app.use(express.static("public"))

// db connection
const db = new pg.Client({
    user:"postgres",
    password:"admin",
    host: "localhost",
    database: "books",
    port: 5432,
})

db.connect((err)=>{
    if (err){
        console.error(err.message)
    }else{
        console.log(`Connection to database ${db.database} successfull` )
    }
})
// set viewengine
app.set('view engine','ejs')

async function fetchBookCover(){
    const result = await db.query("select * from bookList" )
    const isbn = result.rows[0].isbn
    const url = result.rows[0].coverurl
    const imageSize = result.rows[0].imgsize
    const completeURL = url + isbn + imageSize
    const bookData = result.rows[0]


    // make req to fetch cover
    try {
        const response = await axios.get(completeURL,{responseType:'stream'})
        console.log(response)
        if (response.status === 200){
            return [bookData,completeURL]
        }else{
                return null
            }
        
    } catch (error) {
        console.error('Error fetching cover',error.message)
    }
}


app.get("/",async(req,res)=>{
   const bookArray =await fetchBookCover()
   const coverURL = await bookArray[1]
   const bookData = bookArray[0]

console.log(bookData)
    
    res.render('index',{coverURL,bookData})
})


app.post("/books/:isbn",(req,res) =>{
    const isbn = req.body.isbn
    
console.log(req.body.isbn)
})










app.listen(port,()=>{
console.log(`Server started on http://localhost:${port}`)
})