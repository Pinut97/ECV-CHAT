
var server = new SillyClient();

var messageStore = [];

function login()
{
    var room = document.getElementById("Room").value;
    server.room["name"] = room;
    server.close();
    server.connect("wss://ecv-etic.upf.edu/node/9000/ws", room);
    server.on_connect = greetings;
    server.on_ready = userReady;
};

function userReady()
{
    server.num_clients++;
    server.user_name = name;
    var text = "User " + server.user_name + " has connected!";
    var message = {
        username: server.user_name,
        type: "msg",
        data: text,
        login: true,
        id: server.user_id
    };
    server.sendMessage(JSON.stringify(message));
};

function greetings()
{
    name = document.getElementById("UserName").value;
    server.user_name = name;
    var greet = document.createTextNode("Welcome to the chat user " + server.user_name +"!");
    var newElement = document.createElement("LI");
    newElement.appendChild(greet);
    document.getElementById("messageList").appendChild(newElement);
};

server.on_user_connected = function( user_id, data )
{

};

server.on_message = function(id, msg)
{  
    var parsed = JSON.parse(msg);

    if (parsed.type === "msg") 
    {
        if(parsed.login === true)
        {
            var message = document.createTextNode( "[" + parsed.username + "]: " + parsed.data );
            var li = document.createElement("LI")
            li.appendChild(message);
            document.getElementById("messageList").appendChild(li);
            server.room.updated = true;
            server.room.clients.sort(function(a, b){return a-b});
            if(server.user_id == server.room.clients[0])
            {
                sendPreviousMessages(parsed.id);
            }
        }
        else
        {
            messageStore.push(parsed);
            var message = document.createTextNode( "[" + parsed.username + "]: " + parsed.data );
            var li = document.createElement("LI")
            li.appendChild(message);
            document.getElementById("messageList").appendChild(li); 
        }
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

    messageStore.push(message);

    server.sendMessage(JSON.stringify(message));
    document.getElementById("messageList").appendChild(li);
    document.getElementById("message-input").value = "";
};

function sendPreviousMessages(id) 
{
    for(var i = 0; i < messageStore.length; i++ )
    {
        server.sendMessage(JSON.stringify(messageStore[i]), id);
    }
}