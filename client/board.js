// ============================
// CUBE CONNECT 4 3D BOARD
// ============================


// シーン
const scene = new THREE.Scene();


// カメラ
const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);


// レンダラー
const renderer = new THREE.WebGLRenderer({
    antialias:true
});

renderer.shadowMap.enabled = true;

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

document.body.appendChild(
    renderer.domElement
);


// カメラ位置
camera.position.set(
    8,
    8,
    8
);

camera.lookAt(
    0,
    0,
    0
);


// 回転操作
const controls =
    new THREE.OrbitControls(
        camera,
        renderer.domElement
    );

controls.enableDamping = true;



// 光
const ambientLight =
    new THREE.AmbientLight(
        0xffffff,
        0.5
    );

scene.add(
    ambientLight
);


const directionalLight =
    new THREE.DirectionalLight(
        0xffffff,
        1
    );

directionalLight.position.set(
    5,
    10,
    5
);

directionalLight.castShadow = true;


scene.add(
    directionalLight
);

// ============================
// ゲーム設定
// ============================

let gameMode = "online";
// online
// cpu


let ruleMode = "free";
// free
// gravity


let onlineRuleMode = "free";


let cpuColor = "blue";

// ============================
// マス管理
// ============================

const cells = [];

const cellObjects = [];

let myColor = null;

let myTurn = false;

let gameOver = false;


const directions = [

    // 横
    [1,0,0],
    [-1,0,0],

    // 縦
    [0,1,0],
    [0,-1,0],

    // 奥行き
    [0,0,1],
    [0,0,-1],

    // 斜め
    [1,1,0],
    [-1,-1,0],

    [1,-1,0],
    [-1,1,0],

    [1,0,1],
    [-1,0,-1],

    [1,0,-1],
    [-1,0,1],

    [0,1,1],
    [0,-1,-1],

    [0,1,-1],
    [0,-1,1],

    // 3方向斜め
    [1,1,1],
    [-1,-1,-1],

    [1,1,-1],
    [-1,-1,1],

    [1,-1,1],
    [-1,1,-1],

    [1,-1,-1],
    [-1,1,1]

];

function checkWin(data){

    const x = data.x;
    const y = data.y;
    const z = data.z;

    const color = data.color;


    for(
        const dir of directions
    ){

        let count = 1;


        count += countDirection(
            x,
            y,
            z,
            dir[0],
            dir[1],
            dir[2],
            color
        );


        count += countDirection(
            x,
            y,
            z,
            -dir[0],
            -dir[1],
            -dir[2],
            color
        );


        if(count >= 4){

            return true;

        }

    }


    return false;

}

function countDirection(
    x,
    y,
    z,
    dx,
    dy,
    dz,
    color
){

    let count = 0;


    let nx = x + dx;
    let ny = y + dy;
    let nz = z + dz;


    while(
        nx >= 0 &&
        nx < 4 &&
        ny >= 0 &&
        ny < 4 &&
        nz >= 0 &&
        nz < 4
    ){

        if(
            board[nx][ny][nz] !== color
        ){
            break;
        }


        count++;


        nx += dx;
        ny += dy;
        nz += dz;

    }


    return count;

}

// ゲーム盤データ
const board = [];

// 4×4×4を空で作成
for(let x = 0; x < 4; x++){

    board[x] = [];

    for(let y = 0; y < 4; y++){

        board[x][y] = [];

        for(let z = 0; z < 4; z++){

            board[x][y][z] = null;

        }

    }

}

// ============================
// 4×4×4盤面作成
// ============================

const SIZE = 4;


for(let x = 0; x < SIZE; x++){

    for(let y = 0; y < SIZE; y++){

        for(let z = 0; z < SIZE; z++){



            // 表示用の球

           const geometry =
    new THREE.SphereGeometry(
        0.25,
        32,
        32
    );


const material =
    new THREE.MeshStandardMaterial({

        color:0xffffff,

        metalness:0.15,

        roughness:0.25

    });


            const sphere =
                new THREE.Mesh(
                    geometry,
                    material
                );

sphere.castShadow = true;
sphere.receiveShadow = true;

           sphere.position.set(
             x * 0.7 - 1.05,
             y * 0.7 - 1.05,
             z * 0.7 - 1.05
            );



            sphere.userData = {
                x:x,
                y:y,
                z:z,
                empty:true
            };


            cells.push(
                sphere
            );


            scene.add(
                sphere
            );



            // ====================
            // クリック用透明Box
            // ====================


            const hitGeometry =
                new THREE.BoxGeometry(
                    0.35,
                    0.35,
                    0.35
                );


            const hitMaterial =
                new THREE.MeshBasicMaterial({
                    transparent:true,
                    opacity:0
                });


            const hitBox =
                new THREE.Mesh(
                    hitGeometry,
                    hitMaterial
                );


            hitBox.position.copy(
                sphere.position
            );


            hitBox.userData = {

                x:x,
                y:y,
                z:z,

                sphere:sphere,

                empty:true

            };


            cellObjects.push(
                hitBox
            );


            scene.add(
                hitBox
            );


        }

    }

}



