
var server = new SillyClient();

server.close();

function login ()
{   
    var room = document.getElementById("Room").value;
    var name = document.getElementById("UserName").value;
    server.connect("wss://ecv-etic.upf.edu/node/9000/ws", room);
    server.on_ready = greetings(name);
}

function greetings(name)
{
    server.user_name = name;
    console.log(server.user_name);
    var greet = document.createTextNode("Welcome to the chat user " + name +"!");
    var newElement = document.createElement("LI");
    newElement.appendChild(greet);
    document.getElementById("messageList").appendChild(newElement);
    server.on_ready = server.sendMessage("User " + server.user_name + " has connected to the room.");
}

server.on_user_connected = function( user_id )
{
    console.log("User with id: " + user_id + " has connected.");
}

server.on_message = function(id, msg)
{
    var message = document.createTextNode( msg );
    var li = document.createElement("LI")
    li.appendChild(message);
    document.getElementById("messageList").appendChild(li);
}

function sendMsg()
{
    if(!server || !server.is_connected)
    {
        return;
    }
    var text = document.getElementById("message-input").value;
    var li = document.createElement("li");
    li.textContent = "You: " + text;
    server.sendMessage(server.user_name + ": " + text);
    document.getElementById("messageList").appendChild(li);
    document.getElementById("message-input").value = "";
}
