/**
 * gameEngine.js
 * "Fruit Catcher" Game Logic
 * Updated for 600x600 Resolution
 */

class GameEngine {
  constructor() {
    this.score = 0;
    this.level = 1;
    this.timeLimit = 60;
    this.isGameActive = false;

    // Game Objects
    this.items = []; // { x, y, type, speed, icon }
    this.basketPosition = "CENTER"; // LEFT, CENTER, RIGHT
    this.spawnTimer = 0;
    this.spawnInterval = 60; // Frames between spawns

    // Constants (Updated for 600px width)
    this.ZONES = {
      LEFT: 100,    // 1/6 width
      CENTER: 300,  // 3/6 width
      RIGHT: 500    // 5/6 width
    };
    this.ITEM_TYPES = [
      { type: "APPLE", score: 100, icon: "🍎", chance: 0.7 },
      { type: "BOMB", score: 0, icon: "💣", chance: 0.3 }
    ];

    // Callbacks
    this.onGameEnd = null;
  }

  start(config = {}) {
    this.isGameActive = true;
    this.score = 0;
    this.level = 1;
    this.timeLimit = config.timeLimit || 60;
    this.items = [];
    this.basketPosition = "CENTER";
    this.spawnTimer = 0;

    // Start Timer
    this.clearTimer();
    this.gameTimer = setInterval(() => {
      this.timeLimit--;
      if (this.timeLimit <= 0) this.gameOver();
    }, 1000);
  }

  stop() {
    this.isGameActive = false;
    this.clearTimer();
  }

  clearTimer() {
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }
  }

  gameOver() {
    this.stop();
    if (this.onGameEnd) {
      this.onGameEnd(this.score, this.level);
    } else {
      alert(`Game Over! Score: ${this.score}`);
    }
  }

  // Called every frame
  update() {
    if (!this.isGameActive) return;

    // 1. Spawn Items
    this.spawnTimer++;
    // Level up speed (decrease interval)
    // Level 1: 60 frames (1 sec), Level 10: 20 frames (0.3 sec)
    const currentInterval = Math.max(20, 60 - (this.level * 4));

    if (this.spawnTimer >= currentInterval) {
      this.spawnItem();
      this.spawnTimer = 0;
    }

    // 2. Move Items & Collision
    for (let i = this.items.length - 1; i >= 0; i--) {
      let item = this.items[i];
      // Fall speed increases with level
      item.y += item.speed + (this.level * 0.5);

      // Check Collision with Basket (Basket Y is approx 500-550)
      if (item.y > 500 && item.y < 550) {
        // Check X Zone
        if (Math.abs(item.x - this.ZONES[this.basketPosition]) < 50) {
          this.handleCollision(item);
          this.items.splice(i, 1);
          continue;
        }
      }

      // Remove if off screen (Height 600)
      if (item.y > 650) {
        this.items.splice(i, 1);
      }
    }
  }

  spawnItem() {
    const keys = Object.keys(this.ZONES);
    const randomZone = keys[Math.floor(Math.random() * keys.length)];
    const x = this.ZONES[randomZone];

    const rand = Math.random();
    const typeObj = rand < 0.7 ? this.ITEM_TYPES[0] : this.ITEM_TYPES[1]; // 70% Apple

    this.items.push({
      x: x,
      y: -50, // Start slightly above screen
      type: typeObj.type,
      icon: typeObj.icon,
      score: typeObj.score,
      speed: 3
    });
  }

  handleCollision(item) {
    if (item.type === "BOMB") {
      this.gameOver();
    } else {
      this.score += item.score;
      // Level up every 1000 points
      this.level = 1 + Math.floor(this.score / 1000);
    }
  }

  // Handle Pose Input
  onPoseDetected(poseLabel) {
    // Normalize label (user might have 'center', 'Right', etc.)
    const label = (poseLabel || "").toUpperCase();

    if (label.includes("LEFT")) this.basketPosition = "LEFT";
    else if (label.includes("RIGHT")) this.basketPosition = "RIGHT";
    else if (label.includes("CENTER")) this.basketPosition = "CENTER";
  }

  // Draw Game
  render(ctx) {
    if (!this.isGameActive) return;

    // Use larger fonts for 600px screen
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 1. Draw Basket
    const basketX = this.ZONES[this.basketPosition];
    const basketY = 530;

    ctx.font = "60px Arial"; // Basket Icon Size
    ctx.fillText("🧺", basketX, basketY);

    // 2. Draw Items
    ctx.font = "50px Arial"; // Item Icon Size
    for (let item of this.items) {
      ctx.fillText(item.icon, item.x, item.y);
    }

    // 3. Draw HUD
    ctx.fillStyle = "white"; // White text background for visibility
    ctx.fillRect(0, 0, 150, 80);

    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Score: ${this.score}`, 10, 25);
    ctx.fillText(`Time: ${this.timeLimit}`, 10, 50);
    ctx.fillText(`Level: ${this.level}`, 10, 75);
  }
}

// Export
window.GameEngine = GameEngine;
