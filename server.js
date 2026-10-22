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

// API รับใบสมัคร (แก้ไขให้ดึง ocAge, discordTag, testerTag มาครบถ้วน)
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
            title: "🌊 🩵 ใบสมัครเข้าแก๊ง BLACK KINGDOM (BKM)",
            description: "มีผู้สนใจสมัครเข้าร่วมตระกูล กรุณาตรวจสอบข้อมูลและดำเนินการสอบตามขั้นตอน",
            color: 3826936,
            fields: [
                { name: "👤 ข้อมูล IC (ในเกม)", value: `• **ชื่อ IC:** \`${data.icName}\`\n• **อายุ IC:** ${data.icAge} ปี\n• **เลเวล:** Lv.${data.level}\n• **เพศ IC:** ${data.icGender}`, inline: false },
                { name: "👽 ข้อมูล OC (นอกเกม)", value: `• **ชื่อ OC:** ${data.ocName}\n• **อายุ OC:** ${data.ocAge || '-'} ปี\n• **เวลาเล่น:** ${data.onlineHours}`, inline: false },
                { name: "⚔️ สายการเล่น", value: `\`\`\`${data.playStyle}\`\`\``, inline: true },
                { name: "💬 เหตุผล", value: `\`\`\`${data.reason}\`\`\``, inline: false },
                { name: "💬 Discord & ผู้คุม", value: `• **ผู้สมัคร:** ${data.discordTag || '-'}\n• **ผู้คุมสอบ:** ${data.testerTag || '-'}\n• **ห้องรอสอบ:** https://discord.gg/C6kKrrGbm`, inline: false }
            ],
            footer: { text: "BLACK KINGDOM System • " + new Date().toLocaleString('th-TH') }
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

