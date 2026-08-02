<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CUBE CONNECT 4 - 3D BOARD</title>
    <!-- Three.js and OrbitControls -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
    <!-- Socket.io -->
    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
    <style>
        body {
            margin: 0;
            overflow: hidden;
            background-color: #111; /* Background behind canvas */
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #eee;
            user-select: none; /* Prevent text selection */
        }

        canvas {
            display: block;
        }

        /* ============================
           UI Styling (Kakkoyoku)
           ============================ */

        /* Header / Title */
        #header {
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            z-index: 10;
            pointer-events: none;
        }

        #header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
            letter-spacing: 0.15em;
            color: #00ffff;
            text-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff;
        }

        #header p {
            margin: 5px 0 0;
            font-size: 0.9em;
            color: #aaa;
        }

        /* Status Area (Top Left) */
        #status-area {
            position: absolute;
            top: 20px;
            left: 20px;
            padding: 15px;
            background: rgba(0, 0, 0, 0.7);
            border: 1px solid #333;
            border-radius: 8px;
            backdrop-filter: blur(5px);
            z-index: 10;
            min-width: 200px;
        }

        .status-item {
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .status-item:last-child {
            margin-bottom: 0;
        }

        .status-label {
            color: #aaa;
            font-size: 0.85em;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .status-value {
            font-weight: bold;
            font-size: 1em;
        }

        #room-id { color: #eee; }
        #my-color-box {
            width: 16px; height: 16px;
            border-radius: 50%;
            display: inline-block;
            margin-left: 8px;
            border: 2px solid transparent;
        }
        #my-color-text { vertical-align: middle; }

        /* Turn Indicator */
        #turn-status {
            margin-top: 15px;
            padding: 10px;
            text-align: center;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
            font-size: 1.1em;
            font-weight: bold;
            letter-spacing: 0.05em;
            transition: all 0.3s ease;
        }

        .my-turn {
            color: #00ff00;
            text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
            border: 1px solid rgba(0, 255, 0, 0.3);
        }

        .opponent-turn {
            color: #ff4444;
            text-shadow: 0 0 10px rgba(255, 68, 68, 0.5);
            border: 1px solid rgba(255, 68, 68, 0.3);
        }

        /* Overlay (Game Over) */
        #overlay {
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.85);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 100;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.5s ease;
            backdrop-filter: blur(10px);
        }

        #overlay.show {
            opacity: 1;
            pointer-events: auto;
        }

        #game-over-message {
            font-size: 4em;
            font-weight: bold;
            margin-bottom: 30px;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }

        #winner-red {
            color: #ff0000;
            text-shadow: 0 0 20px #ff0000, 0 0 30px #ff0000;
        }

        #winner-blue {
            color: #0044ff;
            text-shadow: 0 0 20px #0044ff, 0 0 30px #0044ff;
        }

        #reset-button {
            padding: 12px 30px;
            font-size: 1.2em;
            background: transparent;
            color: #eee;
            border: 2px solid #555;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s ease;
            letter-spacing: 0.1em;
        }

        #reset-button:hover {
            background: #eee;
            color: #111;
            border-color: #eee;
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
        }

    </style>
