require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

const WEBHOOK_ACTIVITY = process.env.ACTIVITY;
const WEBHOOK_LEAVE    = process.env.LEAVE;
const WEBHOOK_APPLY    = process.env.APPLY;
const WEBHOOK_RESTART  = process.env.RESTART;
const WEBHOOK_ALERT    = process.env.ALERT || process.env.ACTIVITY;
const WEBHOOK_GENERAL  = process.env.GENERAL || process.env.ACTIVITY;
const WEBHOOK_TREASURY = process.env.TREASURY || process.env.ACTIVITY;
const WEBHOOK_CHECKIN  = process.env.CHECKIN || process.env.ACTIVITY;

const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

// Self-Ping ให้เว็บออนตลอด 24 ชม.
setInterval(async () => {
    try { await fetch(RENDER_EXTERNAL_URL); } catch (err) {}
}, 10 * 60 * 1000);

const requestRateLimit = {};
function antiSpam(req, res, next) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    if (requestRateLimit[ip] && now - requestRateLimit[ip] < 120000) {
        return res.status(429).json({ success: false, message: 'คุณส่งข้อมูลถี่เกินไป กรุณารอ 2 นาทีก่อนส่งอีกครั้ง' });
    }
    requestRateLimit[ip] = now;
    next();
}

const DB_FILE = path.join(__dirname, 'database.json');
let dbData = {
    applications: [],
    verifiedMembers: [],
    leftMembers: [],
    members: { story: [], farm: [] },
    attendance: [],
    treasuryLogs: []
};

if (fs.existsSync(DB_FILE)) {
    try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        dbData = JSON.parse(fileContent);
        if (!dbData.attendance) dbData.attendance = [];
        if (!dbData.treasuryLogs) dbData.treasuryLogs = [];
    } catch (e) {}
}

function saveData() {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf8');
    } catch (e) {}
}

let activeVisitors = {};
app.post('/api/heartbeat', (req, res) => {
    const { visitorId } = req.body;
    if (visitorId) activeVisitors[visitorId] = Date.now();
    res.sendStatus(200);
});

setInterval(() => {
    const now = Date.now();
    for (let id in activeVisitors) {
        if (now - activeVisitors[id] > 25000) delete activeVisitors[id];
    }
}, 10000);

app.get('/api/web-online', (req, res) => {
    res.json(Object.keys(activeVisitors));
});

app.get('/api/search-application', (req, res) => {
    const { icName } = req.query;
    if(!icName) return res.json({ success: false });
    const found = dbData.applications.find(item => item.icName && item.icName.trim().toLowerCase() === icName.trim().toLowerCase());
    if(found) {
        res.json({ success: true, application: found });
    } else {
        res.json({ success: false });
    }
});

