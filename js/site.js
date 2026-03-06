let hp = [1000, 1000], st = [600, 600], turn = 1, perks = [[], []], heals = [3, 3], keys = {}, mode = 'pvp', busy = false, spUsed = [false, false], detUsed = [false, false], isLB = [false, false];

window.onkeydown = e => keys[e.key] = true;
window.onkeyup = e => keys[e.key] = false;

function addLog(msg) {
    const box = document.getElementById('log-content');
    const d = document.createElement('div');
    d.innerText = "> " + msg;
    box.prepend(d);
    if (box.children.length > 10) box.lastChild.remove();
}

function drawHeart(ctx, x, y, color) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x + 8, y + 4);
    ctx.bezierCurveTo(x + 8, y, x, y, x, y + 7); ctx.bezierCurveTo(x, y + 12, x + 8, y + 16, x + 8, y + 18);
    ctx.bezierCurveTo(x + 8, y + 16, x + 16, y + 12, x + 16, y + 7); ctx.bezierCurveTo(x + 16, y, x + 8, y, x + 8, y + 4); ctx.fill();
}

function drawBlaster(ctx, g, hX, hY) {
    if (g.t > 0) g.angle = Math.atan2(hY - g.y, hX - g.x);
    ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(g.angle);
    ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(0, 0, 20, 0.5 * Math.PI, 1.5 * Math.PI);
    ctx.lineTo(25, -15); ctx.lineTo(25, 15); ctx.closePath(); ctx.fill();
    ctx.fillStyle = g.t < 0 ? "cyan" : "black";
    ctx.beginPath(); ctx.arc(5, -7, 4, 0, 7); ctx.arc(5, 7, 4, 0, 7); ctx.fill();
    if (g.t < 0) { ctx.fillStyle = "white"; ctx.shadowBlur = 20; ctx.shadowColor = "cyan"; ctx.fillRect(25, -20, 800, 40); }
    ctx.restore();
}

function showLobby(m) {
    mode = m; document.getElementById('main-menu').style.display = 'none';
    document.getElementById('lobby').style.display = 'flex';
    [1, 2].forEach(p => {
        const div = document.getElementById(`p${p}-list`); div.innerHTML = '';
        ["SPECIAL ATTACK", "LAST BREATH", "DETERMINATION", "VAMPIRISM", "RAGE"].forEach(pk => {
            const b = document.createElement('button'); b.innerText = pk; b.className = "u-btn";
            b.onclick = () => {
                if (perks[p - 1].includes(pk)) perks[p - 1] = perks[p - 1].filter(x => x !== pk);
                else if (perks[p - 1].length < 2) perks[p - 1].push(pk);
                b.style.color = perks[p - 1].includes(pk) ? "yellow" : "white";
            }; div.appendChild(b);
        });
    });
}

function startBattle() {
    document.getElementById('lobby').style.display = 'none';
    document.getElementById('battle-screen').style.display = 'flex';
    document.getElementById('n1').innerText = document.getElementById('p1-name').value || "P1";
    document.getElementById('n2').innerText = document.getElementById('p2-name').value || "P2";
    upd();
}

function upd() {
    [1, 2].forEach(p => {
        const i = p - 1;
        document.getElementById(`f${p}`).style.width = (hp[i] / 10) + "%";
        document.getElementById(`hp-t${p}`).innerText = `${Math.floor(hp[i])}/1000`;
        document.getElementById(`card${p}`).className = turn === p ? "p-card active-turn" : "p-card";
        document.getElementById(`st${p}-cont`).style.display = isLB[i] ? "block" : "none";
        document.getElementById(`s${p}`).style.width = (st[i] / 6) + "%";
        document.getElementById(`sp${p}`).style.display = (!spUsed[i] && hp[i] < 500 && perks[i].includes("SPECIAL ATTACK")) ? "block" : "none";
        document.getElementById(`heal${p}`).innerText = `YE (${heals[i]})`;
        let n = document.getElementById(`n${p}`);
        let t = n.querySelector('.perk-tag') || document.createElement('span');
        t.className = 'perk-tag'; t.innerText = perks[i].join(" • ");
        if (!n.querySelector('.perk-tag')) n.appendChild(t);
    });
}

function dmg(targetIdx, amount, attackerIdx) {
    const screen = document.getElementById('battle-screen');
    screen.classList.add('shake');
    setTimeout(() => screen.classList.remove('shake'), 150);

    if (isLB[targetIdx]) {
        st[targetIdx] -= 85;
        hp[targetIdx] = 1;
        // İSİM BOZULMA EFEKTİ BURADA EKLENİYOR
        document.getElementById(`n${targetIdx + 1}`).classList.add('glitch');
        if (st[targetIdx] <= 0) location.reload();
    } else {
        hp[targetIdx] -= amount;
        if (hp[targetIdx] <= 0) {
            if (perks[targetIdx].includes("DETERMINATION") && !detUsed[targetIdx]) {
                detUsed[targetIdx] = true; hp[targetIdx] = 450; detAnim();
            } else if (perks[targetIdx].includes("LAST BREATH") && !isLB[targetIdx]) {
                isLB[targetIdx] = true;
                hp[targetIdx] = 1;
                // İLK AKTİFLEŞTİĞİNDE DE EKLE
                document.getElementById(`n${targetIdx + 1}`).classList.add('glitch');
                addLog("ÖLMEYİ REDDETTİ!");
            } else { location.reload(); }
        }
    }
    // Vampirism
    if (attackerIdx !== undefined && perks[attackerIdx].includes("VAMPIRISM")) {
        hp[attackerIdx] = Math.min(1000, hp[attackerIdx] + (amount * 0.15));
    }
    upd();
}