</head>
<body>

    <!-- ============================
         HTML UI Elements
         ============================ -->

    <!-- Header -->
    <div id="header">
        <h1>CUBE CONNECT 4</h1>
        <p>3D BOARD</p>
    </div>

    <!-- Status Area -->
    <div id="status-area">
        <div class="status-item">
            <span class="status-label">ROOM:</span>
            <span class="status-value" id="room-id">--</span>
        </div>
        <div class="status-item">
            <span class="status-label">YOUR COLOR:</span>
            <span class="status-value">
                <span id="my-color-text">--</span><span id="my-color-box"></span>
            </span>
        </div>
        <div id="turn-status">Waiting for game...</div>
    </div>

    <!-- Overlay (Game Over) -->
    <div id="overlay">
        <div id="game-over-message">--</div>
        <button id="reset-button" onclick="location.reload()">PLAY AGAIN</button>
    </div>


    <script>
        // ============================
        // SOCKET.IO & GAME STATE
        // ============================

        // Initialize socket (Added for connection)
        const socket = io();

        // Game states
        let myColor = null;
        let myTurn = false;
        let gameOver = false;
        window.currentRoom = "Room 1"; // Dummy, update with real room ID

        // UI Element references
        const elRoomId = document.getElementById('room-id');
        const elMyColorText = document.getElementById('my-color-text');
        const elMyColorBox = document.getElementById('my-color-box');
        const elTurnStatus = document.getElementById('turn-status');
        const elOverlay = document.getElementById('overlay');
        const elGameOverMessage = document.getElementById('game-over-message');

        // Update room ID in UI
        elRoomId.textContent = window.currentRoom;


        // ============================
        // THREE.JS SCENE SETUP
        // ============================

        // シーン
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x111111); // Dark background for neon feel


        // カメラ
        const camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );


        // レンダラー
        const renderer = new THREE.WebGLRenderer({ antialias: true }); // Antialias for smoother edges

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );
        renderer.setPixelRatio(window.devicePixelRatio); // Better on high-res screens

        // [MODIFIED] Enable shadows
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows

        document.body.appendChild(
            renderer.domElement
        );


        // カメラ位置
        camera.position.set(8, 8, 8);

        camera.lookAt(0, 0, 0);


        // 回転操作
        const controls =
            new THREE.OrbitControls(
                camera,
                renderer.domElement
            );

        controls.enableDamping = true;
        controls.dampingFactor = 0.05; // Smooth panning
        controls.minDistance = 2; // Min zoom in
        controls.maxDistance = 20; // Max zoom out



        // ============================
        // LIGHTING (for shadows)
        // ============================

        // [MODIFIED] Light setting for visual depth and shadows

        // 弱めの環境光（全体的な明るさ）
        const ambientLight =
            new THREE.AmbientLight(0xffffff, 0.3); // Lower intensity

        scene.add(ambientLight);

        // 平行光源（影を作る主光源）
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7); // Position for nice shadows
        directionalLight.castShadow = true; // Enable shadow casting

        // Configure shadow parameters (map size and camera view box)
        directionalLight.shadow.mapSize.width = 2048; // Higher res shadows
        directionalLight.shadow.mapSize.height = 2048;

        const d = 4; // Size of the shadow camera view box
        directionalLight.shadow.camera.left = -d;
        directionalLight.shadow.camera.right = d;
        directionalLight.shadow.camera.top = d;
        directionalLight.shadow.camera.bottom = -d;
        directionalLight.shadow.camera.near = 1;
        directionalLight.shadow.camera.far = 20;

        scene.add(directionalLight);

        // Optional: Debug shadow camera (remove comment to see shadow box)
        // scene.add(new THREE.DirectionalLightHelper(directionalLight));
        // scene.add(new THREE.CameraHelper(directionalLight.shadow.camera));


        // ============================
        // BOARD HELPER (Added for visibility)
        // ============================

        // 半透明のベース（地面、影を受け止める）
        const baseGeometry = new THREE.PlaneGeometry(3.5, 3.5);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const basePlane = new THREE.Mesh(baseGeometry, baseMaterial);
        basePlane.rotation.x = -Math.PI / 2; // Rotate flat
        basePlane.position.y = -1.05 - 0.35; // Position below bottom spheres
        basePlane.receiveShadow = true; // Receive shadows from spheres
        scene.add(basePlane);

        // Grids/Lines for better depth perception
        const gridHelperGeometry = new THREE.BoxGeometry(3.5, 3.5, 3.5);
        const gridHelperMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff, // Cyan wireframe for cool look
            wireframe: true,
            transparent: true,
            opacity: 0.1 // Very faint
        });
        const gridHelper = new THREE.Mesh(gridHelperGeometry, gridHelperMaterial);
        scene.add(gridHelper);


        // ============================
        // マス管理
        // ============================

        const cells = [];

        const cellObjects = [];


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
                            32, // [MODIFIED] Increased for smoother appearance
                            32
                        );

                    // [MODIFIED] Use MeshStandardMaterial for shadows and lighting
                    const material =
                        new THREE.MeshStandardMaterial({
                            color:0xffffff,
                            metalness: 0.1, // Slight metallic look
                            roughness: 0.3 // Smooth
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


                   // [MODIFIED] Enable casting and receiving shadows
                   sphere.castShadow = true;
                   sphere.receiveShadow = true;


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

                if(gameOver || !myTurn || myColor === null){
                    return; // Prevent action if game over, not my turn, or no color
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
            target.userData.empty
        ){

        /*
                sphere.material =
                    new THREE.MeshStandardMaterial({ // [MODIFIED] Use StandardMaterial

                     color:
                      myColor === "red"
                      ? 0xff0000
                      : 0x0044ff

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
        // UI UPDATE FUNCTIONS
        // ============================

        // Update turn indicator in UI
        function updateTurnUI(isMyTurn, turnColor) {
            elTurnStatus.classList.remove('my-turn', 'opponent-turn');
            
            if (gameOver) {
                elTurnStatus.textContent = "GAME OVER";
                return;
            }

            if (isMyTurn) {
                elTurnStatus.textContent = "YOUR TURN";
                elTurnStatus.classList.add('my-turn');
            } else {
                const colorLabel = turnColor === 'red' ? 'RED' : 'BLUE';
                elTurnStatus.textContent = `${colorLabel}'S TURN`;
                elTurnStatus.classList.add('opponent-turn');
            }
        }

        // Show game over overlay
        function showGameOverUI(winner) {
            elGameOverMessage.classList.remove('winner-red', 'winner-blue');
            elGameOverMessage.innerHTML = winner.toUpperCase() + "<br>WINS!";
            
            if (winner === 'red') {
                elGameOverMessage.classList.add('winner-red');
            } else {
                elGameOverMessage.classList.add('winner-blue');
            }
            
            elOverlay.classList.add('show');
            updateTurnUI(false); // Update turn status to Game Over
        }

        // Apply stone color with StandardMaterial
        function applyStoneColor(sphere, color) {
            sphere.material = new THREE.MeshStandardMaterial({
                color: color === "red" ? 0xff0000 : 0x0044ff, // [MODIFIED] Darker blue for better visibility
                metalness: 0.1,
                roughness: 0.2 // Slightly smoother for reflections
            });
            sphere.castShadow = true;
            sphere.receiveShadow = true;
        }


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



        // ============================
        // SOCKET.IO EVENTS
        // ============================

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

                // [MODIFIED] Update UI with my color
                elMyColorText.textContent = myColor.toUpperCase();
                elMyColorBox.style.background = myColor === 'red' ? '#ff0000' : '#0044ff';
                elMyColorBox.style.boxShadow = `0 0 10px ${myColor === 'red' ? '#ff0000' : '#0044ff'}`;

                // [MODIFIED] Update turn indicator
                updateTurnUI(myTurn, 'red'); // First turn is always Red

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

                // [MODIFIED] Update turn indicator
                updateTurnUI(myTurn, turn);

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

                    // [MODIFIED] Apply color with shadows
                    applyStoneColor(sphere, data.color);


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

                    // [MODIFIED] Apply color with shadows
                    applyStoneColor(sphere, data.color);


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

            // [MODIFIED] Show Game Over UI instead of alert
            showGameOverUI(data.color);

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

    </script>
</body>
</html>