// ==========================================
// 📝 API รับใบสมัครเข้าแก๊ง DEKHOTSKY [DHS]
// ==========================================
app.post('/api/apply', antiSpam, async (req, res) => {
    const data = req.body;
    if(!data.icName) return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อ IC' });

    dbData.applications = dbData.applications.filter(item => item.icName.toLowerCase() !== data.icName.toLowerCase());
    dbData.applications.push(data);

    if(!dbData.verifiedMembers.some(m => m.toLowerCase() === data.icName.toLowerCase())) {
        dbData.verifiedMembers.push(data.icName);
    }

    if(data.playStyle === 'สายสตอรี่') {
        if(!dbData.members.story.some(m => m.toLowerCase() === data.icName.toLowerCase())) dbData.members.story.push(data.icName);
        dbData.members.farm = dbData.members.farm.filter(m => m.toLowerCase() !== data.icName.toLowerCase());
    } else {
        if(!dbData.members.farm.some(m => m.toLowerCase() === data.icName.toLowerCase())) dbData.members.farm.push(data.icName);
        dbData.members.story = dbData.members.story.filter(m => m.toLowerCase() !== data.icName.toLowerCase());
    }

    saveData();

    const payload = {
        content: "@everyone @here",
        embeds: [{
            title: "⚡🧊 ใบสมัครเข้าแก๊ง DEKHOTSKY [DHS]",
            description: "มีนักสู้คนใหม่ต้องการเข้าร่วมตระกูล **DEKHOTSKY [DHS]** กรุณาตรวจสอบข้อมูลและดำเนินการสอบเข้าแก๊ง",
            color: 255, // สีฟ้าไอซ์นีออน #0000FF
            fields: [
                { name: "👤 ข้อมูล IC (ในเกม)", value: `• **ชื่อ IC:** \`${data.icName}\`\n• **อายุ IC:** ${data.icAge} ปี\n• **เลเวล:** Lv.${data.level}\n• **เพศ IC:** ${data.icGender}`, inline: false },
                { name: "👽 ข้อมูล OC (นอกเกม)", value: `• **ชื่อ OC:** ${data.ocName}\n• **อายุ OC:** ${data.ocAge || '-'} ปี\n• **เวลาเล่น:** ${data.onlineHours}`, inline: false },
                { name: "⚔️ สายการเล่น", value: `\`\`\`${data.playStyle}\`\`\``, inline: true },
                { name: "💬 เหตุผลที่เข้าร่วม", value: `\`\`\`${data.reason}\`\`\``, inline: false },
                { name: "💬 Discord & ผู้คุมสอบ", value: `• **ผู้สมัคร:** ${data.discordTag || '-'}\n• **ผู้คุมสอบ:** ${data.testerTag || '-'}\n• **ห้องรอสอบ:** https://discord.gg/C6kKrrGbm`, inline: false }
            ],
            footer: { text: "DEKHOTSKY [DHS] System • " + new Date().toLocaleString('th-TH') }
        }]
    };

    try {
        if(WEBHOOK_APPLY) {
            await fetch(WEBHOOK_APPLY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
        res.status(200).json({ success: true });
    } catch(err) {
        res.status(200).json({ success: true, message: 'บันทึกในเซิร์ฟเวอร์แล้ว' });
    }
});

app.get('/api/applications', (req, res) => res.json(dbData.applications));
app.get('/api/members', (req, res) => res.json(dbData.members));

// ==========================================
// 📋 API เช็กชื่อกิจกรรม DEKHOTSKY [DHS]
// ==========================================
app.post('/api/checkin', antiSpam, async (req, res) => {
    const { icName, activityName } = req.body;
    if (!icName || !activityName) return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });

    const now = new Date();
    const dateStr = now.toLocaleDateString('th-TH') + ' ' + now.toLocaleTimeString('th-TH');

    dbData.attendance.push({ icName, activityName, date: dateStr });
    saveData();

    const embed = {
        content: `📋 **บันทึกการเช็กชื่อกิจกรรม - DEKHOTSKY [DHS]**`,
        embeds: [{
            title: `⚡ เช็กชื่อสำเร็จ: ${activityName}`,
            description: `• **นักสู้ DHS:** \`${icName}\`\n• **เวลาเช็กชื่อ:** ${dateStr}`,
            color: 3670264, // #38bdf8
            footer: { text: "DEKHOTSKY [DHS] • Attendance System" }
        }]
    };

    try {
        if (WEBHOOK_CHECKIN) {
            await fetch(WEBHOOK_CHECKIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(embed)
            });
        }
    } catch (e) {}

    res.status(200).json({ success: true, message: 'เช็กชื่อบันทึกเรียบร้อยครับ!' });
});

app.get('/api/attendance', (req, res) => res.json(dbData.attendance));

