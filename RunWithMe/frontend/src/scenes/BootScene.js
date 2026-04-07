import Phaser from 'phaser';
import { createPlaceholders, getUsers, createUser } from '../api.js';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        createPlaceholders(this);
    }

    create() {
        this.add.text(400, 200, 'Loading Run With Me...', { fontSize: '32px', fill: '#FFF' }).setOrigin(0.5);
        this.checkLogin();
    }

    async checkLogin() {
        try {
            const users = await getUsers();
            this.showLoginUI(users);
        } catch (error) {
            console.error("Failed to connect to backend", error);
            setTimeout(() => this.checkLogin(), 3000);
        }
    }

    showLoginUI(users) {
        const uiLayer = document.getElementById('ui-layer');
        const uiContent = document.getElementById('ui-content');
        uiLayer.style.display = 'block';
        
        let html = `<div class="glass-panel" style="margin: 5% auto; text-align:center; max-width:400px;">
            <h1>Welcome to Run With Me!</h1>
        `;

        if (users.length > 0) {
            html += `<h3>Select your character:</h3><div>`;
            users.forEach(u => {
                html += `<button class="btn" id="login-btn-${u.id}">${u.name}</button>`;
            });
            html += `</div><hr style="margin: 15px 0" /><h2>OR</h2>`;
        }

        html += `
            <h3>Create a new character!</h3>
            <div class="form-group" style="text-align: left;">
                <label>Name:</label>
                <input type="text" id="new-char-name" placeholder="E.g. Timmy" />
            </div>
            <div class="form-group" style="text-align: left;">
                 <label>Boy or Girl:</label>
                 <select id="new-char-gender"><option value="boy">Boy</option><option value="girl">Girl</option></select>
            </div>
            <div class="form-group" style="text-align: left;">
                 <label>Starting Mount Name:</label>
                 <input type="text" id="mount-name" placeholder="E.g. Rex" />
            </div>
            <div class="form-group" style="text-align: left;">
                 <label>Mount Animal:</label>
                 <select id="mount-animal">
                    <option value="dinosaur">Dinosaur</option>
                    <option value="pig">Pig</option>
                    <option value="wingless dragon">Wingless Dragon</option>
                    <option value="unicorn">Unicorn</option>
                    <option value="cat">Cat</option>
                    <option value="dog">Dog</option>
                 </select>
            </div>
            <button class="btn" id="create-btn" style="width:100%; margin-top: 10px;">Create Profile!</button>
        </div>`;

        uiContent.innerHTML = html;

        users.forEach(u => {
            document.getElementById(`login-btn-${u.id}`).addEventListener('click', () => {
                window.gameState.currentUser = u;
                uiLayer.style.display = 'none';
                this.scene.start('MenuScene');
            });
        });

        document.getElementById('create-btn').addEventListener('click', async () => {
            const name = document.getElementById('new-char-name').value;
            const gender = document.getElementById('new-char-gender').value;
            const mountName = document.getElementById('mount-name').value;
            const mountAnimal = document.getElementById('mount-animal').value;

            if (!name || !mountName) {
                alert("Please enter a name and a mount name!");
                return;
            }

            try {
                const newUser = await createUser({
                    name: name,
                    gender: gender,
                    hair_style: "default",
                    face_style: "default",
                    shirt_color: "blue",
                    starting_mount: {
                        name: mountName,
                        animal_type: mountAnimal,
                        cosmetic_variant: 1
                    }
                });
                window.gameState.currentUser = newUser;
                uiLayer.style.display = 'none';
                this.scene.start('MenuScene');
            } catch (err) {
                alert("Could not create user. Maybe the name is taken?");
            }
        });
    }
}
