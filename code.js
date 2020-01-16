
var server = new SillyClient();

var inputMessage = document.getElementById("message-input");
var addButton = document.getElementById("add");

server.connect("wss://tamats.com:55000", "TestChat");
server.on_ready = isConnected;

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

		document.getElementById("messageList").appendChild(newElement);
	}
}
/*
document.getElementById("add").onclick = function()
{
    var text = document.getElementsByName("msg").value;
    //var text = document.getElementById("message-input").value;
    var list = "<li>" + text + "</li>";
    console.log(list);
    document.getElementById("message-container").appendChild(list);
}
*/