// ==========================================
// 📦 API บันทึกคลังแก๊ง DEKHOTSKY [DHS]
// ==========================================
app.post('/api/treasury', antiSpam, async (req, res) => {
    const { icName, type, itemName, quantity, note } = req.body;
    if (!icName || !type || !itemName || !quantity) return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบ' });

    const now = new Date();
    const dateStr = now.toLocaleDateString('th-TH') + ' ' + now.toLocaleTimeString('th-TH');

    dbData.treasuryLogs.push({ icName, type, itemName, quantity, note: note || '-', date: dateStr });
    saveData();

    const isWithdraw = type === 'เบิกของ';
    const embed = {
        content: `📦 **รายงานคลังตระกูล DEKHOTSKY [DHS]**`,
        embeds: [{
            title: isWithdraw ? `📤 แจ้งเบิกอุปกรณ์คลัง DHS` : `📥 แจ้งฝากอุปกรณ์เข้าคลัง DHS`,
            description: `• **ผู้ทำรายการ:** \`${icName}\`\n• **ประเภท:** \`${type}\`\n• **รายการสิ่งของ:** \`${itemName}\`\n• **จำนวน:** \`${quantity}\`\n• **หมายเหตุ:** ${note || '-'}\n• **เวลา:** ${dateStr}`,
            color: isWithdraw ? 15158332 : 255,
            footer: { text: "DEKHOTSKY [DHS] • Treasury System" }
        }]
    };

    try {
        if (WEBHOOK_TREASURY) {
            await fetch(WEBHOOK_TREASURY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(embed)
            });
        }
    } catch (e) {}

    res.status(200).json({ success: true, message: 'บันทึกรายการคลังสำเร็จ!' });
});

app.get('/api/treasury-logs', (req, res) => res.json(dbData.treasuryLogs));

app.get('/api/leaderboard', (req, res) => {
    const counts = {};
    dbData.attendance.forEach(item => {
        counts[item.icName] = (counts[item.icName] || 0) + 1;
    });

    const sorted = Object.keys(counts).map(icName => ({
        icName,
        totalEvents: counts[icName]
    })).sort((a, b) => b.totalEvents - a.totalEvents).slice(0, 5);

    res.json(sorted);
});

// ==========================================
// ⏰ ระบบตั้งเวลาแจ้งเตือน DISCORD DEKHOTSKY (CRON JOBS)
// ==========================================
const CRON_OPTIONS = { timezone: "Asia/Bangkok" };

// 1. อรุณสวัสดิ์ยามเช้า DEKHOTSKY (09:00)
const morningQuotes = [
    "🌅 อรุณสวัสดิ์เหล่านักสู้ DEKHOTSKY [DHS] ทุกคน! ตื่นมารับความปัง วันนี้ลุยกิจกรรมชนะรวดนะพวกเรา! ⚡🧊",
    "☀️ เช้าวันใหม่มาถึงแล้ว! ขอให้ชาว DHS พร้อมลุย ฟาร์มเดือดๆ ลุยกิจกรรมให้โลกจำ สู้ๆ ครับพี่น้อง!",
    "☕ กาแฟพร้อม ปืนพร้อม! ขอให้วันนี้เป็นวันที่ดี ลุยทุกกิจกรรมด้วยความชนะนะชาว DEKHOTSKY [DHS] 💙",
    "⛅ ตื่นมารับพลังนีออนสีฟ้า! วันนี้ขอให้พี่น้อง DEKHOTSKY เล่นเกมสนุก ลุยไหนลุยนั่น ชัยชนะเป็นของพวกเรา!"
];

cron.schedule('0 9 * * *', async () => {
    try {
        if (WEBHOOK_GENERAL) {
            const randomText = morningQuotes[Math.floor(Math.random() * morningQuotes.length)];
            const embed = {
                content: "@everyone ☀️ **อรุณสวัสดิ์ยามเช้าตระกูล DEKHOTSKY [DHS]!**",
                embeds: [{ description: randomText, color: 3670264, footer: { text: "DEKHOTSKY [DHS] • Good Morning" } }]
            };
            await fetch(WEBHOOK_GENERAL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(embed) });
        }
    } catch (e) {}
}, CRON_OPTIONS);

