const keys = {};
window.addEventListener('keydown', e => {
    keys[e.code] = true;

    // Pause / Play toggle via Escape key
    if (e.code === 'Escape' && !gameIsOver && document.getElementById('start-screen').classList.contains('hidden')) {
        togglePause();
    }
});

function togglePause() {
    gameIsPaused = !gameIsPaused;
    if (gameIsPaused) {
        document.getElementById('pause-screen').classList.remove('hidden');
    } else {
        document.getElementById('pause-screen').classList.add('hidden');
    }
}
window.addEventListener('keyup', e => keys[e.code] = false);

// Key mappings based on user request
const P1_CTRL = { left: 'KeyA', right: 'KeyD', jump: 'KeyW', shoot: 'KeyF', weapon: 'KeyG' };
const P2_CTRL = { left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp', shoot: 'KeyO', weapon: 'KeyP' };

const GRAVITY = 0.15; // Eski yavaş yerçekimine dönüldü
const FRICTION = 0.8; 
const MAX_VELOCITY = 3; // Hız %50 düşürüldü
const JUMP_POWER = -5.5; // Eski zıplama gücü

// Standart Kararlı Çözünürlük
const map = {
    width: 1000, height: 700,
    platforms: []
};

const mapData = [
    // 0: Klasik Arena (Piramit şeklinde tepeye doğru daralan simetrik yapı)
    (w, h) => [
        { x: 0, y: h - 30, w: w, h: 30 }, // Zemin
        { x: 100, y: h - 120, w: 300, h: 14 }, // Sol alt
        { x: 600, y: h - 120, w: 300, h: 14 }, // Sağ alt
        { x: 300, y: h - 210, w: 400, h: 14 }, // Orta Merkez
        { x: 50, y: h - 300, w: 200, h: 14 }, // Sol Orta
        { x: 750, y: h - 300, w: 200, h: 14 }, // Sağ Orta
        { x: 400, y: h - 390, w: 200, h: 14 }, // Orta ÜST
        { x: 150, y: h - 480, w: 150, h: 14 }, // Sol Tepe
        { x: 700, y: h - 480, w: 150, h: 14 }, // Sağ Tepe
        { x: 450, y: h - 570, w: 100, h: 14 }  // En Zirve Noktası
    ],
    // 1: Tehlikeli Çukur (Ortası boşluk, yanlarda adalar)
    (w, h) => [
        { x: 0, y: h - 30, w: 300, h: 30 }, // Sol zemin
        { x: 700, y: h - 30, w: 300, h: 30 }, // Sağ zemin
        { x: 0, y: h - 120, w: 200, h: 14 },
        { x: 800, y: h - 120, w: 200, h: 14 },
        { x: 0, y: h - 210, w: 150, h: 14 },
        { x: 850, y: h - 210, w: 150, h: 14 },
        // Uçan merkez köprü ve basamakları (Atlanabilir şekilde yeniden düzenlendi)
        { x: 220, y: h - 260, w: 140, h: 14 },
        { x: 640, y: h - 260, w: 140, h: 14 },
        { x: 360, y: h - 340, w: 280, h: 14 },
        // En üstte güvenli alan
        { x: 420, y: h - 420, w: 160, h: 14 }
    ],
    // 2: Kafes Labirent (Hem ortadan hem yanlardan geçiş olan, kapalı ve açık katlı kompleks arena)
    (w, h) => [
        { x: 0, y: h - 30, w: w, h: 30 }, // Zemin

        // Kat 1 (Kenarlar tamamen kapalı, sadece ortadan üst kata çıkış var)
        { x: 0, y: h - 120, w: 400, h: 14 },
        { x: 600, y: h - 120, w: 400, h: 14 },
        { x: 0, y: h - 160, w: 10, h: 54 },     // Sol duvar (Wrap engeller)
        { x: 990, y: h - 160, w: 10, h: 54 },   // Sağ duvar (Wrap engeller)

        // Kat 2 (A Tipi Basamak: Ortada ve yanlarda parça)
        { x: 100, y: h - 210, w: 200, h: 14 },
        { x: 400, y: h - 210, w: 200, h: 14 },
        { x: 700, y: h - 210, w: 200, h: 14 },

        // Kat 3 (B Tipi Basamak: Kenarlar kapalı, 3 boşluklu)
        { x: 0, y: h - 300, w: 150, h: 14 },
        { x: 250, y: h - 300, w: 200, h: 14 },
        { x: 550, y: h - 300, w: 200, h: 14 },
        { x: 850, y: h - 300, w: 150, h: 14 },
        { x: 0, y: h - 340, w: 10, h: 54 },     // Sol duvar
        { x: 990, y: h - 340, w: 10, h: 54 },   // Sağ duvar

        // Kat 4 (A Tipi Basamak tekrarı)
        { x: 100, y: h - 390, w: 200, h: 14 },
        { x: 400, y: h - 390, w: 200, h: 14 },
        { x: 700, y: h - 390, w: 200, h: 14 },

        // Kat 5 (B Tipi Basamak tekrarı)
        { x: 0, y: h - 480, w: 150, h: 14 },
        { x: 250, y: h - 480, w: 200, h: 14 },
        { x: 550, y: h - 480, w: 200, h: 14 },
        { x: 850, y: h - 480, w: 150, h: 14 },
        { x: 0, y: h - 520, w: 10, h: 54 },
        { x: 990, y: h - 520, w: 10, h: 54 },

        // Kat 6 (Zirve, minik kontrol adaları)
        { x: 300, y: h - 570, w: 100, h: 14 },
        { x: 600, y: h - 570, w: 100, h: 14 }
    ]
];

function buildFixedMap(index) {
    map.platforms = mapData[index](map.width, map.height);
}

// Gelişmiş Gerçekçi Ses Üretimi (Dışarıdan dosya çekmeyi ve tarayıcı engelini aşmak için)
let audioCtx;
let noiseBuffer;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        // Beyaz gürültü (Silah patlaması için ham ses) oluşturuyoruz
        const bufferSize = audioCtx.sampleRate * 2;
        noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

window.addEventListener('keydown', initAudio);
window.addEventListener('click', () => {
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
    }
}, { once: true });

