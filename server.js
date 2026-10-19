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

// ==========================================
// DISCORD WEBHOOK URLS
// ==========================================
const WEBHOOK_ACTIVITY = "https://discord.com/api/webhooks/1561321885386670140/Fx2iPim0F9bL00h8EC6lXSAtN054VAFQW0OGd1ZQTyz1KeWg9tO730nycZqx7kAvC6iY";
const WEBHOOK_LEAVE    = "https://discord.com/api/webhooks/1561320841059241994/VtmCOkw_XFJ2f-6xvBWIc8l4WcoucbQiPQlYr4624C5dBx5AZuQj5suUlIk0QXdKVq2h";
const WEBHOOK_APPLY    = "https://discord.com/api/webhooks/1560910735494881402/nzUeuIZSq39cqTlifuljoYVAy78-Bn_XwKHH6K8in_5myVPsG1L6XQiculo68fOXwe_Q";
const WEBHOOK_RESTART  = "https://discord.com/api/webhooks/1560924711201017998/3QBfcYYIfGi_bcp0hiCmFd8ud1GefXvExfwc8XqJBqHClCOqJ0QIMO5QjK78slKGIm9R";

// ระบบป้องกันสแปม (Rate Limiting)
const requestRateLimit = {};
function antiSpam(req, res, next) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    if (requestRateLimit[ip] && now - requestRateLimit[ip] < 180000) { // ล็อก 3 นาทีถ้าส่งข้อมูลถี่เกินไป
        return res.status(429).json({ success: false, message: 'คุณส่งข้อมูลถี่เกินไป กรุณารอ 3 นาทีก่อนส่งอีกครั้ง' });
    }
    requestRateLimit[ip] = now;
    next();
}

// ฐานข้อมูลไฟล์ถาวร
const DB_FILE = path.join(__dirname, 'database.json');

let dbData = {
    applications: [],
    verifiedMembers: [],
    leftMembers: [],
    members: { story: [], farm: [] }
};

if (fs.existsSync(DB_FILE)) {
    try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        dbData = JSON.parse(fileContent);
    } catch (e) {
        console.error('Error reading database file:', e);
    }
}

function saveData() {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf8');
    } catch (e) {
        console.error('Error saving database file:', e);
    }
}

// ระบบออนไลน์บนหน้าเว็บเรียลไทม์
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

// ค้นหาใบสมัครของตัวเอง (ค้นหาแบบไม่สนตัวพิมพ์เล็ก-ใหญ่)
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

// 1. API ส่งใบสมัคร (WEBHOOK_APPLY)
app.post('/api/apply', antiSpam, async (req, res) => {
    const data = req.body;
    if(!data.icName) return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อ IC' });

    // บันทึกและอัปเดตข้อมูลถาวร
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
        content: `@everyone @here\n📢 **มีใบสมัครใหม่เข้ามาครับ!**\n👤 **ผู้สมัคร:** ${data.discordTag}\n📋 **ผู้คุมสอบ:** ${data.testerTag}\n🔗 **ห้องรอสอบ:** https://discord.gg/C6kKrrGbm`,
        embeds: [{
            title: "🌊 🩵 ใบสมัครเข้าแก๊ง BLACK KINGDOM (BKM)",
            description: "มีผู้สนใจสมัครเข้าร่วมตระกูล กรุณาตรวจสอบข้อมูลและดำเนินการสอบตามขั้นตอน",
            color: 3719416,
            fields: [
                { name: "👤 ข้อมูล IC (ในเกม)", value: `• **ชื่อ IC:** ${data.icName}\n• **อายุ IC:** ${data.icAge} ปี\n• **เลเวล:** ${data.level}`, inline: false },
                { name: "👽 ข้อมูล OC (นอกเกม)", value: `• **ชื่อ OC:** ${data.ocName}\n• **เวลาเล่น:** ${data.onlineHours}`, inline: false },
                { name: "⚔️ สายการเล่น", value: data.playStyle, inline: false },
                { name: "💬 เหตุผล", value: data.reason, inline: false }
            ],
            footer: { text: "BLACK KINGDOM System • " + new Date().toLocaleString('th-TH') }
        }]
    };

    try {
        await fetch(WEBHOOK_APPLY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        res.status(200).json({ success: true });
    } catch(err) {
        res.status(200).json({ success: true, message: 'บันทึกเข้าเซิร์ฟเวอร์แล้ว' });
    }
});

app.get('/api/applications', (req, res) => res.json(dbData.applications));
app.get('/api/members', (req, res) => res.json(dbData.members));

// 2. API กดปุ่มแจ้งเตือนกิจกรรมด้วยตนเอง (WEBHOOK_ACTIVITY)
app.post('/api/notify-activity', async (req, res) => {
    const { activityName, timeText } = req.body;
    let msg = `@everyone 🚨 **ประกาศสำคัญ! กิจกรรม ${activityName} เริ่มขึ้นแล้ว!** รอบเวลา: ${timeText} 🌊🩵`;
    
    if(activityName === 'AirDrop') {
        msg = `@everyone 🚨 **AirDrop รอบ ${timeText} มาแล้วนะจ๊ะที่ร้ากก ขอให้สมาชิกทุกคนเข้าแอร์กันด้วยนะจ๊ะที่ร้ากก** 🌊🩵`;
    } else if(activityName === 'ยึดคุก') {
        msg = `@everyone 🚨 **ขอให้ทุกคนเข้ามายึดคุกกันด้วยยยน้าา สู้ๆๆน้าาา** 🌊🩵`;
    } else if(activityName === 'วอยึดโซน') {
        msg = `@everyone 🚨 **ยึดโซนมาแล้วลุ่ยเลยยๆ** 🌊🩵`;
    }

    try {
        await fetch(WEBHOOK_ACTIVITY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: msg })
        });
        res.status(200).json({ success: true });
    } catch(err) {
        res.status(500).json({ success: false });
    }
});