// 2. บอกฝันดี DEKHOTSKY (23:00)
const nightQuotes = [
    "🌙 คืนนี้พักผ่อนเอาแรงนะพี่น้อง DEKHOTSKY [DHS] เหนื่อยมาทั้งวันแล้ว วางอาวุธแล้วพักสายตากันนะทุกคน ฝันดีครับ! ⚡🧊",
    "✨ ขอบคุณทุกคนที่เหน็ดเหนื่อยสู้รบและอยู่เคียงข้างกันในนาม DEKHOTSKY วันนี้เก่งกันมากๆ พรุ่งนี้ค่อยว่ากันใหม่ ฝันดีนะจ๊ะ 💙",
    "🌌 เหนื่อยไหมวันนี้? เก่งมากแล้วนะพวกเรา DHS! คืนนี้หลับตาให้สบาย ชาร์จแบตให้เต็มที่ แล้วเจอกันวันพรุ่งนี้ครับ 🧊",
    "😴 ได้เวลาพักผ่อนของตระกูล DEKHOTSKY แล้ว ถอดอาวุธ ปิดจอ แล้วไปนอนพักผ่อนกันได้แล้วนะ ฝันดีราตรีสวัสดิ์ทุกคน!",
    "🧸 ฝันดีนะพวกเรา DHS! พักผ่อนเยอะๆ รักษาสุขภาพกันด้วย พรุ่งนี้ตื่นมาลุยต่อด้วยพลังเต็มร้อยครับ! ⚡"
];

cron.schedule('0 23 * * *', async () => {
    try {
        if (WEBHOOK_GENERAL) {
            const randomText = nightQuotes[Math.floor(Math.random() * nightQuotes.length)];
            const embed = {
                content: "@everyone 🌙 **ได้เวลาพักผ่อนแล้วนะตระกูล DEKHOTSKY [DHS]...**",
                embeds: [{ description: randomText, color: 255, footer: { text: "DEKHOTSKY [DHS] • Good Night" } }]
            };
            await fetch(WEBHOOK_GENERAL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(embed) });
        }
    } catch (e) {}
}, CRON_OPTIONS);

// 3. แจ้งเตือนรีเซิร์ฟเวอร์ (23:55)
cron.schedule('55 23 * * *', async () => {
    try {
        if (WEBHOOK_RESTART || WEBHOOK_ACTIVITY) {
            const targetWebhook = WEBHOOK_RESTART || WEBHOOK_ACTIVITY;
            const embed = {
                content: "@everyone ⚠️ **ประกาศแจ้งเตือนตระกูล DEKHOTSKY [DHS]**",
                embeds: [{
                    title: "🔄 เซิร์ฟเวอร์กำลังจะรีสตาร์ท",
                    description: "เซิร์ฟเวอร์จะทำการรีสตาร์ทในอีก **5 นาทีข้างหน้า** (เวลา 00:00 น.) กรุณาเตรียมตัวและเก็บของให้เรียบร้อยด้วยนะครับ!",
                    color: 16766720,
                    footer: { text: "DEKHOTSKY [DHS] • System Restart Alert" }
                }]
            };
            await fetch(targetWebhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(embed) });
        }
    } catch (e) {}
}, CRON_OPTIONS);

// 4. แจ้งเตือน AirDrop (13:00, 18:00, 21:00)
cron.schedule('59 12,17,20 * * *', async () => {
    try {
        if (WEBHOOK_ACTIVITY) {
            await fetch(WEBHOOK_ACTIVITY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: "@everyone ⚠️ **เตรียมตัวให้พร้อม DEKHOTSKY! กิจกรรม AirDrop จะเริ่มในอีก 1 นาทีข้างหน้า!**" })
            });
        }
    } catch (e) {}
}, CRON_OPTIONS);

cron.schedule('0 13,18,21 * * *', async () => {
    try {
        if (WEBHOOK_ACTIVITY) {
            await fetch(WEBHOOK_ACTIVITY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: "@everyone 📦 **กิจกรรม AirDrop เริ่มแล้ว! DEKHOTSKY [DHS] เดือดแน่นอน ลุย!**" })
            });
        }
    } catch (e) {}
}, CRON_OPTIONS);

