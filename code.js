
var server = new SillyClient();

var inputMessage = document.getElementById("message-input");
var addButton = document.getElementById("add");

server.connect("wss://tamats.com:55000", "TestChat");
server.on_connect = greetings;
server.on_ready = isConnected;

function greetings()
{
    var greet = document.createTextNode("Welcome to the chat dear user!");
    var newElement = document.createElement("LI");
    newElement.appendChild(greet);
    document.getElementById("messageList").appendChild(newElement);
    console.log("When connected!");
}

function isConnected ()
{
    console.log("You have connected to the server!");
}

addButton.addEventListener('click', addMessage);

function addMessage(){
	if(inputMessage.value != " "){
		var newElement = document.createElement("LI");
        var text = document.createTextNode(inputMessage.value);
		newElement.appendChild(text);
        server.sendMessage(inputMessage.value);
        inputMessage.value = " ";
		document.getElementById("messageList").appendChild(newElement);
	}
};