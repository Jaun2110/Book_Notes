import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import mime from "mime";


const app = express()
const port = 4000
const API_URL = "http://localhost:5000";

// middelwares
app.use(bodyParser.urlencoded({extended:true}))
// point to static files
app.use(express.static("public"))

// Set the MIME type for CSS files explicitly
// mime.define({
//     'text/css':['css']
// })



// set viewengine
app.set('view engine','ejs')

// display all books
app.get("/",async(req,res)=>{
  try {
    const response = await axios.get(`${API_URL}/getbooks`)
const books = response.data[0]
const coverURLs = response.data[1]
const datesRead = response.data[2]

res.render("index",{
    bookList:books,
    coverURLs:coverURLs,
    dateRead:datesRead
}) 
  } catch (error) {
    console.log(error.message)   
  }
})

// return the new book page
app.get("/new",(req,res)=>{
    res.render("new")
})

// triggered when form submitted
app.post("/newBook",async (req,res)=>{
    const response = await axios.post(`${API_URL}/addBook`,req.body) ;
    console.log(response.data);
    res.redirect("/");
})

// open view notes page
app.get("/books/:id", async (req,res) =>{
    const id = req.params.id
    const response = await axios.get(`${API_URL}/notes/${id}`)
    const bookData = response.data[1]
    const coverUrl = response.data[0]
    const dateRead = response.data[2]
    console.log( response.data[2])

    res.render("notes",{
        bookData: bookData,
        coverUrl: coverUrl,
        dateRead:dateRead
    })
})
// edit book data
app.get("/books/editDetail/:id", async (req,res)=>{
    console.log(req.params)
const id = req.params.id
const response = await axios.get(`${API_URL}/books/editDetail/${id}`)
const bookData = response.data[0]
const dateRead = response.data[1]

res.render("bookEdit",{
    bookData:bookData,
    dateRead:dateRead
})
})

// save data to db
app.post("/editBookSubmit/:id",async(req,res)=>{
    const id = req.params.id
const response = await axios.patch(`${API_URL}/saveData/${id}`,req.body)
conasole.log(response.data)
res.redirect("/")
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
console.log(`Server running on http://localhost:${port}`)
})