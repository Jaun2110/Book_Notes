import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import axios from "axios";

const app = express()
const port = 5000

// middelwares
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())
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

app.get("/",async(req,res)=>{
  
let books = (await db.query("select * from booklist")).rows;

const bookCoverPromises = books.map(book => fetchCover(book.id))
const coverURLs = await Promise.all(bookCoverPromises)

// convert the date read
const dateReadPromises = books.map(book => convertDateRead(book.date_read))
const datesRead = await Promise.all(dateReadPromises)

// console.log (books)
    
    res.render('index',{
        bookList:books,
        coverURLs: coverURLs,
        dateRead:datesRead
    })
})
app.get("/new",(req,res)=>{
    res.render("new")
})

async function convertDateRead(date){
    const dateConverted = date.toLocaleDateString() 
    return dateConverted

}

async function fetchCover(bookId){
   
    let result = (await db.query("select coverurl,isbn,imgsize from booklist where id = $1",[bookId])).rows[0]
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
console.log(`API running on http://localhost:${port}`)
})