// ============================
// クリック処理
// ============================


const raycaster =
    new THREE.Raycaster();


const mouse =
    new THREE.Vector2();



window.addEventListener(
    "pointerdown",
    (event)=>{

        if(gameOver){

    return;

}

       const rect =
         renderer.domElement.getBoundingClientRect();


         mouse.x =
         ((event.clientX - rect.left) /
          rect.width) * 2 - 1;


         mouse.y =
         -((event.clientY - rect.top) /
         rect.height) * 2 + 1;


         raycaster.setFromCamera(
            mouse,
            camera
        );



        const hits =
            raycaster.intersectObjects(
                cellObjects
            );



        if(hits.length > 0){


            const target =
                hits[0].object;



          const sphere =
    target.userData.sphere;


console.log(
    "現在の自分の色:",
    myColor
);


if(
    target.userData.empty &&
    myColor !== null &&
    myTurn
){

/*
sphere.material =
 new THREE.MeshStandardMaterial({
             color:
              myColor === "red"
              ? 0xff0000
              : 0x0000ff

    });


        target.userData.empty =
            false;
*/

let px =
    target.userData.x;

let py =
    target.userData.y;

let pz =
    target.userData.z;


if(ruleMode === "gravity"){

    py =
    getGravityPosition(
        px,
        pz
    );


    if(py === -1){

        return;

    }

}


const move = {

    x:px,
    y:py,
    z:pz,

    color:myColor

};

if(gameMode === "online"){


    socket.emit(
        "placeStone",
        {

            roomId: window.currentRoom,

            ...move

        }
    );


}
else{


    placeLocalStone(move);


    myTurn = false;


    setTimeout(
        cpuMove,
        500
    );


}

    console.log(
        "石を置いた場所",
        target.userData
    );


    console.log(
        board
    );

}

        }


    }

);



// ============================
// 描画
// ============================

function animate(){


    requestAnimationFrame(
        animate
    );


    controls.update();


    renderer.render(
        scene,
        camera
    );


}


animate();

function placeLocalStone(data){

    if(board[data.x][data.y][data.z] !== null){

    return;

}

    const target =
        cellObjects.find(
            (cell)=>
                cell.userData.x === data.x &&
                cell.userData.y === data.y &&
                cell.userData.z === data.z
        );


    if(!target)
        return;


    const sphere =
        target.userData.sphere;


    sphere.material =
        new THREE.MeshStandardMaterial({

            color:
            data.color === "red"
            ? 0xdd2222
            : 0x2255dd

        });


    target.userData.empty = false;
    board[data.x][data.y][data.z] =
    data.color;


console.log(
    "勝利判定:",
    data,
    board[data.x][data.y][data.z]
);


    // 勝利判定

    if(checkWin(data)){

    gameOver = true;


    alert(
        data.color + " の勝ち！"
    );

    }

};



function cpuMove(){

    let move;


    // ============================
    // ① CPUが勝てる場所を探す
    // ============================

    move =
        findWinningMove(cpuColor);


    // ============================
    // ② 相手の勝ちを防ぐ
    // ============================

    if(!move){

        const enemy =
            myColor;


        move =
            findWinningMove(enemy);

    }


    // ============================
    // ③ 中央優先
    // ============================

    if(!move){

        move =
            findCenterMove();

    }


    // ============================
    // ④ 最後はランダム
    // ============================

    if(!move){

        move =
            findRandomMove();

    }


    if(!move){

        return;

    }


    placeLocalStone({

        x:move.x,
        y:move.y,
        z:move.z,

        color:cpuColor

    });


    myTurn = true;

}




// ============================
// 重力処理
// ============================

function findWinningMove(color){


    for(let x=0;x<4;x++){

        for(let z=0;z<4;z++){


            let yList=[];


            // 重力あり
            if(ruleMode === "gravity"){


                const y =
                    getGravityPosition(
                        x,
                        z
                    );


                if(y !== -1){

                    yList.push(y);

                }


            }
            // 自由配置
            else{


                for(let y=0;y<4;y++){

                    yList.push(y);

                }

            }



            for(const y of yList){


                if(board[x][y][z] === null){


                    board[x][y][z] = color;



                    const win =
                        checkWin({

                            x:x,
                            y:y,
                            z:z,
                            color:color

                        });



                    board[x][y][z] = null;



                    if(win){

                        return {

                            x:x,
                            y:y,
                            z:z

                        };

                    }

                }


            }


        }

    }


    return null;

}

