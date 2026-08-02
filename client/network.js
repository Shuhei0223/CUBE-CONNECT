const socket = io(
    "https://cube-connect-4.onrender.com"
);

window.currentRoom = null;

let onlineRuleMode = "free";

const status =
    document.getElementById("status");

const roomDisplay =
    document.getElementById("roomDisplay");

// オンラインルール設定

document
.getElementById("onlineFree")
.addEventListener(
"click",
()=>{

    onlineRuleMode = "free";


    status.textContent =
        "オンライン自由配置";

});



document
.getElementById("onlineGravity")
.addEventListener(
"click",
()=>{

    onlineRuleMode = "gravity";


    status.textContent =
        "オンライン重力あり";

});

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


    socket.emit(
    "createRoom",
    {
        ruleMode: onlineRuleMode
    }
);


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

const menu =
document.getElementById("menu");


const menuToggle =
document.getElementById("menuToggle");


menuToggle.addEventListener(
"click",
()=>{


    menu.classList.toggle(
        "hidden"
    );


    if(
        menu.classList.contains("hidden")
    ){

        menuToggle.textContent =
        "メニュー表示";

    }
    else{

        menuToggle.textContent =
        "メニュー非表示";

    }


});