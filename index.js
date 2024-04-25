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






app.get("/",async(req,res)=>{
    let bookCoverArray =[]
let books = (await db.query("select * from booklist")).rows;

books.forEach(book  =>{
    (async () =>{
    let bookCoverUrl = await fetchCover(book.id)
   
    bookCoverArray.push(bookCoverUrl)
    
    })
} )

console.log (books)
    
    res.render('index',{
        bookList:books,
        coverURLs: bookCoverArray
    })
})

async function fetchCover(bookId){
   
    let result = (await db.query("select * from booklist where id = $1",[bookId])).rows
    const completeURL = result.coverurl + result.isbn + result.imgsize
        // make req to fetch cover
        try {

            const response = await axios.get(completeURL,{responseType:'stream'})
            console.log(response)
            if (response.status === 200){
                return completeURL
            }else{
                    return null
                }
            
        } catch (error) {
            console.error('Error fetching cover',error.message)
        }
    }
    














app.listen(port,()=>{
console.log(`Server started on http://localhost:${port}`)
})