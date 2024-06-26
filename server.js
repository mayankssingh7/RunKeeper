const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
dotenv.config();
app.use(bodyParser.urlencoded({extended: false}))

let url = process.env.URL;
mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});

app.use(cors())
app.use(express.static("public"))

app.get("/", (req,res) => {
    res.sendFile(__dirname+"/views/index.html")
});

var listener = app.listen(3000 , () => {
    console.log("Server is listening on port 3000")
});

let exerciseSessionSchema = new mongoose.Schema({
    description: {type: String, required: true},
    duration: {type: Number, required: true},
    date: String
})

let userSchema = new mongoose.Schema({
    username: {type: String, required: true},
    log: [exerciseSessionSchema]
})

let Session = mongoose.model("Session", exerciseSessionSchema)
let user = mongoose.model("user", userSchema)

app.post('/api/exercise/new-user', (req,res)=> {
    let newUser = new user({username: req.body.username})
    newUser.save((error, savedUser) =>{
        if(!error){
            let responseObject ={}
            responseObject['username'] = savedUser.username
            responseObject['id'] = savedUser.id
            res.json(responseObject)
        }
    })
})

app.get("/api/exercise/users", (request , response) =>{
    user.find({}, (error , arrayOfUsers) =>{
        if(!error){
            response.json(arrayOfUsers)
        }
    })
})

app.post("/api/exercise/add", (request, response) =>{
    let newSession = new Session({
        description: request.body.description,
        duration: parseInt(request.body.duration),
        date: request.body.date
    })
    if(newSession.date === ''){
        newSession.date = new Date().toISOString().substring(0,10)
    }
    // console.log(request.body.id)
    var UserId = request.body.Username;
    user.findOne({username:request.body.Username} , (err , res) =>{
        if(!err) {
            if(res == null) {
                response.json("User doesn't exists.");
            } else {
                user.findOneAndUpdate(
                    {username: UserId},
                    {$push: {log: newSession}},
                    {new : true},
                    (error, updateUser) => {
                        let responseObject = {}
                        //responseObject["_id"] = updateUser.UserId
                        responseObject["username"] = updateUser.username
                        responseObject["date"] = new Date(newSession.date).toDateString()
                        responseObject["description"] = newSession.description
                        responseObject['duration'] = newSession.duration
                        response.json(responseObject)
                    }
                )
            }
        }
    })
    
})

app.get("/api/exercise/log", (request, response) => {
    // console.log(request.query);
    user.findById(request.query.userId, (error, result) => {
        if(!error){
            let responseObject = result
            
            if(request.query.from || request.query.to){
                let fromDate = new Date(0)
                let toDate = new Date()
                if(request.query.from){
                    fromDate = new Date(request.query.from)
                }
                if(request.query.to){
                    toDate = new Date(request.query.to)
                }
                fromDate = fromDate.getTime()
                toDate = toDate.getTime()
                responseObject.log = responseObject.log.filter((Session) =>{
                    let sessionDate = new Date(sessionDate).getTime()
                    return sessionDate >= fromDate && sessionDate <= toDate
                })
            }
            if(request.query.limit){
                responseObject.log = responseObject.log.slice(0, request.query.limit)
            }

            // response.resposeObject['count'] = result.log.length
            response.json(responseObject)
        }
    })
})
