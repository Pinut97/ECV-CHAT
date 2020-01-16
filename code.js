
var server = new SillyClient();
server.connect("wss://tamats.com:55000", "TestChat");

server.on_ready = isConnected;

function isConnected ()
{
    console.log("You have connected to the server!");
}

document.getElementById("add").onclick = function()
{
    var text = document.getElementsByName("msg").value;
    //var text = document.getElementById("message-input").value;
    var list = "<li>" + text + "</li>";
    console.log(list);
    document.getElementById("message-container").appendChild(list);
}
