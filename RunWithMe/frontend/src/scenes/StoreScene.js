import Phaser from 'phaser';
import { buyItem } from '../api.js';

export default class StoreScene extends Phaser.Scene {
    constructor() {
        super('StoreScene');
    }

    create() {
        this.user = window.gameState.currentUser;
        
        this.cameras.main.setBackgroundColor('#FFFACD');
        
        this.add.text(400, 30, 'Store', { fontSize: '40px', fill: '#000', fontStyle: 'bold' }).setOrigin(0.5);
        this.coinText = this.add.text(400, 70, `Coins: ${this.user.coins}`, { fontSize: '24px', fill: '#000' }).setOrigin(0.5);

        this.isUIOpen = false;

        let gfx = this.add.graphics();
        gfx.fillStyle(0xffffff, 1);
        gfx.fillCircle(4, 4, 4);
        gfx.generateTexture('particle', 8, 8);
        gfx.destroy();

        const makeBtn = (x, y, text, cost, callback) => {
            let color = this.user.coins >= cost ? '#4CAF50' : '#888';
            let btn = this.add.text(x, y, `${text} (${cost}c)`, { fontSize: '20px', fill: '#FFF', backgroundColor: color, padding: 10 })
                .setOrigin(0.5);
            btn.setDepth(10);
            if (this.user.coins >= cost) {
                btn.setInteractive().on('pointerdown', async () => {
                    if (this.isUIOpen) return;
                    btn.setTint(0xcccccc);
                    await callback(btn);
                    btn.clearTint();
                });
            }
            return btn;
        };

        let boostCost = 10 * Math.pow(3, this.user.speed_boost_level);
        makeBtn(400, 130, `Speed Boost Lvl ${this.user.speed_boost_level + 1}`, boostCost, (btn) => this.purchase('upgrade', 'speed_boost', boostCost, btn));

        let jumpCost = 10 * Math.pow(3, this.user.jump_height_level);
        makeBtn(400, 180, `Jump Height Lvl ${this.user.jump_height_level + 1}`, jumpCost, (btn) => this.purchase('upgrade', 'jump_height', jumpCost, btn));

        let glideCost = 10 * Math.pow(3, this.user.glide_level);
        makeBtn(400, 230, `Gliding Lvl ${this.user.glide_level + 1}`, glideCost, (btn) => this.purchase('upgrade', 'glide', glideCost, btn));

        if (this.user.max_barn_stalls < 6) {
            let stallCost = this.user.max_barn_stalls * 50;
            let stallBtn = makeBtn(400, 280, `Unlock Barn Stall`, stallCost, () => this.purchaseBarnStall(stallCost, stallBtn));
        } else {
            this.add.text(400, 280, `Max Barn Stalls Reached!`, { fontSize: '20px', fill: '#000' }).setOrigin(0.5);
        }

        this.add.text(400, 350, 'Back to Menu', { fontSize: '24px', fill: '#FFF', backgroundColor: '#F44336', padding: 10 })
            .setOrigin(0.5).setInteractive().on('pointerdown', () => { 
                if (!this.isUIOpen) this.scene.start('MenuScene'); 
            });
    }

    async purchase(itemType, itemName, cost, btn) {
        try {
            const updated = await buyItem(this.user.id, {
                item_type: itemType,
                item_name: itemName,
                cost: cost
            });
            window.gameState.currentUser = updated;
            this.showFireworkAndRestart(btn.x, btn.y);
        } catch (e) {
            alert("Could not buy item. " + (e.response?.data?.detail || e.message));
        }
    }

    purchaseBarnStall(cost, btn) {
        this.isUIOpen = true;
        const uiLayer = document.getElementById('ui-layer');
        const uiContent = document.getElementById('ui-content');
        uiLayer.style.display = 'block';

        const animalTypes = ["dinosaur", "pig", "wingless dragon", "unicorn", "cat", "dog"];
        
        let html = `<div class="glass-panel" style="margin: 5% auto; text-align:center; max-width:400px;">
            <h3>Unlock Barn Stall</h3>
            <div class="form-group" style="text-align: left;">
                 <label>Mount Animal:</label>
                 <select id="new-mount-animal" style="width:100%; padding: 5px; margin-top: 5px; margin-bottom: 10px;">
                    ${animalTypes.map(t => `<option value="${t}">${t}</option>`).join('')}
                 </select>
            </div>
            <div class="form-group" style="text-align: left;">
                 <label>Mount Name:</label>
                 <input type="text" id="new-mount-name" placeholder="E.g. Buddy" style="width:100%; padding: 5px; margin-top: 5px; margin-bottom: 10px;" />
            </div>
            <button class="btn" id="confirm-btn" style="width:100%; margin-top: 10px; padding: 10px; cursor: pointer;">Confirm Unlock (${cost}c)</button>
            <button class="btn btn-cancel" id="cancel-btn" style="width:100%; margin-top: 10px; padding: 10px; cursor: pointer; background-color: #f44336; color: white; border: none;">Cancel</button>
        </div>`;

        uiContent.innerHTML = html;

        document.getElementById('confirm-btn').addEventListener('click', () => {
            const animalType = document.getElementById('new-mount-animal').value;
            const mountName = document.getElementById('new-mount-name').value;
            if (!mountName) {
                alert("Please enter a name for your mount!");
                return;
            }
            uiLayer.style.display = 'none';
            this.isUIOpen = false;
            this.purchaseBarnStallConfirmed(cost, animalType, mountName, btn);
        });

        document.getElementById('cancel-btn').addEventListener('click', () => {
            uiLayer.style.display = 'none';
            this.isUIOpen = false;
        });
    }

    async purchaseBarnStallConfirmed(cost, animalType, mountName, btn) {
        try {
            const updated = await buyItem(this.user.id, {
                item_type: 'barn_stall',
                item_name: 'new_stall',
                cost: cost,
                animal_type: animalType,
                cosmetic_variant: Phaser.Math.Between(1, 3), // rand
                mount_name: mountName
            });
            window.gameState.currentUser = updated;
            this.showFireworkAndRestart(btn.x, btn.y);
        } catch (e) {
             alert("Could not buy stall. " + (e.response?.data?.detail || e.message));
        }
    }

    showFireworkAndRestart(x, y) {
        let emitter = this.add.particles(x, y, 'particle', {
            speed: { min: 300, max: 900 },
            angle: { min: 0, max: 360 },
            scale: { start: 2, end: 0 },
            blendMode: 'ADD',
            lifespan: { min: 1500, max: 2500 },
            gravityY: 800,
            tint: [ 0xE91E63, 0x9C27B0, 0x3F51B5, 0x009688, 0xDD0000 ],
            emitting: false
        });
        emitter.setDepth(5); // Appears behind the buttons which are at depth 10
        emitter.explode(120);
        
        // Wait for the fireworks to finish before restarting the scene
        this.time.delayedCall(1800, () => {
            this.scene.restart();
        });
    }
}