app.post('/api/checkin', antiSpam, async (req, res) => {
    const { icName, activityName } = req.body;
    if (!icName || !activityName) return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });

    const now = new Date();
    const dateStr = now.toLocaleDateString('th-TH') + ' ' + now.toLocaleTimeString('th-TH');

    dbData.attendance.push({ icName, activityName, date: dateStr });
    saveData();

    const embed = {
        content: `📋 **บันทึกการเช็กชื่อเข้าร่วมกิจกรรม**`,
        embeds: [{
            title: `✅ สมาชิกเช็กชื่อสำเร็จ: ${activityName}`,
            description: `• **ชื่อ IC:** \`${icName}\`\n• **เวลาเช็กชื่อ:** ${dateStr}`,
            color: 3066993,
            footer: { text: "BLACK KINGDOM • Attendance System" }
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

app.post('/api/treasury', antiSpam, async (req, res) => {
    const { icName, type, itemName, quantity, note } = req.body;
    if (!icName || !type || !itemName || !quantity) return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบ' });

    const now = new Date();
    const dateStr = now.toLocaleDateString('th-TH') + ' ' + now.toLocaleTimeString('th-TH');

    dbData.treasuryLogs.push({ icName, type, itemName, quantity, note: note || '-', date: dateStr });
    saveData();

    const isWithdraw = type === 'เบิกของ';
    const embed = {
        content: `📦 **รายงานคลังตระกูล BLACK KINGDOM**`,
        embeds: [{
            title: isWithdraw ? `📤 มีการแจ้งเบิกสิ่งของ` : `📥 มีการแจ้งฝากสิ่งของเข้าคลัง`,
            description: `• **ผู้ทำรายการ:** \`${icName}\`\n• **ประเภท:** \`${type}\`\n• **รายการ:** \`${itemName}\`\n• **จำนวน:** \`${quantity}\`\n• **หมายเหตุ:** ${note || '-'}\n• **เวลา:** ${dateStr}`,
            color: isWithdraw ? 15158332 : 3066993,
            footer: { text: "BLACK KINGDOM • Treasury Management" }
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

const CRON_OPTIONS = { timezone: "Asia/Bangkok" };

const morningQuotes = [
    "🌅 อรุณสวัสดิ์ชาว BKM ทุกคน! วันนี้ขอให้เป็นวันที่ดี ฟาร์มเดือดๆ ลุยกิจกรรมชนะรวดนะจ๊ะ 🩵",
    "☀️ ตื่นมาเจอเช้าวันใหม่ ขอให้พลังเต็มร้อย พร้อมลุยทุกภารกิจในเมืองแล้ววันนี้ สู้ๆ ครับพี่น้อง!",
    "☕ กาแฟพร้อม คีย์บอร์ดพร้อม! ขอให้วันนี้เป็นวันที่ราบรื่น เฮงๆ รวยๆ กันทุกคนนะชาว BKM 🌊",
    "⛅ เช้าแล้วตื่นมารับความปัง! ขอให้วันนี้เจอแต่เรื่องราวดีๆ และสนุกกับการเล่นเกมไปด้วยกันครับ 🖤"
];

cron.schedule('0 9 * * *', async () => {
    try {
        if (WEBHOOK_GENERAL) {
            const randomText = morningQuotes[Math.floor(Math.random() * morningQuotes.length)];
            const embed = {
                content: "@everyone ☀️ **อรุณสวัสดิ์ยามเช้าจ้าทุกคน!**",
                embeds: [{ description: randomText, color: 16776960, footer: { text: "BLACK KINGDOM • Good Morning" } }]
            };
            await fetch(WEBHOOK_GENERAL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(embed) });
        }
    } catch (e) {}
}, CRON_OPTIONS);

const nightQuotes = [
    "🌙 คืนนี้พักผ่อนให้เต็มที่นะพี่น้อง BKM เหนื่อยมาทั้งวันแล้ว วางเรื่องเครียดๆ ลงก่อนนะ พรุ่งนี้ค่อยลุยกันใหม่ ฝันดีครับทุกคน! 🩵",
    "✨ พรุ่งนี้จะเป็นวันที่ดีกว่าเดิมแน่นอน ขอบคุณทุกคนที่เหน็ดเหนื่อยและสู้ไปด้วยกันในวันนี้ คืนนี้ชาร์จแบตให้เต็มที่ ฝันดีราตรีสวัสดิ์นะจ๊ะ 🌊",
    "🌌 เหนื่อยไหมวันนี้? เก่งมากแล้วนะ! ไม่ว่าจะเจออะไรมา วันนี้ทุกคนเก่งมากแล้ว พักสายตา หลับตาให้สบาย แล้วเจอกันใหม่พรุ่งนี้ครับ 🖤",
    "😴 ถึงเวลาพักผ่อนของเหล่านักสู้แล้ว ถอดอาวุธ วางคีย์บอร์ด แล้วไปนอนพักผ่อนกันได้แล้วนะ ฝันดีราตรีสวัสดิ์ชาว BKM ทุกคน!",
    "🌠 พักผ่อนเอาแรง สู้ต่อวันพรุ่งนี้ ขอให้คืนนี้เป็นคืนที่หลับสนิท ไม่มีเรื่องให้ต้องกังวลใจ ราตรีสวัสดิ์นะพี่น้องทุกคน 💙",
    "🧸 ฝันดีนะอ้วน! พักผ่อนเยอะๆ อย่าลืมห่มผ้าหนาๆ รักษาสุขภาพกันด้วยนะ พรุ่งนี้ตื่นมาเจอกันใหม่พร้อมพลังเต็มร้อยครับ!"
];

cron.schedule('0 23 * * *', async () => {
    try {
        if (WEBHOOK_GENERAL) {
            const randomText = nightQuotes[Math.floor(Math.random() * nightQuotes.length)];
            const embed = {
                content: "@everyone 🌙 **ได้เวลาพักผ่อนแล้วนะทุกคน...**",
                embeds: [{ description: randomText, color: 7419530, footer: { text: "BLACK KINGDOM • Good Night" } }]
            };
            await fetch(WEBHOOK_GENERAL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(embed) });
        }
    } catch (e) {}
}, CRON_OPTIONS);

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
        content: "@everyone 🥀 **บันทึกการอำลาสมาชิกตระกูล BLACK KINGDOM**",
        embeds: [{
            title: "🖤 มีสมาชิกขอลาออกจากแก๊ง",
            description: `**ลาก่อนนะพี่น้อง...** ขอบคุณที่ร่วมเดินทางและสร้างความทรงจำดีๆ ด้วยกันมาตลอดทาง...\n\n👤 **ชื่อ IC:** \`${icName}\`\n📝 **เหตุผลที่ออก:** \`${reason}\`\n📅 **วันที่ออก:** ${dateStr}`,
            color: 15158332,
            footer: { text: "BLACK KINGDOM - เราจะไม่ลืมกัน" }
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
    console.log(`BKM Gang Server is running on port ${PORT}`);
});