function playShootSound(type) {
    if (!audioCtx) return;

    // Gürültü kaynağını bağla
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;

    // Sesi şekillendirmek ve patlama hissiyatı vermek için Filtre
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';

    // Ses şiddeti eğrisi
    const gainNode = audioCtx.createGain();

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const t = audioCtx.currentTime;

    if (type === 'pistol') {
        filter.frequency.value = 1500; // Standart barut patlaması
        gainNode.gain.setValueAtTime(1, t);
        gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.15); // Kısa yankı
        noise.start(t);
        noise.stop(t + 0.15);
    }
    else if (type === 'shotgun') {
        filter.frequency.value = 500; // Çok kalın patlama (Boom!)
        gainNode.gain.setValueAtTime(1.5, t);
        gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.35); // Uzun yankı
        noise.start(t);
        noise.stop(t + 0.35);
    }
    else if (type === 'machinegen') {
        filter.frequency.value = 2000; // İnce ve çok keskin tiz patlama
        gainNode.gain.setValueAtTime(0.7, t);
        gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.08); // Çok çok kısa (Seri)
        noise.start(t);
        noise.stop(t + 0.08);
    }
}

const WEAPONS = {
    // pistol: Orta hasar, yavaş atış
    pistol: { name: 'Pistol', color: '#bdc3c7', damage: 15, fireRate: 30, speed: 12, maxAmmo: Infinity, spread: 0 },
    // shotgun: Tek isabette 5 saçma. Hızı artırıldı.
    shotgun: { name: 'Shotgun', color: '#e74c3c', damage: 8, fireRate: 40, speed: 14, maxAmmo: 25, spread: 0.15 },
    // machinegun: Düşük hasar (4), çok hızlı ateş (Makinalı!)
    machinegen: { name: 'Machine Gun', color: '#f39c12', damage: 4, fireRate: 6, speed: 16, maxAmmo: 60, spread: 0.05 },
    // grenadelauncher: Süre bitince patlayıp alan hasarı vuran bomba. Atış hızı yavaşlatıldı (fireRate arttı).
    grenadelauncher: { name: 'Bomba Atar', color: '#27ae60', damage: 45, fireRate: 65, speed: 11, maxAmmo: 8, spread: 0 },
    // rocketlauncher: Anında patlayan füze. Çok yüksek hasar ve itiş. (Gidişi %50 yavaşlatıldı)
    rocketlauncher: { name: 'Füze', color: '#a55eea', damage: 75, fireRate: 80, speed: 8, maxAmmo: 5, spread: 0 }
};

class Player {
    constructor(x, y, color, controls, uiPrefix) {
        this.x = x; this.y = y; this.w = 20; this.h = 28;
        this.vx = 0; this.vy = 0;
        this.color = color;
        this.controls = controls;
        this.uiPrefix = uiPrefix;

        this.hp = 100; // Canlar tekrar 100'e çekildi
        this.facing = 1; // 1 = right, -1 = left
        this.onGround = false;
        this.canJump = true;

        // Silah Sistemi (Sadece 1 silah taşıyabilir, boş isen pistol)
        this.currentWeapon = null; // null represents pistol fallback
        this.currentAmmo = 0;

        this.cooldown = 0;
        this.weaponSwapCooldown = 0;

        // Gamepad State tracking (to prevent repeat jump/interact)
        this.gamepadIndex = uiPrefix === 'p1' ? 0 : 1;
        this.prevGamepadButtons = {};
        this.isBot = false;
    }

    interactWithItems() {
        for (let i of items) {
            if (i.active &&
                this.x < i.x + i.w && this.x + this.w > i.x &&
                this.y < i.y + i.h && this.y + this.h > i.y) {

                if (i.mode === 'health') {
                    // Can Kutusu
                    this.hp += 50;
                    if (this.hp > 100) this.hp = 100;
                } else if (i.mode === 'ammo') {
                    // Mermi Kutusu (Eğer elinde özel silah varsa bir şarjör ekle)
                    if (this.currentWeapon) {
                        this.currentAmmo += WEAPONS[this.currentWeapon].maxAmmo;
                    }
                } else {
                    // Eğer elimizde farklı bir silah varsa (Pistol hariç) mermisiyle birlikte yere fırlat
                    if (this.currentWeapon) {
                        items.push(new Item(this.x, this.y, 'dropped', this.currentWeapon, this.currentAmmo));
                    }

                    // Yerdeki silahı veya sandığı al
                    if (i.mode === 'mystery') {
                        // Sandıktan çıkan silahların oranları (2:2:3:3)
                        let types = [
                            'grenadelauncher', 'grenadelauncher', 
                            'rocketlauncher', 'rocketlauncher', 
                            'shotgun', 'shotgun', 'shotgun', 
                            'machinegen', 'machinegen', 'machinegen'
                        ];
                        this.currentWeapon = types[Math.floor(Math.random() * types.length)];
                        this.currentAmmo = WEAPONS[this.currentWeapon].maxAmmo;
                    } else if (i.mode === 'dropped') {
                        // Yere düşen silahı mermisiyle aynı şekilde donan
                        this.currentWeapon = i.weaponType;
                        this.currentAmmo = i.ammo;
                    }
                }

                i.active = false;
                this.weaponSwapCooldown = 20; // Silah alma bekleme süresi
                this.updateUI();
                return; // Tek seferde tek silah al
            }
        }
    }

