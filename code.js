
var server = new SillyClient();

var inputMessage = document.getElementById("message-input");
var addButton = document.getElementById("add");
var userList = [];

server.connect("wss://ecv-etic.upf.edu/node/9000/ws", "TestRoom");

/*
class User {
    user(name, id)
    {
        this.name = name;
        this.id = id;
    }
};

server.on_user_connected = function()
{
    var newUser = user(name, userList.length());
    userList.push(newUser);
    greetings(userList.indexOf(newUser).id)
};
*/

//server.connect("wss://tamats.com:55000", "TestChat");

server.on_connect = greetings;
server.on_ready = isConnected;

function greetings(id)
{
    var greet = document.createTextNode("Welcome to the chat user " + id +"!");
    var newElement = document.createElement("LI");
    newElement.appendChild(greet);
    document.getElementById("messageList").appendChild(newElement);
    console.log("When connected!");
}

function isConnected ()
{
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

document.getElementById("add").onclick = function()
{
    if(!server || !server.is_connected)
    {
        return;
    }
    var text = document.getElementById("message-input").value;
    var li = document.createElement("li");
    li.textContent = text;
    server.sendMessage(text);
    document.getElementById("messageList").appendChild(li);
    document.getElementById("message-input").value = "";
}
