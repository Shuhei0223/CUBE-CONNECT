
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const roomManager = require("./roomManager");
const app = express();

app.use(express.static("client"));

const server = http.createServer(app);

const io = new Server(server, {

    cors:{
        origin:"*"
    }

});

const games = {};


io.on("connection", (socket) => {
  console.log("プレイヤー接続:", socket.id);

  socket.on("createRoom", () => {

    const roomId = roomManager.createRoom(socket.id);

    socket.join(roomId);

   games[roomId] = {
    turn:"red",
    players:{
        red:socket.id,
        blue:null
    }
};

    socket.emit(
    "playerColor",
    "red"
);

    socket.emit(
        "roomCreated",
        roomId
    );

});


    socket.on("joinRoom", (roomId) => {

    const success =
        roomManager.joinRoom(
            roomId,
            socket.id
        );


   if(success){

    socket.join(roomId);


    // ★追加
    games[roomId].players.blue =
        socket.id;


    socket.emit(
        "playerColor",
        "blue"
    );


    io.to(roomId).emit(
        "gameStart"
    );

} else {

        socket.emit(
            "joinFailed"
        );

    }

});

 socket.on(
    "placeStone",
    (data)=>{


        console.log(
            "石を受信",
            data
        );


       if(!games[data.roomId]){
    console.log(
        "ゲーム情報なし:",
        data.roomId
    );

    return;
}


console.log(
    "現在のターン:",
    games[data.roomId].turn
);

if(
    games[data.roomId].turn !== data.color
){
    console.log(
        "今はこの色の番ではありません"
    );

    return;
}

socket.emit(
    "stoneAccepted",
    data
);

io.to(data.roomId).emit(
    "checkWin",
    data
);

// ターン交代
if(
    games[data.roomId].turn === "red"
){
    games[data.roomId].turn = "blue";

}else{

    games[data.roomId].turn = "red";

}


console.log(
    "次のターン:",
    games[data.roomId].turn
);

io.to(data.roomId).emit(
    "turnChange",
    games[data.roomId].turn
);

        console.log(
            "送信先ルーム:",
            data.roomId
        );


        socket.to(data.roomId)
        .emit(
            "opponentStone",
            data
        );


    }
);

    socket.on("disconnect", () => {
      console.log("プレイヤー退出:", socket.id);
  });
});

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`サーバー起動: http://localhost:${PORT}`);
});