    update() {
        if (this.hp <= 0) return;

        if (this.isBot) {
            this.botUpdate();
            return;
        }

        // --- Input Handling (Keyboard + Gamepad) ---
        let moveLeft = keys[this.controls.left];
        let moveRight = keys[this.controls.right];
        let jumpPressed = keys[this.controls.jump];
        let shootPressed = keys[this.controls.shoot];
        let weaponInteractPressed = keys[this.controls.weapon];

        const gp = navigator.getGamepads()[this.gamepadIndex];
        if (gp) {
            const deadzone = 0.3;
            // Left Stick or D-Pad
            if (gp.axes[0] < -deadzone || gp.buttons[14].pressed) moveLeft = true;
            if (gp.axes[0] > deadzone || gp.buttons[15].pressed) moveRight = true;
            
            // Buttons
            if (gp.buttons[0].pressed) jumpPressed = true; // A / Cross
            if (gp.buttons[2].pressed || gp.buttons[7].pressed > 0.1) shootPressed = true; // X / Square / RT
            if (gp.buttons[3].pressed || gp.buttons[1].pressed) weaponInteractPressed = true; // Y / Triangle / B / Circle
            
            // Pause Toggle (Start Button)
            if (gp.buttons[9].pressed && !this.prevGamepadButtons[9]) {
                if (!gameIsOver && document.getElementById('start-screen').classList.contains('hidden')) {
                    togglePause();
                }
            }
            
            // Store previous state for edge detection
            gp.buttons.forEach((btn, i) => this.prevGamepadButtons[i] = btn.pressed);
        }

        // Horizontal Movement
        if (moveLeft) { this.vx -= 0.75; this.facing = -1; }
        if (moveRight) { this.vx += 0.75; this.facing = 1; }

        this.vx *= FRICTION;

        // Clamp velocity
        if (this.vx > MAX_VELOCITY) this.vx = MAX_VELOCITY;
        if (this.vx < -MAX_VELOCITY) this.vx = -MAX_VELOCITY;

        this.vy += GRAVITY;

        // Jump (prevent holding to bounce)
        if (!jumpPressed) {
            this.canJump = true;
        }
        if (jumpPressed && this.onGround && this.canJump) {
            this.vy = JUMP_POWER;
            this.onGround = false;
            this.canJump = false;
        }

        // Apply velocity
        this.x += this.vx;
        this.y += this.vy;

        // Screen Wrap (Halkasal Kesintisiz Geçiş)
        if (this.x > map.width) { this.x -= map.width; }
        else if (this.x < 0) { this.x += map.width; }

        if (this.y > map.height) {
            this.hp = 0;
            this.updateUI();
            gameOver(this === p1 ? 'Player 1' : 'Player 2');
        }

        // Collision with platforms
        this.onGround = false;
        for (let p of map.platforms) {
            if (this.x < p.x + p.w && this.x + this.w > p.x &&
                this.y < p.y + p.h && this.y + this.h > p.y) {

                // Determine collision side
                // Was coming from top
                if (this.vy >= 0 && this.y - this.vy + this.h <= p.y + 4) { // allow small threshold for overlap error
                    this.y = p.y - this.h;
                    this.vy = 0;
                    this.onGround = true;
                }
                // Was coming from bottom
                else if (this.vy < 0 && this.y - this.vy >= p.y + p.h - 4) {
                    this.y = p.y + p.h;
                    this.vy = 0;
                }
                // Horizontal push
                else if (this.vx > 0 && this.x - this.vx + this.w <= p.x + 4) {
                    this.x = p.x - this.w;
                    this.vx = 0;
                }
                else if (this.vx < 0 && this.x - this.vx >= p.x + p.w - 4) {
                    this.x = p.x + p.w;
                    this.vx = 0;
                }
            }
        }

        // Cooldowns
        if (this.cooldown > 0) this.cooldown--;
        if (this.weaponSwapCooldown > 0) this.weaponSwapCooldown--;

        // Actions (Silah Alma / Yere Atma)
        if (weaponInteractPressed && this.weaponSwapCooldown <= 0) {
            this.interactWithItems();
        }

        if (shootPressed && this.cooldown <= 0) {
            this.shoot();
        }

        this.updateUI();
    }

