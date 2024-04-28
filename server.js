import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import axios from "axios";

const app = express()
const port = 4000
const API_URL = "http://localhost:5000";

// middelwares
app.use(bodyParser.urlencoded({extended:true}))
// point to static files
app.use(express.static("public"))


// set viewengine
app.set('view engine','ejs')






app.get("/",async(req,res)=>{
  try {
    const response = await axios.get(`${API_URL}/getbooks`)
const books = response.data[0]
const coverURLs = response.data[1]
const datesRead = response.data[2]

res.render("index",{
    bookList:books,
    coverURLs,coverURLs,
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