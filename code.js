
var server = new SillyClient();

var inputMessage = document.getElementById("message-input");
var addButton = document.getElementById("add");
var userList = [];

server.close();

server.on_connect = greetings;
server.on_ready = ready;

function greetings(name)
{
    server.user_name = name;
    var greet = document.createTextNode("Welcome to the chat user " + name +"!");
    var newElement = document.createElement("LI");
    newElement.appendChild(greet);
    document.getElementById("messageList").appendChild(newElement);
    console.log("When connected!");
}

function isConnected (name)
{
    server.user_name = name;
    console.log("You have connected to the server!");
    console.log(userList);
}

server.on_message = function(id, msg)
{
    var message = document.createTextNode( msg );
    var li = document.createElement("LI")
    li.appendChild(message);
    document.getElementById("messageList").appendChild(li);
}

function login ()
{
    var room = document.getElementsByName("Room").value;
    server.connect("wss://ecv-etic.upf.edu/node/9000/ws", room);
}

function ready()
{
    console.log("It is ready");
    server.user_name = document.getElementsByName("UserName").value;
    var li = "<li> User " + server.user_name + " connected to the room. </li>";
    //document.getElementById("messageList").appendChild(li);
    server.sendMessage(li);
}

document.getElementById("add").onclick = function()
{
    if(!server || !server.is_connected)
    {
        return;
    }
    var text = document.getElementById("message-input").value;
    var li = document.createElement("li");
    li.textContent = text;
    server.sendMessage(server.user_name + ": " + text);
    document.getElementById("messageList").appendChild(li);
    document.getElementById("message-input").value = "";
}
