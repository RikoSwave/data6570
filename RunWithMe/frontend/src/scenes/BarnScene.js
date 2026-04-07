import Phaser from 'phaser';
import { setActiveMount } from '../api.js';

export default class BarnScene extends Phaser.Scene {
    constructor() {
        super('BarnScene');
    }

    create() {
        this.user = window.gameState.currentUser;
        this.cameras.main.setBackgroundColor('#DEB887');
        
        this.mounts = this.user.mounts;
        this.currentIndex = 0;

        this.titleText = this.add.text(400, 30, 'The Barn', { fontSize: '40px', fill: '#000', fontStyle: 'bold' }).setOrigin(0.5);
        this.nameText = this.add.text(400, 80, '', { fontSize: '28px', fill: '#000' }).setOrigin(0.5);
        this.infoText = this.add.text(400, 110, '', { fontSize: '20px', fill: '#000' }).setOrigin(0.5);

        this.mountImage = this.add.image(400, 200, 'mount_placeholder').setScale(3);
        
        this.leftArrow = this.add.text(100, 200, '<', { fontSize: '64px', fill: '#000', backgroundColor: '#FFF', padding: 10 })
            .setOrigin(0.5).setInteractive().on('pointerdown', () => this.changeIndex(-1));
            
        this.rightArrow = this.add.text(700, 200, '>', { fontSize: '64px', fill: '#000', backgroundColor: '#FFF', padding: 10 })
            .setOrigin(0.5).setInteractive().on('pointerdown', () => this.changeIndex(1));

        let petBtn = this.add.text(300, 310, 'PET', { fontSize: '24px', fill: '#FFF', backgroundColor: '#E91E63', padding: 10 })
            .setOrigin(0.5).setInteractive().on('pointerdown', () => this.showHearts());
            
        let feedBtn = this.add.text(500, 310, 'FEED', { fontSize: '24px', fill: '#FFF', backgroundColor: '#8BC34A', padding: 10 })
            .setOrigin(0.5).setInteractive().on('pointerdown', () => this.showHearts());

        this.selectBtn = this.add.text(400, 350, 'Select to Ride', { fontSize: '24px', fill: '#FFF', backgroundColor: '#2196F3', padding: 10 })
            .setOrigin(0.5).setInteractive().on('pointerdown', () => this.selectCurrentMount());

        this.add.text(400, 395, 'Back to Menu', { fontSize: '18px', fill: '#FFF', backgroundColor: '#F44336', padding: 5 })
            .setOrigin(0.5, 1).setInteractive().on('pointerdown', () => this.scene.start('MenuScene'));
            
        this.updateDisplay();
    }

    changeIndex(dir) {
        if (dir < 0 && this.currentIndex === 0) {
            this.scene.start('MenuScene');
            return;
        }
        
        let maxIndex = this.user.max_barn_stalls - 1;
        this.currentIndex += dir;
        
        if (this.currentIndex < 0) this.currentIndex = 0;
        if (this.currentIndex > maxIndex) {
            this.currentIndex = maxIndex;
        }
        
        this.updateDisplay();
    }

    updateDisplay() {
        let isOwned = this.currentIndex < this.mounts.length;
        
        if (isOwned) {
            let m = this.mounts[this.currentIndex];
            this.mountImage.setVisible(true);
            this.nameText.setText(`Stall: ${m.name}`);
            this.infoText.setText(`${m.animal_type} (Variant ${m.cosmetic_variant})`);
            
            if (this.user.active_mount_id === m.id) {
                this.selectBtn.setText("Currently Selected").setBackgroundColor('#888');
            } else {
                this.selectBtn.setText("Select to Ride").setBackgroundColor('#2196F3');
            }
            this.selectBtn.setVisible(true);
        } else {
            this.mountImage.setVisible(false);
            this.nameText.setText(`Empty Stall ${this.currentIndex + 1}`);
            this.infoText.setText(`Unlock more mounts in the Store!`);
            this.selectBtn.setVisible(false);
        }
    }

    async selectCurrentMount() {
        let m = this.mounts[this.currentIndex];
        if (m && this.user.active_mount_id !== m.id) {
            if (window.confirm(`Would you like to ride ${m.name}?`)) {
                try {
                    const updated = await setActiveMount(this.user.id, m.id);
                    window.gameState.currentUser = updated;
                    this.updateDisplay();
                } catch (e) {
                    console.error("Could not set mount", e);
                }
            }
        }
    }

    showHearts() {
        if (this.currentIndex >= this.mounts.length) return;
        
        const hearts = this.add.particles(400, 200, 'coin_placeholder', {
            speed: 100,
            lifespan: 1500,
            gravityY: -200,
            scale: { start: 0.5, end: 0 },
            tint: 0xFF1493,
            quantity: 1,
            frequency: 200
        });
        
        setTimeout(() => hearts.destroy(), 1500);
    }
}
