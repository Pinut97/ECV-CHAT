
var server = SillyClient();

function enter()
{
    var userName = document.getElementById("userName").value;
    var roomName = document.getElementById("room").value;
    
    console.log(roomName);

    if(userName == "" || roomName == "")
    {
        return;
    }
    else
    {
        server.connect("wss://ecv-etic.upf.edu/node/9000/ws", roomName);
    }
}

document.getElementById("enter").onclick = function()
{
    enter();
}