function special(p) {
    spUsed[p - 1] = true; busy = true;
    document.getElementById('special-overlay').style.display = 'flex';
    const cv = document.getElementById('bBox'), cx = cv.getContext('2d');
    let h = { x: 192, y: 192, c: "red", j: 0, v: false }, bones = [], blasters = [], start = Date.now();

    let itv = setInterval(() => {
        let el = Date.now() - start;
        if (el < 6000) {
            if (el % 200 < 50) bones.push({ x: Math.random() * 380, y: -20, w: 12, h: 90, vx: 0, vy: 10 });
            if (el % 300 < 50) bones.push({ x: 410, y: Math.random() * 380, w: 90, h: 12, vx: -13, vy: 0 });
        } else if (el < 11000) {
            h.c = "blue"; if (el % 350 < 50) bones.push({ x: 410, y: 360, w: 25, h: 65, vx: -14, vy: 0 });
        } else if (el < 16000) {
            h.c = "red"; if (el % 900 < 100) blasters.push({ x: Math.random() * 300 + 50, y: Math.random() * 300 + 50, t: 40 });
        }
    }, 100);

    function loop() {
        if (!busy) return; cx.clearRect(0, 0, 400, 400);
        if (h.c === "blue") {
            h.y += 8; if (keys['ArrowUp'] && h.y >= 380) h.j = -20;
            if (h.j) { h.y += h.j; h.j += 1.2; } if (h.y >= 380) { h.y = 380; h.j = 0; }
        } else { if (keys['ArrowUp']) h.y -= 6; if (keys['ArrowDown']) h.y += 6; }
        if (keys['ArrowLeft']) h.x -= 6; if (keys['ArrowRight']) h.x += 6;
        h.x = Math.max(0, Math.min(384, h.x)); h.y = Math.max(0, Math.min(384, h.y));

        bones.forEach(b => {
            b.x += b.vx; b.y += b.vy; cx.fillStyle = "white"; cx.fillRect(b.x, b.y, b.w, b.h);
            if (h.x < b.x + b.w && h.x + 16 > b.x && h.y < b.y + b.h && h.y + 16 > b.y && !h.v) {
                dmg(p === 1 ? 1 : 0, 45); h.v = true; setTimeout(() => h.v = false, 400);
            }
        });
        blasters.forEach((g, i) => {
            g.t--; drawBlaster(cx, g, h.x, h.y);
            if (g.t < 0 && Math.abs(h.x - g.x) < 50 && Math.abs(h.y - g.y) < 50 && !h.v) {
                dmg(p === 1 ? 1 : 0, 60); h.v = true; setTimeout(() => h.v = false, 400);
            }
            if (g.t < -20) blasters.splice(i, 1);
        });
        drawHeart(cx, h.x, h.y, h.c); requestAnimationFrame(loop);
    } loop();
    setTimeout(() => {
        clearInterval(itv); busy = false;
        document.getElementById('special-overlay').style.display = 'none';
        turn = p === 1 ? 2 : 1; upd();
    }, 17500);
}
async function detAnim() {
    busy = true;
    const box = document.getElementById('det-txt-container');
    document.getElementById('det-overlay').style.display = 'flex';
    box.innerHTML = ""; // İçini temizle

    const lines = ["Yolun sonu gibi görünüyor...", "Ama dur...", "FAKAT ÖLMEYİ REDDETTİ!"];

    for (let l of lines) {
        let d = document.createElement('div');
        d.className = l.includes("REDDETTİ") ? "det-line red-det" : "det-line";
        box.appendChild(d);

        // Karakter karakter ekleme
        for (let c of l) {
            d.textContent += c; // textContent boşlukları daha iyi korur
            await new Promise(r => setTimeout(r, 50));
        }
        await new Promise(r => setTimeout(r, 800));
    }

    setTimeout(() => {
        document.getElementById('det-overlay').style.display = 'none';
        busy = false;
        upd(); // Ekranı güncelle
    }, 1500);
}

function act(p, t) {
    if (turn !== p || busy) return;
    const i = p - 1; const target = p === 1 ? 1 : 0;
    if (t === 'atk') {
        let baseDmg = Math.floor(Math.random() * 41) + 90;
        if (perks[i].includes("RAGE")) baseDmg *= (1 + (1 - hp[i] / 1000) * 0.5);
        addLog(document.getElementById(`n${p}`).innerText + " saldırdı!");
        dmg(target, baseDmg, i);
    } else if (heals[i] > 0) {
        hp[i] = Math.min(1000, hp[i] + 250); heals[i]--;
        addLog(document.getElementById(`n${p}`).innerText + " iyileşti!");
    }
    turn = p === 1 ? 2 : 1; upd();
}