// ==========================================
// ระบบตั้งเวลาแจ้งเตือนอัตโนมัติ (เวลาไทย Asia/Bangkok)
// ==========================================
const CRON_OPTIONS = { timezone: "Asia/Bangkok" };

// --- 1. แจ้งเตือนเซิร์ฟเวอร์รีสตาร์ท (WEBHOOK_RESTART) ---
// แจ้งเตือนก่อน 5 นาที ก่อนเวลา 00:00 น. (คือเวลา 23:55 น.)
cron.schedule('55 23 * * *', async () => {
    try {
        await fetch(WEBHOOK_RESTART, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: `@everyone ⚠️ **ประกาศแจ้งเตือน! เซิร์ฟเวอร์จะทำการรีสตาร์ทในอีก 5 นาทีข้างหน้า (เวลา 00:00 น.) กรุณาเตรียมตัวให้พร้อมด้วยนะครับ/คะ!** 🌊🩵` })
        });
    } catch(e) { console.error(e); }
}, CRON_OPTIONS);

// --- 2. แจ้งเตือนกิจกรรม AirDrop (WEBHOOK_ACTIVITY) ---
cron.schedule('59 12,17,20 * * *', async () => {
    await fetch(WEBHOOK_ACTIVITY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `@everyone ⏰ **AirDrop จะมาแล้วนะจ๊ะที่ร้ากก เตรียมตัวให้พร้อม!** 🌊🩵` })
    });
}, CRON_OPTIONS);

cron.schedule('0 13,18,21 * * *', async () => {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
    const hour = now.getHours();
    
    let timeLabel = "13:00 (บ่าย 1)";
    if(hour === 18) timeLabel = "18:00 (6 โมงเย็น)";
    if(hour === 21) timeLabel = "21:00 (3 ทุ่ม)";
    
    await fetch(WEBHOOK_ACTIVITY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `@everyone 🚨 **AirDrop รอบ ${timeLabel} มาแล้วนะจ๊ะที่ร้ากก ขอให้สมาชิกทุกคนเข้าแอร์กันด้วยนะจ๊ะที่ร้ากก** 🌊🩵` })
    });
}, CRON_OPTIONS);

// --- 3. แจ้งเตือนกิจกรรมยึดคุก (WEBHOOK_ACTIVITY) ---
cron.schedule('59 19 * * *', async () => {
    await fetch(WEBHOOK_ACTIVITY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `@everyone ⏰ **ยึดคุกจะมาแล้วว ไปยึดคุกกันเถอะะ!** 🌊🩵` })
    });
}, CRON_OPTIONS);

cron.schedule('0 20 * * *', async () => {
    await fetch(WEBHOOK_ACTIVITY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `@everyone 🚨 **ขอให้ทุกคนเข้ามายึดคุกกันด้วยยยน้าา สู้ๆๆน้าาา** 🌊🩵` })
    });
}, CRON_OPTIONS);

// --- 4. แจ้งเตือนกิจกรรมวอยึดโซน (WEBHOOK_ACTIVITY) ---
cron.schedule('29 21 * * *', async () => {
    await fetch(WEBHOOK_ACTIVITY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `@everyone ⏰ **ให้ทุกคนเตรียมของยึดโซนกันให้พร้อม ไม่อีโก้น้าาา ชุบเพื่อนด้วย สู้ๆน้าาอ้วนน!** 🌊🩵` })
    });
}, CRON_OPTIONS);

cron.schedule('30 21 * * *', async () => {
    await fetch(WEBHOOK_ACTIVITY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `@everyone 🚨 **ยึดโซนมาแล้วลุ่ยเลยยๆ!** 🌊🩵` })
    });
}, CRON_OPTIONS);

// 3. API ขอออกแก๊ง (WEBHOOK_LEAVE)
app.post('/api/leave-gang', async (req, res) => {
    const { icName, reason } = req.body;
    const dateStr = new Date().toLocaleString('th-TH');
    
    dbData.leftMembers.push({ icName, reason, date: dateStr });
    dbData.members.story = dbData.members.story.filter(m => m.toLowerCase() !== icName.toLowerCase());
    dbData.members.farm = dbData.members.farm.filter(m => m.toLowerCase() !== icName.toLowerCase());
    dbData.verifiedMembers = dbData.verifiedMembers.filter(m => m.toLowerCase() !== icName.toLowerCase());

    saveData();

    const payload = {
        content: `@everyone 🥀 **บันทึกการอำลาสมาชิกตระกูล BLACK KINGDOM**`,
        embeds: [{
            title: "🖤 มีสมาชิกขอลาออกจากแก๊ง",
            description: `**ลาก่อนนะพี่น้อง...** ขอบคุณที่ร่วมเดินทางและสร้างความทรงจำดีๆ ด้วยกันมาตลอดทาง เส้นทางข้างหน้าขอให้โชคดี...\n\n👤 **ชื่อ IC:** ${icName}\n📝 **เหตุผลที่ออก:** ${reason}\n📅 **วันที่ออก:** ${dateStr}`,
            color: 15158332,
            footer: { text: "BLACK KINGDOM - เราจะไม่ลืมกัน" }
        }]
    };

    try {
        await fetch(WEBHOOK_LEAVE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        res.status(200).json({ success: true });
    } catch(err) {
        res.status(200).json({ success: true });
    }
});

app.get('/api/left-members', (req, res) => res.json(dbData.leftMembers));

app.listen(PORT, () => {
    console.log(`BKM Gang Server is running on port ${PORT}`);
});
