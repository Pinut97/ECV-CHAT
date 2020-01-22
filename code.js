
var server = new SillyClient();

function login()
{   
    var room = document.getElementById("Room").value;
    var name = document.getElementById("UserName").value;
    server.close();
    server.connect("wss://ecv-etic.upf.edu/node/9000/ws", room);
    server.on_connect = greetings(name);
    server.on_ready = userReady;
};

function userReady()
{
    name = document.getElementById("UserName").value;
    server.user_name = name;
    server.sendMessage("User " + server.user_name + " has connected!");
};

function greetings(name)
{
    server.user_name = name;
    var greet = document.createTextNode("Welcome to the chat user " + server.user_name +"!");
    var newElement = document.createElement("LI");
    newElement.appendChild(greet);
    document.getElementById("messageList").appendChild(newElement);
};

server.on_user_connected = function( user_id, data )
{
    console.log("user connected");
    console.log("User with id: " + server.user_name + " has connected.");
};

server.on_message = function(id, msg)
{
    var message = document.createTextNode( msg );
    var li = document.createElement("LI")
    li.appendChild(message);
    document.getElementById("messageList").appendChild(li);
};

function sendMsg()
{
    var text = document.getElementById("message-input").value;
    if(!server || !server.is_connected || !text)
    {
        return;
    }
    
    var li = document.createElement("li");
    li.textContent = "You: " + text;
    server.sendMessage(server.user_name + ": " + text);
    document.getElementById("messageList").appendChild(li);
    document.getElementById("message-input").value = "";
};