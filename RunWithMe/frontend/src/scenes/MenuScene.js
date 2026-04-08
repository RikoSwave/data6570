import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const user = window.gameState.currentUser;
        
        this.add.text(400, 50, `Welcome, ${user.name}!`, { fontSize: '32px', fill: '#000', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(400, 90, `Coins: ${user.coins} | Best Distance: ${user.longest_distance}m`, { fontSize: '20px', fill: '#000' }).setOrigin(0.5);

        // Display Player and active mount
        this.add.image(350, 200, 'player_placeholder').setScale(1.5);
        this.add.image(450, 215, 'mount_placeholder').setScale(1.5);

        const startBtn = this.add.text(400, 300, 'START RUN', { fontSize: '32px', fill: '#FFF', backgroundColor: '#4CAF50', padding: { x: 20, y: 10 } })
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => this.scene.start('GameScene'));
            
        const storeBtn = this.add.text(300, 360, 'Store', { fontSize: '24px', fill: '#FFF', backgroundColor: '#FF9800', padding: { x: 10, y: 5 } })
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => this.scene.start('StoreScene'));
            
        const barnBtn = this.add.text(500, 360, 'Barn', { fontSize: '24px', fill: '#FFF', backgroundColor: '#9C27B0', padding: { x: 10, y: 5 } })
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => this.scene.start('BarnScene'));
    }
}
