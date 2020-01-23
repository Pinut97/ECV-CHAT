
var server = new SillyClient();

function login()
{
    var room = document.getElementById("Room").value;
    var name = document.getElementById("UserName").value;
    server.close();
    server.connect("wss://ecv-etic.upf.edu/node/9000/ws", room);
    server.on_connect = greetings(name, room);
    server.on_ready = userReady;
};

function userReady()
{
    console.log("userReady")
    server.num_clients++;
    name = document.getElementById("UserName").value;
    server.user_name = name;
    server.sendMessage("User " + server.user_name + " has connected!");
};

function greetings(name, room)
{
    console.log("greetings");
    server.user_name = name;
    server.room["name"] = room;
    var greet = document.createTextNode("Welcome to the chat user " + server.user_name +"!");
    var newElement = document.createElement("LI");
    newElement.appendChild(greet);
    document.getElementById("messageList").appendChild(newElement);
};

server.on_user_connected = function( user_id, data )
{
    console.log("on_user_connected");
    console.log(user_id + " " + data);

    var message = {
        username: server.user_name,
        type: "id",
        data: server.user_id
    };

    server.sendMessage(JSON.stringify(message), user_id);
};

server.on_message = function(id, msg)
{  
    console.log("on message " + "Sender: " + id + " Receiver: " + server.user_id);
    var parsed = JSON.parse(msg);
    if (parsed.type === "id"){
        console.log("tipo id");
        server.room["clients"].push(parsed.data); //afegeix el nou id a la llista de clients.
        console.log(parsed.data);
        server.room["updated"] = true; //L'usuari està updated ja que si rep aquest missatge significa que ell té tots els anteriors missatges.
        server.room["clients"].sort(function(a, b){return a-b}); //Ordena la lista de forma ascendent.
        console.log("Lowest id: " + server.room["clients"][0])
        getPreviousMessages(server.room["clients"][0]);
    } 
    else if (parsed.type === "msg") {
            console.log("tipo msg");
            console.log(parsed.data);
            var message = document.createTextNode( "[" + parsed.username + "]: " + parsed.data );
            var li = document.createElement("LI")
            li.appendChild(message);
            document.getElementById("messageList").appendChild(li);
    }
    else if (parsed.type === "update_petition") {
        sendPreviousMessages(id);
    }
    else if (parsed.type === "update") {
        console.log("UPDATE!");
        console.log("Sender: " + id + " Receiver: " + server.user_id);
        console.log(parsed.data);
    }

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
    var message = {
        username: server.user_name,
        type: "msg",
        data: text
    };

    server.sendMessage(JSON.stringify(message));
    document.getElementById("messageList").appendChild(li);
    document.getElementById("message-input").value = "";
};

function sendPreviousMessages(id) {
    console.log("send previous messages");
    console.log("Sender: " + id + " Receiver: " + server.user_id)
    var list = document.getElementById["messageList"];
    var length = document.getElementById("messageList").getElementsByTagName("li").length;
    var messages = [];

    var message = {
        username: server.user_name,
        type: "update",
        data: list
    };
    server.sendMessage(JSON.stringify(message), id);
}

function getPreviousMessages(id) {

    console.log("getPreviousMessages")
    console.log("Sender: " + server.user_id + " Receiver: " + id)
    var message = {
        username: server.user_name,
        type: "update_petition",
        data: ""
    };

    server.sendMessage(JSON.stringify(message), id);
}