    botUpdate() {
        let target = this === p1 ? p2 : p1;
        
        let moveLeft = false;
        let moveRight = false;
        let jumpPressed = false;
        let shootPressed = false;
        let weaponInteractPressed = false;

        let dx = target.x - this.x;
        let dy = target.y - this.y;
        let dist = Math.sqrt(dx*dx + dy*dy);

        if (Math.abs(dx) > map.width / 2) {
            if (dx > 0) dx -= map.width;
            else dx += map.width;
        }

        // --- 1. DODGING BULLETS ---
        // Mermilerin bize çarpıp çarpmayacağını kontrol et
        for (let b of bullets) {
            if (b.owner !== this && b.active) {
                let bx = b.x - this.x;
                let by = b.y - this.y;
                // Mermi bana doğru geliyorsa ve yaklaştıysa
                if (Math.abs(bx) < 100 && Math.abs(by) < 30 && ((b.speedX > 0 && bx < 0) || (b.speedX < 0 && bx > 0))) {
                    if (this.onGround && Math.random() < 0.6) {
                        jumpPressed = true; // Zıplayarak kaç!
                    }
                }
            }
        }

        // --- 2. ITEM FINDING (GÖREV ODAĞI) ---
        let targetItem = null;
        let itemDist = Infinity;
        
        // Kutucuklardan veya yerdeki silahlardan uzakta olanları bul
        for (let i of items) {
            if (i.active) {
                let idx = i.x - this.x;
                let idy = i.y - this.y;
                let d = Math.sqrt(idx*idx + idy*idy);
                
                // Canım azsa direkt can kutusuna git
                if (this.hp < 50 && i.mode === 'health' && d < itemDist) { targetItem = i; itemDist = d; }
                // Mermim azsa ve mermi/silah kutusu varsa ona git
                else if (this.currentAmmo < 5 && (i.mode === 'ammo' || i.mode === 'mystery' || i.mode === 'dropped') && d < itemDist) {
                    targetItem = i; itemDist = d;
                }
                // Boştaysam ve çok yakınsa (fırsatçı)
                else if (d < 150 && (i.mode === 'mystery' || i.mode === 'dropped') && this.currentWeapon === 'pistol') {
                    targetItem = i; itemDist = d;
                }
                
                // Üstünden geçiyorsam al
                if (d < 30) weaponInteractPressed = true;
            }
        }

        // --- 3. MOVEMENT & SPACING (MESAFE KORUMA) ---
        let idealDistance = 200; // Varsayılan mesafe
        if (this.currentWeapon === 'shotgun') idealDistance = 80;
        else if (this.currentWeapon === 'rocketlauncher' || this.currentWeapon === 'grenadelauncher') idealDistance = 350;

        // Hedefi belirle (Oyuncu mu Kutu mu?)
        let moveTargetX = dx; // Varsayılan oyuncuya göre deltaX
        if (targetItem) {
            moveTargetX = targetItem.x - this.x; // Kutuya öncelik ver
            idealDistance = 0; // Kutuya sıfır yanaş
        }
        
        // Eğer canım çok azsa ve oyuncudan başka hedef yoksa kaç!
        if (this.hp < 30 && !targetItem && dist < 300) {
            if (dx > 0) moveLeft = true;
            else moveRight = true;
        } else {
            // İdeal mesafeye göre hareket et (Ne çok yakın ne çok uzak)
            if (Math.abs(moveTargetX) > idealDistance + 20) {
                // Yaklaş
                if (moveTargetX < 0) moveLeft = true;
                else moveRight = true;
            } else if (Math.abs(moveTargetX) < idealDistance - 20 && !targetItem) {
                // Oyuncu çok yaklaştı, geri çekil (Kiting)
                if (moveTargetX < 0) moveRight = true;
                else moveLeft = true;
            }
        }

        // --- 4. PIT & OBSTACLE AVOIDANCE ---
        if (this.onGround) {
            let lookAheadX = this.x + (moveRight ? 40 : (moveLeft ? -40 : 0));
            if (lookAheadX > map.width) lookAheadX -= map.width;
            if (lookAheadX < 0) lookAheadX += map.width;

            let hasPlatformAhead = false;
            for (let p of map.platforms) {
                if (lookAheadX > p.x && lookAheadX < p.x + p.w && p.y >= this.y && p.y <= this.y + 140) {
                    hasPlatformAhead = true;
                    break;
                }
            }
            if (!hasPlatformAhead && (moveLeft || moveRight)) {
                jumpPressed = true; // Boşluk var zıpla
            }
        }

        // Duvara çarpınca veya hedef yukarıdaysa zıpla
        if (dy < -60 && Math.abs(dx) < 200 && this.onGround && !targetItem) {
            if (Math.random() < 0.2) jumpPressed = true;
        }
        if (this.vx === 0 && (moveLeft || moveRight) && this.onGround) {
            jumpPressed = true;
        }
        // Sağa sola giderken rastgele zıplamalar (Parkour)
        if ((moveLeft || moveRight) && this.onGround && Math.random() < 0.01) jumpPressed = true;

        // --- 5. AIM & SHOOT ---
        // Her zaman oyuncuya bak (Kaçarken bile oyuncuya döner ve sıkar)
        if (dx < -5) this.facing = -1;
        if (dx > 5) this.facing = 1;

        if (Math.abs(dy) < 80 && ((this.facing === 1 && dx > 0 && dx < 600) || (this.facing === -1 && dx < 0 && dx > -600))) {
            shootPressed = true;
        }

        // --- Execute Actions ---
        if (moveLeft) { this.vx -= 0.75; this.facing = -1; }
        if (moveRight) { this.vx += 0.75; this.facing = 1; }
        
        // Kaçarken vs ateş ederken yönü koru
        if (dx < -5) this.facing = -1;
        if (dx > 5) this.facing = 1;

        this.vx *= FRICTION;
        if (this.vx > MAX_VELOCITY) this.vx = MAX_VELOCITY;
        if (this.vx < -MAX_VELOCITY) this.vx = -MAX_VELOCITY;
        this.vy += GRAVITY;

        if (!jumpPressed) { this.canJump = true; }
        if (jumpPressed && this.onGround && this.canJump) {
            this.vy = JUMP_POWER * 1.05; 
            this.onGround = false;
            this.canJump = false;
        }

        this.x += this.vx;
        this.y += this.vy;

        if (this.x > map.width) { this.x -= map.width; }
        else if (this.x < 0) { this.x += map.width; }

        if (this.y > map.height) {
            this.hp = 0;
            this.updateUI();
            gameOver(this === p1 ? 'Player 2' : 'Player 1');
        }

        this.onGround = false;
        for (let p of map.platforms) {
            if (this.x < p.x + p.w && this.x + this.w > p.x &&
                this.y < p.y + p.h && this.y + this.h > p.y) {

                if (this.vy >= 0 && this.y - this.vy + this.h <= p.y + 4) {
                    this.y = p.y - this.h;
                    this.vy = 0;
                    this.onGround = true;
                }
                else if (this.vy < 0 && this.y - this.vy >= p.y + p.h - 4) {
                    this.y = p.y + p.h;
                    this.vy = 0;
                }
                else if (this.vx > 0 && this.x - this.vx + this.w <= p.x + 4) {
                    this.x = p.x - this.w;
                    this.vx = 0;
                }
                else if (this.vx < 0 && this.x - this.vx >= p.x + p.w - 4) {
                    this.x = p.x + p.w;
                    this.vx = 0;
                }
            }
        }

        if (this.cooldown > 0) this.cooldown--;
        if (this.weaponSwapCooldown > 0) this.weaponSwapCooldown--;
        if (weaponInteractPressed && this.weaponSwapCooldown <= 0) {
            this.interactWithItems();
        }

        // Ateş etme payı
        if (shootPressed && this.cooldown <= 0) {
            // Mermiden biraz sapma payı ve gecikme var (Human factor)
            if (Math.random() < 0.3) {
                this.shoot();
            }
        }

        this.updateUI();
    }