// 5. แจ้งเตือนยึดคุก Pawria Town (20:00)
cron.schedule('59 19 * * *', async () => {
    try {
        if (WEBHOOK_ACTIVITY) {
            await fetch(WEBHOOK_ACTIVITY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: "@everyone ⚠️ **เตรียมตัว DEKHOTSKY! กิจกรรมยึดคุก Pawria Town จะเริ่มในอีก 1 นาทีข้างหน้า!**" })
            });
        }
    } catch (e) {}
}, CRON_OPTIONS);

cron.schedule('0 20 * * *', async () => {
    try {
        if (WEBHOOK_ACTIVITY) {
            await fetch(WEBHOOK_ACTIVITY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: "@everyone 🏰 **กิจกรรมยึดคุก Pawria Town เริ่มแล้ว! DEKHOTSKY [DHS] ยึดจุดด่วน!**" })
            });
        }
    } catch (e) {}
}, CRON_OPTIONS);

// 6. แจ้งเตือนยึดโซน (21:30)
cron.schedule('29 21 * * *', async () => {
    try {
        if (WEBHOOK_ACTIVITY) {
            await fetch(WEBHOOK_ACTIVITY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: "@everyone ⚠️ **เตรียมตัว DHS! กิจกรรมยึดโซนจะเริ่มในอีก 1 นาทีข้างหน้า!**" })
            });
        }
    } catch (e) {}
}, CRON_OPTIONS);

cron.schedule('30 21 * * *', async () => {
    try {
        if (WEBHOOK_ACTIVITY) {
            await fetch(WEBHOOK_ACTIVITY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: "@everyone 🛡️ **กิจกรรมยึดโซนเริ่มแล้ว! DEKHOTSKY [DHS] เข้าวงให้พร้อมยิง!**" })
            });
        }
    } catch (e) {}
}, CRON_OPTIONS);

// 7. ขอออกแก๊ง
app.post('/api/leave-gang', async (req, res) => {
    const { icName, reason } = req.body;
    if(!icName) return res.status(400).json({ success: false });

    const now = new Date();
    const dateStr = now.toLocaleDateString('th-TH') + ' ' + now.toLocaleTimeString('th-TH');
    
    dbData.leftMembers.push({ icName, reason, date: dateStr });
    dbData.applications = dbData.applications.filter(m => m.icName.toLowerCase() !== icName.toLowerCase());
    dbData.verifiedMembers = dbData.verifiedMembers.filter(m => m.toLowerCase() !== icName.toLowerCase());
    dbData.members.story = dbData.members.story.filter(m => m.toLowerCase() !== icName.toLowerCase());
    dbData.members.farm = dbData.members.farm.filter(m => m.toLowerCase() !== icName.toLowerCase());

    saveData();
    
    const leaveEmbed = {
        content: "@everyone 🥀 **บันทึกการอำลาสมาชิกตระกูล DEKHOTSKY [DHS]**",
        embeds: [{
            title: "🖤 มีสมาชิกขอลาออกจากแก๊ง",
            description: `**ลาก่อนนะพี่น้อง...** ขอบคุณที่เคยร่วมเดินทางและต่อสู้ในนาม DEKHOTSKY [DHS] มาด้วยกัน...\n\n👤 **ชื่อ IC:** \`${icName}\`\n📝 **เหตุผลที่ออก:** \`${reason}\`\n📅 **วันที่ออก:** ${dateStr}`,
            color: 15158332,
            footer: { text: "DEKHOTSKY [DHS] - เราจะไม่ลืมกัน" }
        }]
    };

    try {
        if(WEBHOOK_LEAVE) {
            await fetch(WEBHOOK_LEAVE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(leaveEmbed) });
        }
    } catch(e) {}

    res.status(200).json({ success: true });
});

app.listen(PORT, () => {
    console.log(`DEKHOTSKY [DHS] Gang Server is running on port ${PORT}`);
});
