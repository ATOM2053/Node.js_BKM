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

// DISCORD WEBHOOK URLS
const WEBHOOK_ACTIVITY = "https://discord.com/api/webhooks/1561540195990503515/yyN8MSqet9GI9F0FTazdWWeQqTCqMF0NQbmeXAt0C010I9rjjx3WQ8JxON_jWDWlGyRk"; 
const WEBHOOK_LEAVE    = "https://discord.com/api/webhooks/1561540462287003718/FJxLU9mRgP2j8V5ky-CooEF7T_7VZFenUKsEw6hzIzLw7AZhgkPIKfOoZswBWO4Qulyd"; 
const WEBHOOK_APPLY    = "https://discord.com/api/webhooks/1561540629245468803/gSA6xNyPloD4rFGPFt4KFnq7TvkFWf5wvu5KwAw2BqnvLhOcfwFqNr8ErLe9_XDA_boj"; 
const WEBHOOK_RESTART  = "https://discord.com/api/webhooks/1560924711201017998/3QBfcYYIfGi_bcp0hiCmFd8ud1GefXvExfwc8XqJBqHClCOqJ0QIMO5QjK78slKGIm9R"; 

// ระบบป้องกันสแปม Rate Limit
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

// 1. API รับใบสมัคร
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
        res.status(200).json({ success: true, message: 'บันทึกในเซิร์ฟเวอร์แล้ว' });
    }
});

app.get('/api/applications', (req, res) => res.json(dbData.applications));
app.get('/api/members', (req, res) => res.json(dbData.members));

// ตั้งเวลาแจ้งเตือนกิจกรรม
const CRON_OPTIONS = { timezone: "Asia/Bangkok" };

cron.schedule('55 23 * * *', async () => {
    try {
        await fetch(WEBHOOK_RESTART, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: `@everyone ⚠️ **ประกาศแจ้งเตือน! เซิร์ฟเวอร์จะทำการรีสตาร์ทในอีก 5 นาทีข้างหน้า (เวลา 00:00 น.) กรุณาเตรียมตัวให้พร้อมด้วยนะครับ/คะ!** 🌊🩵` })
        });
    } catch(e) {}
}, CRON_OPTIONS);

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

// 2. API ขอออกแก๊ง (ปรับรูปแบบ Discord Embed ให้เหมือนเดิมตามภาพ)
app.post('/api/leave-gang', async (req, res) => {
    const { icName, reason } = req.body;
    const now = new Date();
    const dateStr = now.toLocaleDateString('th-TH') + ' ' + now.toLocaleTimeString('th-TH');
    
    dbData.leftMembers.push({ icName, reason, date: dateStr });
    dbData.members.story = dbData.members.story.filter(m => m.toLowerCase() !== icName.toLowerCase());
    dbData.members.farm = dbData.members.farm.filter(m => m.toLowerCase() !== icName.toLowerCase());
    dbData.verifiedMembers = dbData.verifiedMembers.filter(m => m.toLowerCase() !== icName.toLowerCase());

    saveData();
    
    const leaveEmbed = {
        content: "@everyone 🥀 **บันทึกการอำลาสมาชิกตระกูล BLACK KINGDOM**",
        embeds: [{
            title: "🖤 มีสมาชิกขอลาออกจากแก๊ง",
            description: `**ลาก่อนนะพี่น้อง...** ขอบคุณที่ร่วมเดินทางและสร้างความทรงจำดีๆ ด้วยกันมาตลอดทาง เส้นทางข้างหน้าขอให้โชคดี...\n\n👤 **ชื่อ IC:** ${icName}\n📝 **เหตุผลที่ออก:** ${reason}\n📅 **วันที่ออก:** ${dateStr}`,
            color: 15158332, // สีแดงเข้ม (Red)
            footer: {
                text: "BLACK KINGDOM - เราจะไม่ลืมกัน"
            }
        }]
    };

    try {
        await fetch(WEBHOOK_LEAVE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leaveEmbed)
        });
    } catch(e) {}

    res.status(200).json({ success: true });
});

app.get('/api/left-members', (req, res) => res.json(dbData.leftMembers));

app.listen(PORT, () => {
    console.log(`BKM Gang Server is running on port ${PORT}`);
});
