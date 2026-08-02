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
const renderer = new THREE.WebGLRenderer();

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
const light =
    new THREE.AmbientLight(
        0xffffff
    );

scene.add(light);



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
                    0.18,
                    16,
                    16
                );


            const material =
                new THREE.MeshBasicMaterial({
                    color:0xffffff
                });


            const sphere =
                new THREE.Mesh(
                    geometry,
                    material
                );


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
            new THREE.MeshBasicMaterial({

             color:
              myColor === "red"
              ? 0xff0000
              : 0x0000ff

    });


        target.userData.empty =
            false;
*/

    // 盤面に保存
   board[
    target.userData.x
][
    target.userData.y
][
    target.userData.z
] = myColor;

    socket.emit(
    "placeStone",
    {
        roomId: window.currentRoom,
        
        x:target.userData.x,
        y:target.userData.y,
        z:target.userData.z,
        
      color:myColor
    }
);

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
                new THREE.MeshBasicMaterial({

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
    new THREE.MeshBasicMaterial({

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