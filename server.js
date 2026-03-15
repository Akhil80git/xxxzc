require("dotenv").config()

const express = require("express")
const cors = require("cors")
const Groq = require("groq-sdk")

const app = express()

app.use(cors())
app.use(express.json())

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

<meta name="viewport" content="width=device-width, initial-scale=1">

<title>AI Chat</title>

<style>

body{
margin:0;
font-family:Arial;
background:#0f172a;
color:white;
display:flex;
flex-direction:column;
height:100vh;
}

/* Top Bar */

.topbar{
background:#020617;
padding:15px;
display:flex;
justify-content:space-between;
align-items:center;
border-bottom:1px solid #334155;
}

.topbar button{
padding:8px 14px;
background:#2563eb;
border:none;
color:white;
border-radius:6px;
cursor:pointer;
}

/* Chat */

#chat{
flex:1;
overflow-y:auto;
padding:20px;
display:flex;
flex-direction:column;
gap:12px;
}

/* Message */

.msg{
max-width:80%;
padding:12px 16px;
border-radius:10px;
line-height:1.5;
font-size:15px;
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
padding:12px;
background:#020617;
border-top:1px solid #334155;
}

.inputArea textarea{
flex:1;
padding:12px;
border:none;
border-radius:8px;
resize:none;
height:50px;
font-size:15px;
outline:none;
}

.inputArea button{
margin-left:10px;
padding:10px 18px;
background:#22c55e;
border:none;
border-radius:8px;
color:white;
font-size:15px;
cursor:pointer;
}

/* Mobile Optimization */

@media(max-width:600px){

.msg{
max-width:90%;
font-size:14px;
}

.inputArea textarea{
height:45px;
}

}

</style>

</head>

<body>

<!-- Top Bar -->

<div class="topbar">

<div>AI Chat</div>

<button onclick="newChat()">New Chat</button>

</div>

<!-- Chat -->

<div id="chat"></div>

<!-- Input -->

<div class="inputArea">

<textarea id="msg" placeholder="Type message..."></textarea>

<button onclick="sendMsg()">Send</button>

</div>

<script>

const chat=document.getElementById("chat")

/* Load LocalStorage */

window.onload=function(){

let history=JSON.parse(localStorage.getItem("chatHistory")) || []

history.forEach(m=>addMsg(m.text,m.type))

}

/* Add Message */

function addMsg(text,type){

const div=document.createElement("div")

div.className="msg "+type

div.innerText=text

chat.appendChild(div)

chat.scrollTop=chat.scrollHeight

}

/* Save Local */

function saveLocal(text,type){

let history=JSON.parse(localStorage.getItem("chatHistory")) || []

history.push({text,type})

localStorage.setItem("chatHistory",JSON.stringify(history))

}

/* Send Message */

async function sendMsg(){

let msg=document.getElementById("msg").value

if(!msg) return

addMsg(msg,"user")
saveLocal(msg,"user")

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
saveLocal(data.reply,"ai")

}

/* New Chat */

function newChat(){

chat.innerHTML=""

localStorage.removeItem("chatHistory")

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

res.json({reply:aiReply})

}
catch(err){

console.log(err)

res.json({reply:"AI Error"})
}

})

/* ---------------- Server ---------------- */

app.listen(process.env.PORT,()=>{

console.log("🚀 Server running http://localhost:"+process.env.PORT)

})
