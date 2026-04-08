import Phaser from 'phaser';
import { saveRun } from '../api.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        this.user = window.gameState.currentUser;
        this.distance = 0;
        this.coinsCollected = 0;
        this.speedX = -200 - (this.user.speed_boost_level * 10);
        this.isGameOver = false;

        // Background
        this.cameras.main.setBackgroundColor('#87ceeb');

        // Dynamic Ground (Platforms)
        this.platforms = this.physics.add.group();
        let p1 = this.platforms.create(400, 400, 'ground_placeholder');
        p1.setImmovable(true);
        p1.body.allowGravity = false;

        // Player setup (Player is now the mount for physics, rider is drawn on top)
        this.player = this.physics.add.sprite(100, 300, 'mount_placeholder');
        this.rider = this.add.sprite(100, 280, 'player_placeholder');
        
        this.physics.add.collider(this.player, this.platforms);
        this.player.setCollideWorldBounds(false); // Let them fall into pits

        this.obstacles = this.physics.add.group();
        this.coins = this.physics.add.group();

        this.physics.add.collider(this.obstacles, this.platforms);
        
        // Collisions
        this.physics.add.collider(this.player, this.obstacles);
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);

        // Inputs
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Handle jump with touch/click
        this.input.on('pointerdown', () => {
            this.jump();
        }, this);
        
        this.input.on('pointerup', () => {
            this.jumpRelease();
        }, this);

        // UI
        this.scoreText = this.add.text(10, 10, 'Distance: 0m', { fontSize: '24px', fill: '#000', fontStyle: 'bold' });
        this.coinText = this.add.text(10, 40, 'Coins: 0', { fontSize: '24px', fill: '#000', fontStyle: 'bold' });

        // Spawners
        this.time.addEvent({ delay: 1500, callback: this.spawnObstacle, callbackScope: this, loop: true });
        this.time.addEvent({ delay: 1600, callback: this.spawnCoin, callbackScope: this, loop: true });
    }

    jump() {
        if (this.player.body.touching.down && !this.isGameOver) {
            let jumpVel = -600 - (this.user.jump_height_level * 50);
            this.player.setVelocityY(jumpVel);
        }
    }

    jumpRelease() {
        if (this.player.body.velocity.y < 0 && !this.isGameOver) {
            this.player.setVelocityY(this.player.body.velocity.y * 0.4);
        }
    }

    update(time, delta) {
        if (this.isGameOver) return;

        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
            this.jump();
        }

        if (Phaser.Input.Keyboard.JustUp(this.cursors.up) || Phaser.Input.Keyboard.JustUp(this.cursors.space)) {
            this.jumpRelease();
        }

        // If gliding upgrade is unlocked, handle holding jump
        let isHoldingJump = this.cursors.up.isDown || this.cursors.space.isDown || this.input.activePointer.isDown;
        if (this.user.glide_level > 0 && isHoldingJump && this.player.body.velocity.y > 0) {
            this.player.body.gravity.y = -800; // Counteract gravity somewhat
        } else {
            this.player.body.gravity.y = 0;
        }

        // Rider follows mount
        this.rider.setPosition(this.player.x, this.player.y - 20);

        // Check for falling in pit
        if (this.player.y > 450) {
            this.hitObstacle();
        }

        this.distance += (delta / 1000) * 10;
        this.scoreText.setText('Distance: ' + Math.floor(this.distance) + 'm');
        
        this.speedX -= (delta / 1000) * 0.5;

        // Platform management
        let rightmostX = 0;
        this.platforms.getChildren().forEach(p => {
            p.setVelocityX(this.speedX);
            if (p.x < -400) p.destroy();
            else if (p.x + 400 > rightmostX) rightmostX = p.x + 400;
        });

        // Spawn new platforms continuously to create gaps
        if (rightmostX < 900) {
            let gap = Phaser.Math.Between(60, 200);
            let p = this.platforms.create(rightmostX + gap + 400, 400, 'ground_placeholder');
            p.setImmovable(true);
            p.body.allowGravity = false;
            p.setVelocityX(this.speedX);
        }

        // Cleanup offscreen objects
        this.obstacles.getChildren().forEach(obs => {
            if (obs.x < -50) obs.destroy();
            else obs.setVelocityX(this.speedX); // Ensure moving at speedX
        });
        this.coins.getChildren().forEach(c => {
            if (c.x < -50) c.destroy();
        });
        
        // Pushed back by obstacle logic (like running into something indestructible but not lethal? Wait, requirements say: "User can run into obstacles, but there character will be stopped. If they stay there and the screen would move on, their run ends. Player will slowly make their way back...")
        // Since we are using standard arcade physics, the player gets pushed left by obstacle velocity.
        if (this.player.x < 10) {
            this.hitObstacle(); // Screen moved on
        } else if (this.player.x < 100) {
            this.player.setVelocityX(50); // slowly recover
        } else {
            this.player.setVelocityX(0);
            this.player.setX(100);
        }
    }

    spawnObstacle() {
        if (this.isGameOver) return;
        let obs = this.obstacles.create(850, 360, 'obstacle_placeholder');
        obs.setVelocityX(this.speedX);
        obs.setImmovable(true);
        obs.body.setSize(20, 20); // Make hitbox forgiving
    }

    spawnCoin() {
        if (this.isGameOver) return;
        let y = Phaser.Math.Between(200, 320);
        let coin = this.coins.create(850, y, 'coin_placeholder');
        coin.body.allowGravity = false;
        coin.setVelocityX(this.speedX);
    }

    collectCoin(player, coin) {
        coin.destroy();
        this.coinsCollected++;
        this.coinText.setText('Coins: ' + this.coinsCollected);
    }

    async hitObstacle() {
        if (this.isGameOver) return; // Prevent multiple triggers
        this.isGameOver = true;
        this.physics.pause();
        this.player.setTint(0xff0000);
        
        this.add.text(400, 150, 'GAME OVER!', { fontSize: '56px', fill: '#F00', fontStyle: 'bold' }).setOrigin(0.5);
        const savingText = this.add.text(400, 210, 'Saving run...', { fontSize: '24px', fill: '#000' }).setOrigin(0.5);

        try {
            const updatedUser = await saveRun(this.user.id, this.coinsCollected, Math.floor(this.distance));
            window.gameState.currentUser = updatedUser;
            savingText.setText('Run Saved!');
        } catch (e) {
            console.error("Save failed", e);
            savingText.setText('Failed to save run. :(');
        }

        const btn = this.add.text(400, 280, 'Click Anywhere to Continue', { fontSize: '28px', fill: '#000', backgroundColor: '#FFF', padding: 10 }).setOrigin(0.5);
        
        let canClick = false;
        setTimeout(() => canClick = true, 500); // Prevent accidental immediate clicking

        this.input.on('pointerdown', () => {
            if (canClick) {
                this.scene.start('MenuScene');
            }
        });
    }
}