    shoot() {
        let wId = this.currentWeapon || 'pistol';
        let wDef = WEAPONS[wId];

        if (wId !== 'pistol') {
            if (this.currentAmmo <= 0) {
                // Mermi bittiğinde tabancaya dön
                this.currentWeapon = null;
                wId = 'pistol';
                wDef = WEAPONS[wId];
            } else {
                this.currentAmmo -= 1;
            }
        }

        this.cooldown = wDef.fireRate;

        playShootSound(wId); // Gerçek silah sesini fırlat
        
        // Gamepad Vibration (Haptic Feedback)
        const gp = navigator.getGamepads()[this.gamepadIndex];
        if (gp && gp.vibrationActuator) {
            let intensity = wId === 'pistol' ? 0.3 : (wId === 'shotgun' ? 0.8 : 1.0);
            let duration = wId === 'machinegen' ? 50 : 150;
            gp.vibrationActuator.playEffect("dual-rumble", {
                startDelay: 0,
                duration: duration,
                weakMagnitude: intensity,
                strongMagnitude: intensity * 0.5
            }).catch(() => {});
        }

        // Geri Tepme (Recoil)
        if (wId === 'shotgun') {
            this.vx -= this.facing * 5; // Güçlü geri tepme ve hafif havaya kaldırma
            this.vy -= 2;
        } else if (wId === 'rocketlauncher') {
            this.vx -= this.facing * 8; // Füzede çok daha güçlü geri tepme
            this.vy -= 3;
        } else if (wId === 'grenadelauncher') {
            this.vx -= this.facing * 3; // Orta geri tepme
            this.vy -= 1;
        } else if (wId === 'machinegen') {
            this.vx -= this.facing * 0.8; // Seri ateş ederken sürekli geriye doğru ittirir
        }

        // Generate bullets
        let bulletX = this.facing === 1 ? this.x + this.w : this.x;
        let bulletY = this.y + 14; // Aligned with the soldier's hands

        if (wId === 'shotgun') {
            bullets.push(new Bullet(bulletX, bulletY, this.facing, wId, this, -0.2));
            bullets.push(new Bullet(bulletX, bulletY, this.facing, wId, this, -0.1));
            bullets.push(new Bullet(bulletX, bulletY, this.facing, wId, this, 0));
            bullets.push(new Bullet(bulletX, bulletY, this.facing, wId, this, 0.1));
            bullets.push(new Bullet(bulletX, bulletY, this.facing, wId, this, 0.2));
        } else {
            bullets.push(new Bullet(bulletX, bulletY, this.facing, wId, this));
        }
    }

    draw(ctx) {
        this._draw(ctx);
        // Doğrudan diğer taraftan görünmesi için klon çizim (- / + map width)
        if (this.x + this.w > map.width) {
            ctx.save(); ctx.translate(-map.width, 0); this._draw(ctx); ctx.restore();
        } else if (this.x < 0) {
            ctx.save(); ctx.translate(map.width, 0); this._draw(ctx); ctx.restore();
        }
    }

    _draw(ctx) {
        if (this.hp <= 0) return;

        let cx = this.x + this.w / 2;

        // Body (Uniform based on team)
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + 2, this.y + 10, 16, 10);

        // Legs (dark boots)
        ctx.fillStyle = '#1e272e';
        ctx.fillRect(this.x + 4, this.y + 20, 5, 8);
        ctx.fillRect(this.x + 11, this.y + 20, 5, 8);

        // Backpack
        ctx.fillStyle = '#485460';
        if (this.facing === 1) ctx.fillRect(this.x - 2, this.y + 11, 4, 8);
        else ctx.fillRect(this.x + 18, this.y + 11, 4, 8);

        // Head (skin)
        ctx.fillStyle = '#f1c27d';
        ctx.fillRect(this.x + 4, this.y + 2, 12, 8);

        // Military Helmet
        ctx.fillStyle = '#4b6584';
        ctx.beginPath();
        ctx.arc(cx, this.y + 4, 7, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(this.x + 1, this.y + 3, 18, 3); // rim

        // Eye (visor / sunglasses)
        ctx.fillStyle = '#1e272e';
        if (this.facing === 1) ctx.fillRect(this.x + 10, this.y + 6, 6, 3);
        else ctx.fillRect(this.x + 4, this.y + 6, 6, 3);

        // Weapon & Hands
        let wColor = WEAPONS[this.currentWeapon || 'pistol'].color;
        ctx.fillStyle = wColor;
        if (this.facing === 1) {
            ctx.fillRect(this.x + 10, this.y + 14, 14, 4); // gun barrel
            ctx.fillStyle = '#f1c27d'; // hand
            ctx.fillRect(this.x + 8, this.y + 14, 4, 4);
        } else {
            ctx.fillRect(this.x - 4, this.y + 14, 14, 4);
            ctx.fillStyle = '#f1c27d';
            ctx.fillRect(this.x + 8, this.y + 14, 4, 4);
        }
    }

