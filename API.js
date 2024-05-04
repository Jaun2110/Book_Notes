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

app.get("/getbooks",async(req,res)=>{
  
let books = (await db.query("select * from booklist order by id ASC")).rows;

const bookCoverPromises = books.map(book => fetchCover(book.id))
const coverURLs = await Promise.all(bookCoverPromises)

// convert the date read
const dateReadPromises = books.map(book => convertDateRead(book.date_read))
const datesRead = await Promise.all(dateReadPromises)
        res.json([books,coverURLs,datesRead])
        
    })

app.get("/new",(req,res)=>{
    res.render("new")
})

app.post("/addBook",async(req,res)=>{
    let title = req.body.title;
    let isbn = req.body.isbn;
    let author = req.body.author;
    let dateRead = req.body.dateRead;
    let rating = req.body.rating;
    let summary = req.body.summary;

    // reset id field in booklist db
    const script =`
    DO $$
    DECLARE newVal INT;
    BEGIN
    -- get count of existing records and add 1

        select count(id) + 1 into newVal from booklist;

        EXECUTE 'ALTER SEQUENCE booklist_id_seq RESTART WITH ' || newVal;

    END $$;
    `;
    // executing script
    try {
        await db.query(script)
        
    } catch (error) {
        console.error("Failed to reset id sequence,",error.message)
        
    }

    // ---------------------------------
    let query = "insert into booklist (title,isbn, author, date_read, rating, summary ) values($1,$2,$3,$4,$5,$6)";
    try {
        await db.query
        (query
        ,[title,isbn,author,dateRead,rating,summary])

        res.json("insertion done")
    } catch (error) {
        console.log("error inserting into database",error.message)
        
    }
  


})

app.get("/notes/:id",async(req,res)=>{
    // console.log(req.params)
    const id = req.params.id
const coverURL = await fetchCover(id)
const bookData =(await db.query(`select bl.*from booklist bl where bl.id = ${id}`)).rows
const isbn = bookData[0].isbn
const notes = (await db.query("select * from notes where bookisbn = $1 ",[isbn])).rows
// console.log(isbn,notes)

 const dateRead =await convertDateRead(bookData[0].date_read)
res.json([coverURL,bookData,notes,dateRead])
})

app.get("/books/editDetail/:id",async(req,res)=>{

    const id = req.params.id
    const book =  (await db.query(`select * from booklist where id = ${id}`)).rows[0]
    const dateRead =await convertDateRead(book.date_read)
    res.json([book,dateRead])
})

app.patch("/saveData/:id", async (req,res)=>{
    const id = req.params.id
    const book = (await db.query(`select * from booklist where id = ${id}`)).rows[0]
    const title = req.body.title || book.title
    const isbn = req.body.isbn || book.isbn
    const author = req.body.author || book.author
    const dateReadString =await convertDateRead(book.date_read)
    const dateRead = req.body.dateRead || dateReadString
    const rating = req.body.rating || book.rating
    const summary = req.body.summary || book.summary

    const query = 
    "update booklist set title = $1, isbn = $2,author = $3, date_read = $4, rating = $5,summary = $6" +
    " where id = $7"
    try {
        const insert =await db.query(query,[title,isbn,author,dateRead,rating,summary,id])
        res.json("update successfull")
    } catch (error) {
        console.error(error.message)
        
    }
})

// add new note to db
app.post("/addNote/:id",async (req,res)=>{
    const id = req.params.id
    const note = req.body.noteEntry
    // reset noteid counter
    const script =`
    DO $$
    DECLARE newNoteVal INT;
    BEGIN
    -- get count of existing records and add 1

        select count(noteid) + 1 into newNoteVal from notes;

        EXECUTE 'ALTER SEQUENCE notes_id_seq RESTART WITH ' || newNoteVal;

    END $$;
    `;
    try {
        // execute script
        await db.query(script)
        // 
        const isbn =(await db.query(`select isbn from booklist where id = ${id}`)).rows[0]
        const isbnVal = isbn.isbn
        const insert = await db.query(`insert into notes (note, bookisbn) values($1,$2)`,
    [note,isbnVal])
    res.json("note added")

    } catch (error) {
        console.error(error.message)
    }
})

// delete note based on the noteid
app.post("/deleteNote/:noteid/:bookid",async (req,res)=>{
    const noteid = req.params.noteid
    const bookid = req.params.bookid
   try {
    const result = await db.query("delete from notes where noteid = $1",[noteid])
    res.json("note deleted")
   } catch (error) {
    console.error(error.message)
    
   }
})
app.patch("/editNote/:noteid",async (req,res) =>{
    const noteid = req.params.noteid
    const bookid = req.params.bookid
    const note = req.body.noteEntry
    try {
        const response = await db.query("update notes set note = $1 where noteid = $2",[note,noteid])
        res.json("note edit complete")
        
    } catch (error) {
        console.error(error.message)
        
    }

})





async function convertDateRead(date){
    let d = new Date(date)
    let month =''+ ( +d.getMonth()+1)
    let day = ''+ d.getDate()
    let year = d.getFullYear()

    // month between 1 and 9
    if (month.length <2){
        month = '0' + month
    }
    if (day < 2){
        day = '0' + day
    }
let dateConverted = [year,month,day].join('-')
    // const dateConverted = date.toLocaleDateString()
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
    














app.listen(process.env.PORT||port,()=>{
console.log(`API running on http://localhost:${port}`)
})