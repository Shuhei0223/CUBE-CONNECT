const socket = io(
    "https://sublime-straining-jaws.ngrok-free.dev"
);

window.currentRoom = null;

const status =
    document.getElementById("status");

const roomDisplay =
    document.getElementById("roomDisplay");



/*
 サーバー接続
*/
socket.on("connect", () => {

    console.log("サーバー接続成功");

    status.textContent =
        "オンライン接続成功！";

});



/*
 部屋作成ボタン
*/
document
.getElementById("createRoom")
.addEventListener("click", () => {


    socket.emit("createRoom");


});



/*
 部屋作成成功
*/
socket.on("roomCreated", (roomId) => {

    window.currentRoom = roomId;


    roomDisplay.textContent =
        "あなたの部屋番号：" + roomId;


    status.textContent =
        "相手を待っています";

});



/*
 部屋参加ボタン
*/
document
.getElementById("joinRoom")
.addEventListener("click", () => {


    const roomId =
        document
        .getElementById("roomId")
        .value
        .toUpperCase();


        window.currentRoom = roomId;

        socket.emit(
        "joinRoom",
        roomId
    );


});



/*
 対戦開始
*/
socket.on("gameStart", () => {


    status.textContent =
        "対戦開始！";


});



/*
 参加失敗
*/
socket.on("joinFailed", () => {


    status.textContent =
        "その部屋には参加できません";


});

window.currentRoom = null;

socket.on(
    "playerColor",
    (color)=>{

        console.log(
            "あなたの色:",
            color
        );

    }
);