    updateUI() {
        // Tekrar 100 HP üzerinden bar güncellenir
        document.getElementById(`${this.uiPrefix}-health`).style.width = Math.max(0, this.hp) + '%';
        let wId = this.currentWeapon || 'pistol';
        let wInfo = WEAPONS[wId];
        let ammoText = wId === 'pistol' ? '∞' : this.currentAmmo;
        document.getElementById(`${this.uiPrefix}-weapon`).innerText = wInfo.name;
        document.getElementById(`${this.uiPrefix}-ammo`).innerText = ammoText;
    }
}

class Bullet {
    constructor(x, y, dir, weaponId, owner, spreadY = 0) {
        this.x = x; this.y = y;
        this.dir = dir;
        this.owner = owner;
        this.weaponId = weaponId;
        let wDef = WEAPONS[weaponId];
        this.speedX = dir * wDef.speed;
        this.speedY = dir * wDef.speed * spreadY;
        this.damage = wDef.damage;
        this.color = wDef.color;
        this.w = 5; this.h = 4;
        this.active = true;
        this.lifetime = 120; // Standart mermi ömrü

        if (this.weaponId === 'grenadelauncher') {
            this.w = 8; this.h = 8;
            this.speedY = -2; 
            this.speedX = dir * 11; // Gidiş hızı eski seviyesine döndi
            this.lifetime = 90; 
        } else if (this.weaponId === 'rocketlauncher') {
            this.w = 12; this.h = 6;
            this.speedY = 0; // Düz gider
            this.speedX = dir * 8; // Hızı 0.5 oranında yavaşlatıldı (16 -> 8)
            this.lifetime = 120; // Hız düştüğü için menzil için ömrü uzatıldı
        }
    }

    update() {
        if (this.weaponId === 'grenadelauncher') {
            this.speedY += GRAVITY;
        } else if (this.weaponId === 'rocketlauncher') {
            // No gravity for rockets
        }

        this.x += this.speedX;
        this.y += this.speedY; // Allows shotgun spread OR grenade drop

        this.lifetime--;

        if (this.lifetime <= 0) {
            if (this.weaponId === 'grenadelauncher' || this.weaponId === 'rocketlauncher') this.explode();
            this.active = false;
        }

        if (this.y < 0 || this.y > map.height) {
            this.active = false;
        }

        if (this.x > map.width) { this.x -= map.width; }
        else if (this.x < 0) { this.x += map.width; }

        // Map collision
        for (let p of map.platforms) {
            if (this.x < p.x + p.w && this.x + this.w > p.x &&
                this.y < p.y + p.h && this.y + this.h > p.y) {
                if (this.weaponId === 'grenadelauncher') {
                    // Sekme fiziği (Daha az sekiyor, daha çabuk duruyor)
                    if (this.speedY > 0 && this.y - this.speedY + this.h <= p.y + 10) {
                        this.y = p.y - this.h;
                        this.speedY *= -0.3; // Daha az seker
                        this.speedX *= 0.6;  // Yerde çabuk yavaşlar
                    } else {
                        this.speedX *= -0.3; // Duvara çarparsa az seker
                    }
                } else if (this.weaponId === 'rocketlauncher') {
                    this.explode();
                    this.active = false;
                } else {
                    this.active = false;
                }
            }
        }

        // Player collision
        let target = this.owner === p1 ? p2 : p1;
        if (target.hp > 0 && this.active &&
            this.x < target.x + target.w && this.x + this.w > target.x &&
            this.y < target.y + target.h && this.y + this.h > target.y) {
            
            if (this.weaponId === 'grenadelauncher') {
                this.speedX *= -0.2; // Sadece az seker
            } else if (this.weaponId === 'rocketlauncher') {
                this.explode();
                this.active = false;
            } else {
                target.hp -= this.damage;
                this.active = false;
                target.vx += this.dir * 4;
                target.vy -= 2;

                if (target.hp <= 0) {
                    target.hp = 0;
                    target.updateUI();
                    gameOver(target === p1 ? 'Player 1' : 'Player 2');
                }
            }
        }
    }

    explode() {
        let players = [p1, p2];
        let expRadius = this.weaponId === 'rocketlauncher' ? 120 : 90;
        let knockPower = this.weaponId === 'rocketlauncher' ? 18 : 12;
        
        explosions.push({ x: this.x + this.w/2, y: this.y + this.h/2, r: expRadius, life: 20 });
        playShootSound('shotgun'); // Patlama sesi

        for (let target of players) {
            if (target.hp <= 0) continue;
            let cx = target.x + target.w/2;
            let cy = target.y + target.h/2;
            let bx = this.x + this.w/2;
            let by = this.y + this.h/2;

            let dx = cx - bx;
            let dy = cy - by;
            let dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < expRadius) {
                target.hp -= this.damage;
                
                // Patlama merkezinden dışarı savur
                target.vx += (dx / dist) * knockPower;
                target.vy += (dy / dist) * (knockPower * 0.8) - 5; 

                if (target.hp <= 0) {
                    target.hp = 0;
                    target.updateUI();
                    gameOver(target === p1 ? 'Player 1' : 'Player 2');
                } else {
                    target.updateUI();
                }
            }
        }
    }

    draw(ctx) {
        this._draw(ctx);
        if (this.x + this.w > map.width) {
            ctx.save(); ctx.translate(-map.width, 0); this._draw(ctx); ctx.restore();
        } else if (this.x < 0) {
            ctx.save(); ctx.translate(map.width, 0); this._draw(ctx); ctx.restore();
        }
    }

    _draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.w, this.h);

        // Trail effect
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(this.x - (this.speedX * 0.5), this.y, this.w, this.h);
    }
}

