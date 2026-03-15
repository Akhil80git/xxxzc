require("dotenv").config()

const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const Groq = require("groq-sdk")

const app = express()

app.use(cors())
app.use(express.json())

/* ---------------- MongoDB ---------------- */

mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("✅ MongoDB Connected"))
.catch(err=>console.log(err))

const chatSchema = new mongoose.Schema({
question:String,
answer:String,
date:{type:Date,default:Date.now}
})

const Chat = mongoose.model("Chat",chatSchema)

/* ---------------- Groq ---------------- */

const groq = new Groq({
apiKey:process.env.GROQ_API_KEY
})

/* ---------------- UI ---------------- */

app.get("/",(req,res)=>{

res.send(`

<!DOCTYPE html>
<html>
<head>

<title>AI Chat</title>

<style>

body{
margin:0;
font-family:Arial;
background:#0f172a;
color:white;
display:flex;
height:100vh;
overflow:hidden;
}

/* Sidebar */

.sidebar{
width:260px;
background:#020617;
padding:20px;
display:flex;
flex-direction:column;
border-right:1px solid #334155;
}

.logo{
font-size:20px;
margin-bottom:20px;
}

.newchat{
padding:12px;
background:#2563eb;
border:none;
color:white;
border-radius:8px;
cursor:pointer;
}

.newchat:hover{
background:#1d4ed8;
}

.history{
margin-top:20px;
flex:1;
overflow:auto;
}

/* Chat Area */

.main{
flex:1;
display:flex;
flex-direction:column;
}

.topbar{
display:none;
background:#020617;
padding:15px;
border-bottom:1px solid #334155;
}

.menu{
font-size:24px;
cursor:pointer;
}

#chat{
flex:1;
overflow-y:auto;
padding:30px;
display:flex;
flex-direction:column;
gap:15px;
}

/* Message */

.msg{
max-width:70%;
padding:14px 18px;
border-radius:10px;
line-height:1.5;
}

.user{
background:#2563eb;
align-self:flex-end;
}

.ai{
background:#1e293b;
align-self:flex-start;
}

/* Input */

.inputArea{
display:flex;
padding:20px;
background:#020617;
border-top:1px solid #334155;
}

.inputArea textarea{
flex:1;
padding:16px;
font-size:16px;
border-radius:10px;
border:none;
resize:none;
height:70px;
outline:none;
}

.inputArea button{
margin-left:15px;
padding:14px 30px;
background:#22c55e;
border:none;
border-radius:10px;
color:white;
font-size:16px;
cursor:pointer;
}

/* Mobile */

@media(max-width:768px){

.sidebar{
position:absolute;
left:-260px;
height:100%;
transition:0.3s;
z-index:10;
}

.sidebar.show{
left:0;
}

.topbar{
display:flex;
}

}

</style>

</head>

<body>

<!-- Sidebar -->

<div class="sidebar" id="sidebar">

<div class="logo">AI Chat</div>

<button class="newchat" onclick="newChat()">+ New Chat</button>

<div class="history" id="history"></div>

</div>

<!-- Main -->

<div class="main">

<div class="topbar">
<div class="menu" onclick="toggleMenu()">☰</div>
</div>

<div id="chat"></div>

<div class="inputArea">

<textarea id="msg" placeholder="Type your message..."></textarea>

<button onclick="sendMsg()">Send</button>

</div>

</div>

<script>

const chat=document.getElementById("chat")

function addMsg(text,type){

const div=document.createElement("div")

div.className="msg "+type

div.innerText=text

chat.appendChild(div)

chat.scrollTop=chat.scrollHeight

}

async function sendMsg(){

let msg=document.getElementById("msg").value

if(!msg) return

addMsg(msg,"user")

document.getElementById("msg").value=""

const res=await fetch("/chat",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({message:msg})

})

const data=await res.json()

addMsg(data.reply,"ai")

}

function newChat(){

chat.innerHTML=""

}

function toggleMenu(){

document.getElementById("sidebar").classList.toggle("show")

}

</script>

</body>
</html>

`)

})

/* ---------------- Chat API ---------------- */

app.post("/chat",async(req,res)=>{

try{

const userMessage=req.body.message

const completion = await groq.chat.completions.create({

model:"llama-3.3-70b-versatile",

messages:[
{
role:"user",
content:userMessage
}
]

})

const aiReply = completion.choices[0].message.content

const chat = new Chat({
question:userMessage,
answer:aiReply
})

await chat.save()

res.json({reply:aiReply})

}
catch(err){

console.log(err)

res.json({reply:"AI Error"})
}

})

/* ---------------- History ---------------- */

app.get("/history",async(req,res)=>{

const data = await Chat.find().sort({date:-1})

res.json(data)

})

/* ---------------- Server ---------------- */

app.listen(process.env.PORT,()=>{

console.log("🚀 Server running http://localhost:"+process.env.PORT)

})