function findCenterMove(){


    const centers = [

        {x:1,z:1},
        {x:1,z:2},
        {x:2,z:1},
        {x:2,z:2}

    ];


    for(const pos of centers){


        if(ruleMode === "gravity"){


            const y =
            getGravityPosition(
                pos.x,
                pos.z
            );


            if(y !== -1){

                return {

                    x:pos.x,
                    y:y,
                    z:pos.z

                };

            }


        }


        else{


            if(board[pos.x][1][pos.z]===null){

                return {

                    x:pos.x,
                    y:1,
                    z:pos.z

                };

            }

        }


    }


    return null;

}

function findRandomMove(){


    const empty=[];


    for(let x=0;x<4;x++){

        for(let y=0;y<4;y++){

            for(let z=0;z<4;z++){


                if(board[x][y][z]===null){


                    empty.push({

                        x:x,
                        y:y,
                        z:z

                    });


                }


            }

        }

    }


    if(empty.length===0){

        return null;

    }


    return empty[
        Math.floor(
            Math.random()*empty.length
        )
    ];

}

function getGravityPosition(x,z){

    for(let y = 0; y < 4; y++){

        if(board[x][y][z] === null){

            return y;

        }

    }


    return -1;

}

// オンラインルール受信

socket.on(
    "ruleMode",
    (mode)=>{

        ruleMode = mode;


        console.log(
            "オンラインルール:",
            ruleMode
        );

    }
);


socket.on(
    "playerColor",
    (color)=>{
        myColor = color;


        // 最初は赤の番
        myTurn =
        myColor === "red";


        console.log(
            "自分の色:",
            myColor
        );


        console.log(
            "自分の番:",
            myTurn
         );


    }   
);

socket.on(
    "turnChange",
    (turn)=>{

        myTurn =
            turn === myColor;

        console.log(
            "ターン更新後:",
            myTurn
        );

        console.log(
            "現在のターン:",
            turn
        );


        console.log(
            "自分の番:",
            myTurn
        );

    }
);

socket.on(
    "stoneAccepted",
    (data)=>{


        console.log(
            "自分の石を確定:",
            data
        );


        const target =
            cellObjects.find(
            (cell)=>
            cell.userData.x === data.x &&
            cell.userData.y === data.y &&
            cell.userData.z === data.z
        );


        if(target){


            const sphere =
                target.userData.sphere;


            sphere.material =
            new THREE.MeshStandardMaterial({

                color:
                data.color === "red"
                ? 0xff0000
                : 0x0000ff

            });


            target.userData.empty =
                false;


            board[data.x][data.y][data.z] =
                data.color;

if(checkWin(data)){

    gameOver = true;

    alert(
        data.color + " の勝ち！"
    );

}


        }

    }
);

// 相手の石を表示
socket.on(
    "opponentStone",
    (data)=>{


        console.log(
            "相手の石",
            data
        );


        const target =
            cellObjects.find(
                (cell)=>
                    cell.userData.x === data.x &&
                    cell.userData.y === data.y &&
                    cell.userData.z === data.z
            );


        if(target){


            const sphere =
                target.userData.sphere;


sphere.material =
 new THREE.MeshStandardMaterial({
        color:
            data.color === "red"
            ? 0xff0000
            : 0x0000ff

    });


            target.userData.empty =
                false;


           board[data.x][data.y][data.z] =
    data.color;

        }


    }
);

socket.on(
    "checkWin",
    (data)=>{

        console.log(
            "勝利判定する石:",
            data
        );


        const result =
            checkWin(data);


        console.log(
            "勝利結果:",
            result
        );

        if(result){

    gameOver = true;


    alert(
        data.color + " の勝ち！"
    );

}
    }
);


// ============================
// オンラインルール切替
// ============================


document
.getElementById("onlineFree")
.addEventListener(
    "click",
    ()=>{

        gameMode = "online";

        onlineRuleMode = "free";

        ruleMode = "free";


        alert(
            "オンライン自由配置"
        );

    }
);



document
.getElementById("onlineGravity")
.addEventListener(
    "click",
    ()=>{

        gameMode = "online";

        onlineRuleMode = "gravity";

        ruleMode = "gravity";


        alert(
            "オンライン重力あり"
        );

    }
);



// ============================
// CPUモード切替
// ============================


document
.getElementById("cpuFree")
.addEventListener(
    "click",
    ()=>{

        gameMode = "cpu";

        ruleMode = "free";


        myColor = "red";

        myTurn = true;


        alert(
            "CPU自由配置モード"
        );

    }
);



document
.getElementById("cpuGravity")
.addEventListener(
    "click",
    ()=>{

        gameMode = "cpu";

        ruleMode = "gravity";


        myColor = "red";

        myTurn = true;


        alert(
            "CPU重力ありモード"
        );

    }
);


// 画面サイズ対応

window.addEventListener(
    "resize",
    ()=>{

        camera.aspect =
            window.innerWidth /
            window.innerHeight;


        camera.updateProjectionMatrix();


        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

    }
);