class Item {
    // mode = 'mystery' (Silah Kasası) veya 'dropped' (Yere düşen silah)
    constructor(x, y, mode, weaponType = null, ammo = 0) {
        this.x = x; this.y = y;
        this.w = 20; this.h = 20;
        this.mode = mode;
        this.weaponType = weaponType;
        this.ammo = ammo;
        this.active = true;
        this.lifetime = mode === 'dropped' ? 5400 : 2700; // Yere düşen silah çok daha uzun süre durur (saniye bazında 3dk / 1.5dk)

        this.vx = 0; this.vy = 0;
        if (this.mode === 'dropped') {
            this.vx = (Math.random() - 0.5) * 6; // Yere fırlatılınca saçılma efekti
            this.vy = -6; // Yukarı doğru fırlatılır
        }
    }

    update() {
        if (this.mode === 'dropped') {
            // Fizik: Yere düşme ve sekme
            this.vy += GRAVITY;
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= FRICTION;

            // Map edge wrap (Kesintisiz Görünüm)
            if (this.x > map.width) { this.x -= map.width; }
            else if (this.x < 0) { this.x += map.width; }

            for (let p of map.platforms) {
                if (this.x < p.x + p.w && this.x + this.w > p.x &&
                    this.y < p.y + p.h && this.y + this.h > p.y) {
                    if (this.vy > 0 && this.y - this.vy + this.h <= p.y + 10) {
                        this.y = p.y - this.h;
                        this.vy = 0;
                        this.vx *= 0.5; // Yere sürtünme
                    }
                }
            }
        }

        this.lifetime--;
        if (this.lifetime <= 0) this.active = false;

        // Dikkat: Artık içinden geçince otomatik almıyoruz, etkileşim (Interact) ile alınıyor
    }

    draw(ctx) {
        this._draw(ctx);
        if (this.x + this.w > map.width) {
            ctx.save(); ctx.translate(-map.width, 0); this._draw(ctx); ctx.restore();
        } else if (this.x < 0) {
            ctx.save(); ctx.translate(map.width, 0); this._draw(ctx); ctx.restore();
        }
    }

    _draw(ctx) {
        if (this.lifetime < 120 && Math.floor(Date.now() / 100) % 2 === 0) return; // Yok olmadan önce yanıp söner

        if (this.mode === 'mystery') {
            ctx.fillStyle = '#9b59b6'; // Mor gizemli kasa
            ctx.fillRect(this.x, this.y, this.w, this.h);
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(this.x, this.y, this.w, this.h);
            ctx.fillStyle = '#fff';
            ctx.font = '14px "Press Start 2P"';
            ctx.fillText('?', this.x + 4, this.y + 16);
        } else if (this.mode === 'health') {
            ctx.fillStyle = '#2ecc71'; // Yeşil can kasası
            ctx.fillRect(this.x, this.y, this.w, this.h);
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(this.x, this.y, this.w, this.h);
            ctx.fillStyle = '#fff';
            ctx.font = '14px "Press Start 2P"';
            ctx.fillText('+', this.x + 4, this.y + 16);
        } else if (this.mode === 'ammo') {
            ctx.fillStyle = '#f1c40f'; // Sarı mermi kasası
            ctx.fillRect(this.x, this.y, this.w, this.h);
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(this.x, this.y, this.w, this.h);
            ctx.fillStyle = '#fff';
            ctx.font = '14px "Press Start 2P"';
            ctx.fillText('=', this.x + 4, this.y + 16);
        } else if (this.mode === 'dropped') {
            let color = WEAPONS[this.weaponType].color;
            ctx.fillStyle = color;
            ctx.fillRect(this.x, this.y + 14, 20, 6); // Yerde duran silah tüfeği

            ctx.fillStyle = '#fff';
            ctx.font = '10px "Press Start 2P"';
            ctx.fillText(this.ammo, this.x - 2, this.y + 8); // Kalan mermiyi yazar
        }
    }
}

let items = [];
function spawnItem() {
    // Dalgalanma Efekti (Wave): Zaman içinde doğma ihtimali artıp azalır (Bazen hiç doğmaz)
    let intensity = Math.sin(Date.now() / 8000); // 8 saniyelik periyotlar
    if (intensity < 0) return; // %50 ihtimalle 'Kuraklık' dönemi, kutu asla çıkmaz.

    // Silah, Can veya Mermi Kasaları Rastgele Belirir (Sıklık Dengelendi: 6:2:2)
    if (Math.random() < 0.02 && items.length < 5) {
        let pIndex = Math.floor(Math.random() * (map.platforms.length - 1)) + 1;
        let p = map.platforms[pIndex];
        // En uçlara çok yanaşmasın
        let x = p.x + 10 + Math.random() * (p.w - 30);
        let y = p.y - 20;

        let rand = Math.random();
        let mode = 'mystery';
        if (rand < 0.2) mode = 'health';       // %20 şansla can
        else if (rand < 0.4) mode = 'ammo';    // %20 şansla mermi
        else mode = 'mystery';                 // %60 şansla silah (Mystery)

        items.push(new Item(x, y, mode));
    }
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let p1, p2, bullets, explosions;
let gameIsOver = false;
let gameIsPaused = false;
let currentMapIndex = 0;
let animationFrameId = null;

function init(mapIndex) {
    // Tam Ekran Talebi (Kullanıcı tıkladığı için tarayıcı buna izin verir)
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log("Full-screen error: " + err.message);
        });
    }

    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    currentMapIndex = mapIndex;
    buildFixedMap(mapIndex);

    p1 = new Player(100, 100, '#ff4757', P1_CTRL, 'p1');
    p2 = new Player(map.width - 150, 100, '#1e90ff', P2_CTRL, 'p2');
    p2.facing = -1; // P2 faces left
    
    // Set AI flag for Player 2
    if (currentGameMode === 'pve') {
        p2.isBot = true;
    }

    bullets = [];
    explosions = [];
    items = [];
    gameIsOver = false;
    gameIsPaused = false;

    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('mode-screen').classList.add('hidden');

    canvas.width = map.width;
    canvas.height = map.height;

    p1.updateUI();
    p2.updateUI();
    updateScoreboard();

    gameLoop();
}

