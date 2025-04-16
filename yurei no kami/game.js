window.onload = function () {
    const canvas = document.getElementById("gameCanvas");
    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }

    const ctx = canvas.getContext("2d");

    canvas.width = 800;
    canvas.height = 500;

    const backgroundStatic = new Image();
    const overlayMoving = new Image();
    const orbImage = new Image();
    const enemyImage = new Image();

    const dingSound = new Audio("ding.mp3");
    dingSound.volume = 0.4;
    const orbDing = new Audio("ding.mp3");
    orbDing.volume = 0.3;

    backgroundStatic.src = "gamebg2.jpg";
    overlayMoving.src = "paperbg.png";
    orbImage.src = "orb.png";
    enemyImage.src = "enemy.png";

    let backgroundX = 0;
    const backgroundSpeed = 4;

    const images = {
        square: new Image(),
        rectangle: new Image(),
        circle: new Image(),
    };

    images.square.src = "squarechc.png";
    images.rectangle.src = "rectanglechc.png";
    images.circle.src = "circlechc.png";

    const floor = {
        x: 0,
        y: canvas.height - 40,
        width: canvas.width,
        height: 40,
        color: "white",
    };

    const player = {
        x: 380,
        y: floor.y - 130,
        width: 130,
        height: 130,
        shape: "square",
        speed: 4,
        baseY: floor.y - 130,
        ceilingY: 0,
        isStunned: false,
        stunTime: 0,
        stunDuration: 500,
        isFlashing: false,
        flashTimer: 0
    };

    let keys = {};
    let health = 3;
    let lastHitTime = 0;
    const hitCooldown = 1000;
    let startTime = Date.now();
    let endTime = null;
    let gameOver = false;
    let gameCompleted = false;
    let orbCount = 0;
    let enemyActivated = false;

    const orbGoal = 10;
    const endX = 8000;

    const enemy = {
        x: 0,
        y: floor.y - 310, // Adjusted to keep the bottom of the enemy above the floor
        width: 350,  // Increased width
        height: 350, // Increased height
        speed: 4
    };
    
    

    const spikes = [];
    for (let i = 1200; i < endX; i += 900) {
        const height = Math.random() < 0.5 ? 120 : 170;
        const width = 90;
        spikes.push({ x: i, y: floor.y - height, width, height, flipped: false });
        spikes.push({ x: i + 500, y: 0, width, height, flipped: true });
    }

    const orbs = [];
    for (let i = 1400; i < endX; i += 600) {
        const orb = { x: i, y: floor.y - 150, width: 80, height: 80, collected: false };
        orbs.push(orb);
    }

    const uiContainer = {
        x: 10,
        y: 10,
        width: 250,
        height: 80,
        padding: 15,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        borderColor: "#b30000",
        borderWidth: 3,
        textColor: "white",
        font: "16px Arial"
    };

    function resetGame() {
        health = 3;
        orbCount = 0;
        backgroundX = 0;
        enemyActivated = false;
        player.x = 380;
        player.y = player.baseY;
        player.shape = "square";
        player.width = 130;
        player.height = 130;
        player.isStunned = false;
        player.isFlashing = false;
        player.flashTimer = 0;
        lastHitTime = 0;
        gameOver = false;
        gameCompleted = false;
        startTime = Date.now();
        endTime = null;
        enemy.x = 0;
        for (let orb of orbs) orb.collected = false;
    }

    document.addEventListener("keydown", (e) => {
        if ((gameOver || gameCompleted) && e.key.toLowerCase() === "r") {
            resetGame();
            return;
        }
        keys[e.key.toLowerCase()] = true;

        const shapeKey = e.key.toLowerCase();

        if (shapeKey === "d") {
            enemyActivated = true;
        }
        

        if (shapeKey === " " || shapeKey === "spacebar") {
            player.shape = "square";
            player.width = 130;
            player.height = 130;
            player.y = player.baseY;
        } else if (shapeKey === "s") {
            player.shape = "rectangle";
            player.width = 170;
            player.height = 130;
            player.y = player.baseY;
        } else if (shapeKey === "w") {
            player.shape = "circle";
            player.width = 125;
            player.height = 125;
            player.y = player.ceilingY;
        } else {
            return;
        }

        dingSound.currentTime = 0;
        dingSound.play();
    });

    document.addEventListener("keyup", (e) => {
        keys[e.key.toLowerCase()] = false;
    });

    function isColliding(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    function update() {
        if (gameOver || gameCompleted) return;

        const now = Date.now();
        if (player.isStunned && now < player.stunTime) return;
        player.isStunned = false;

        if (keys["a"]  && player.x > 200) {
            player.x -= player.speed;
        } else if (keys["a"] ) {
            backgroundX += backgroundSpeed;
        }

        if ((keys["d"] ) && player.x + player.width < 600) {
            player.x += player.speed;
        } else if (keys["d"] ) {
            backgroundX -= backgroundSpeed;
        }

        player.y = player.shape === "circle" ? player.ceilingY : player.baseY;

// Enemy follows the player if nearby
const enemyScreenX = enemy.x + backgroundX;
const dx = player.x - enemyScreenX;
if (enemyActivated) {
    enemy.x += dx > 0 ? enemy.speed : -enemy.speed;
}


// Enemy collision
if (
    isColliding(player, {
        x: enemy.x + backgroundX,
        y: enemy.y,
        width: enemy.width,
        height: enemy.height
    }) && Date.now() - lastHitTime > hitCooldown
) {
    health--;
    lastHitTime = Date.now();
    player.isStunned = true;
    player.stunTime = Date.now() + player.stunDuration;
    player.isFlashing = true;
    player.flashTimer = 10;
    backgroundX += 100;
    if (health <= 0) {
        gameOver = true;
        endTime = Date.now();
    }
}


        const currentTime = Date.now();
        for (let spike of spikes) {
            const spikeWithScroll = {
                ...spike,
                x: spike.x + backgroundX,
            };
            if (isColliding(player, spikeWithScroll) && currentTime - lastHitTime > hitCooldown) {
                health--;
                lastHitTime = currentTime;
                player.isStunned = true;
                player.stunTime = currentTime + player.stunDuration;
                player.isFlashing = true;
                player.flashTimer = 10;
                backgroundX += 100;
                if (health <= 0) {
                    gameOver = true;
                    endTime = Date.now();
                }
            }
        }

        for (let orb of orbs) {
            const orbWithScroll = {
                ...orb,
                x: orb.x + backgroundX,
            };
            if (!orb.collected && isColliding(player, orbWithScroll)) {
                orb.collected = true;
                orbCount++;
                orbDing.currentTime = 0;
                orbDing.play();

                if (orbCount >= orbGoal && !gameCompleted) {
                    gameCompleted = true;
                    endTime = Date.now();
                }
            }
        }

        if (player.isFlashing) {
            player.flashTimer--;
            if (player.flashTimer <= 0) {
                player.isFlashing = false;
            }
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(backgroundStatic, 0, 0, canvas.width, canvas.height);

        ctx.drawImage(overlayMoving, backgroundX % canvas.width, 0, canvas.width, canvas.height);
        ctx.drawImage(overlayMoving, (backgroundX % canvas.width) + canvas.width, 0, canvas.width, canvas.height);

        ctx.fillStyle = floor.color;
        ctx.fillRect(floor.x, floor.y, floor.width, floor.height);

        for (let spike of spikes) {
            drawSpike(spike.x + backgroundX, spike.y, spike.width, spike.height, spike.flipped);
        }

        for (let orb of orbs) {
            if (!orb.collected) {
                ctx.drawImage(orbImage, orb.x + backgroundX, orb.y, orb.width, orb.height);
            }
        }

        if (!player.isFlashing || (player.flashTimer % 2 === 0)) {
            const img = images[player.shape];
            if (img.complete) {
                ctx.drawImage(img, player.x, player.y, player.width, player.height);
            }
        }

        ctx.drawImage(enemyImage, enemy.x + backgroundX, enemy.y, enemy.width, enemy.height);

        if (!gameOver && !gameCompleted) {
            drawFlag(endX + backgroundX, floor.y - 60);
        }

        drawUIContainer();
        drawHealth();
        drawTimer();
        drawOrbCount();

        if (gameOver) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "white";
            ctx.font = "40px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 20);
            ctx.font = "20px Arial";
            ctx.fillText("Press 'R' to restart", canvas.width / 2, canvas.height / 2 + 20);
        } else if (gameCompleted) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "white";
            ctx.font = "40px Arial";
            ctx.textAlign = "center";
            ctx.fillText("You Win!", canvas.width / 2, canvas.height / 2 - 20);
            ctx.font = "20px Arial";
            ctx.fillText("Final Time: " + ((endTime - startTime) / 1000).toFixed(2) + "s", canvas.width / 2, canvas.height / 2 + 20);
            ctx.fillText("Press 'R' to restart", canvas.width / 2, canvas.height / 2 + 60);
        }
    }

    function drawSpike(x, y, width, height, flipped) {
        ctx.fillStyle = "#b30000";
        ctx.beginPath();
        if (!flipped) {
            ctx.moveTo(x, y + height);
            ctx.lineTo(x + width / 2, y);
            ctx.lineTo(x + width, y + height);
        } else {
            ctx.moveTo(x, y);
            ctx.lineTo(x + width / 2, y + height);
            ctx.lineTo(x + width, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "black";
        ctx.stroke();
    }

    function drawUIContainer() {
        ctx.fillStyle = uiContainer.backgroundColor;
        ctx.strokeStyle = uiContainer.borderColor;
        ctx.lineWidth = uiContainer.borderWidth;

        const radius = 10;
        ctx.beginPath();
        ctx.moveTo(uiContainer.x + radius, uiContainer.y);
        ctx.lineTo(uiContainer.x + uiContainer.width - radius, uiContainer.y);
        ctx.quadraticCurveTo(uiContainer.x + uiContainer.width, uiContainer.y, uiContainer.x + uiContainer.width, uiContainer.y + radius);
        ctx.lineTo(uiContainer.x + uiContainer.width, uiContainer.y + uiContainer.height - radius);
        ctx.quadraticCurveTo(uiContainer.x + uiContainer.width, uiContainer.y + uiContainer.height, uiContainer.x + uiContainer.width - radius, uiContainer.y + uiContainer.height);
        ctx.lineTo(uiContainer.x + radius, uiContainer.y + uiContainer.height);
        ctx.quadraticCurveTo(uiContainer.x, uiContainer.y + uiContainer.height, uiContainer.x, uiContainer.y + uiContainer.height - radius);
        ctx.lineTo(uiContainer.x, uiContainer.y + radius);
        ctx.quadraticCurveTo(uiContainer.x, uiContainer.y, uiContainer.x + radius, uiContainer.y);
        ctx.closePath();

        ctx.fill();
        ctx.stroke();
    }

    function drawHealth() {
        const heartSize = 25;
        const spacing = 10;
        const startX = uiContainer.x + uiContainer.padding;
        const startY = uiContainer.y + uiContainer.padding + 20;

        ctx.fillStyle = "white";
        ctx.font = uiContainer.font;
        ctx.textAlign = "left";
        ctx.fillText("Health:", startX, startY - 5);

        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = i < health ? "red" : "darkred";
            ctx.beginPath();
            ctx.arc(startX + 70 + (heartSize + spacing) * i, startY, heartSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawTimer() {
        const elapsed = endTime ? (endTime - startTime) : (Date.now() - startTime);
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);

        ctx.fillStyle = "white";
        ctx.font = uiContainer.font;
        ctx.textAlign = "left";
        ctx.fillText(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`,
            uiContainer.x + uiContainer.padding,
            uiContainer.y + uiContainer.padding + 50);
    }

    function drawOrbCount() {
        ctx.fillStyle = "white";
        ctx.font = uiContainer.font;
        ctx.textAlign = "left";
        ctx.fillText(`Orbs: ${orbCount}/${orbGoal}`,
            uiContainer.x + uiContainer.padding + 150,
            uiContainer.y + uiContainer.padding + 50);
    }

    function drawFlag(x, y) {
        ctx.fillStyle = "green";
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 40, y + 20);
        ctx.lineTo(x, y + 40);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 50);
        ctx.stroke();
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    let loadedImages = 0;
    const totalImages = Object.keys(images).length + 4; // +1 for enemy


    function checkAllLoaded() {
        loadedImages++;
        if (loadedImages === totalImages) {
            const loader = document.getElementById("loadingScreen");
            if (loader) loader.style.display = "none";
            gameLoop();
        }
    }

    backgroundStatic.onload = checkAllLoaded;
    overlayMoving.onload = checkAllLoaded;
    orbImage.onload = checkAllLoaded;
    for (let key in images) {
        images[key].onload = checkAllLoaded;
    }

    enemyImage.onload = checkAllLoaded;

};