function updateScoreboard() {
    document.getElementById('p1-score').innerText = '⭐'.repeat(p1Wins);
    document.getElementById('p2-score').innerText = '⭐'.repeat(p2Wins);
}

function gameOver(loserPrefix) {
    if (gameIsOver) return;
    gameIsOver = true;
    
    let winnerPrefix = loserPrefix === 'Player 1' ? 'Player 2' : 'Player 1';
    
    if (winnerPrefix === 'Player 1') p1Wins++;
    else p2Wins++;
    
    updateScoreboard();

    document.getElementById('game-over-screen').classList.remove('hidden');
    
    if (p1Wins >= targetWins || p2Wins >= targetWins) {
        document.getElementById('winner-text').innerText = winnerPrefix + ' MAÇI KAZANDI!';
        document.getElementById('restart-btn').innerText = 'Yeni Maç';
    } else {
        document.getElementById('winner-text').innerText = winnerPrefix + ' Raundu Kazandı!';
        document.getElementById('restart-btn').innerText = 'Sonraki Raund';
    }
}

document.getElementById('restart-btn').addEventListener('click', () => {
    if (p1Wins >= targetWins || p2Wins >= targetWins) {
        p1Wins = 0;
        p2Wins = 0;
    }
    init(currentMapIndex);
});

document.getElementById('menu-btn').addEventListener('click', () => {
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('mode-screen').classList.remove('hidden');
});

// Pause screen listeners
document.getElementById('resume-btn').addEventListener('click', () => {
    togglePause();
});

document.getElementById('pause-restart-btn').addEventListener('click', () => {
    togglePause(); // Ekranı gizle
    init(currentMapIndex);
});

document.getElementById('pause-menu-btn').addEventListener('click', () => {
    togglePause();
    document.getElementById('mode-screen').classList.remove('hidden');
});

// Mode and Map selection screen listener
let currentGameMode = 'pvp';
let targetWins = 1;
let p1Wins = 0;
let p2Wins = 0;

window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.mode-card').forEach(card => {
        card.addEventListener('click', () => {
            currentGameMode = card.getAttribute('data-mode');
            document.getElementById('mode-screen').classList.add('hidden');
            document.getElementById('rounds-screen').classList.remove('hidden');
        });
    });

    document.querySelectorAll('.round-card').forEach(card => {
        card.addEventListener('click', () => {
            let r = parseInt(card.getAttribute('data-rounds'));
            targetWins = Math.ceil(r / 2); // 1 -> 1, 3 -> 2, 5 -> 3
            document.getElementById('rounds-screen').classList.add('hidden');
            document.getElementById('start-screen').classList.remove('hidden');
        });
    });

    document.querySelectorAll('.map-card:not(.mode-card):not(.round-card)').forEach(card => {
        card.addEventListener('click', () => {
            let mapIndex = parseInt(card.getAttribute('data-map'));
            if (mapIndex === 3) {
                mapIndex = Math.floor(Math.random() * 3); // 0, 1, or 2
            }
            p1Wins = 0;
            p2Wins = 0;
            init(mapIndex);
        });
    });
});

function gameLoop() {
    if (gameIsOver) return;

    if (gameIsPaused) {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
    }

    // Background
    ctx.clearRect(0, 0, canvas.width, canvas.height); // CSS handles the background color, but can paint over if needed

    // Draw Platforms
    for (let p of map.platforms) {
        ctx.fillStyle = '#2f3640'; // Main platform color
        ctx.fillRect(p.x, p.y, p.w, p.h);
        // Top border for style
        ctx.fillStyle = '#718093';
        ctx.fillRect(p.x, p.y, p.w, 4);
    }

    spawnItem();

    // Update/Draw Items
    for (let i = items.length - 1; i >= 0; i--) {
        items[i].update();
        items[i].draw(ctx);
        if (!items[i].active) items.splice(i, 1);
    }

    // Update/Draw Players
    p1.update(); p1.draw(ctx);
    p2.update(); p2.draw(ctx);

    // Update/Draw Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        bullets[i].draw(ctx);
        if (!bullets[i].active) bullets.splice(i, 1);
    }

    // Update/Draw Explosions
    for (let i = explosions.length - 1; i >= 0; i--) {
        let e = explosions[i];
        ctx.fillStyle = `rgba(231, 76, 60, ${e.life / 20})`;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(241, 196, 15, ${e.life / 20})`;
        ctx.fill();
        e.life--;
        if (e.life <= 0) explosions.splice(i, 1);
    }

    if (!gameIsOver) {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}
