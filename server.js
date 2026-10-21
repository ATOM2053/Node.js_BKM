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

// ดึงลิงก์ Webhook ผ่านตัวแปรสิ่งแวดล้อมใน Render
const WEBHOOK_ACTIVITY = process.env.ACTIVITY;
const WEBHOOK_LEAVE    = process.env.LEAVE;
const WEBHOOK_APPLY    = process.env.APPLY;
const WEBHOOK_RESTART  = process.env.RESTART;
const WEBHOOK_ALERT    = process.env.ALERT || process.env.ACTIVITY;

// ==========================================
// ระบบ Self-Ping ป้องกันเซิร์ฟเวอร์ Render หลับ (AFK อัตโนมัติ)
// ==========================================
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

setInterval(async () => {
    try {
        await fetch(RENDER_EXTERNAL_URL);
        console.log(`[AFK Auto-Ping] Keep-alive sent to ${RENDER_EXTERNAL_URL} at ${new Date().toLocaleTimeString('th-TH')}`);
    } catch (err) {
        console.error('[AFK Auto-Ping Error]:', err.message);
    }
}, 10 * 60 * 1000); // ยิงทุกๆ 10 นาที
// ==========================================

// ระบบป้องกันสแปม (Rate Limiting)
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

// ==========================================
// ระบบตรวจสอบคนออนเพื่อแจ้งเตือนเซิร์ฟเวอร์ใกล้ปิด (ตรวจสอบและแจ้งเตือนทุกๆ 13 นาที)
// ==========================================
let lastServerAlertTime = 0;

async function checkServerInactivityAndAlert() {
    const onlineCount = Object.keys(activeVisitors).length;
    
    // ถ้าไม่มีคนออนเลย (0 คน)
    if (onlineCount === 0) {
        const now = Date.now();
        // กำหนดระยะเวลาเว้นช่วงแจ้งเตือนซ้ำเป็น ทุกๆ 13 นาที (13 * 60 * 1000 มิลลิวินาที)
        if (now - lastServerAlertTime < 13 * 60 * 1000) return;
        lastServerAlertTime = now;

        const alertEmbed = {
            content: "@everyone ⚠️ **แจ้งเตือนสถานะเซิร์ฟเวอร์เว็บ!**",
            embeds: [{
                title: "🚨 เซิร์ฟเวอร์ใกล้จะปิด / เข้าสู่โหมดพักการทำงาน",
                description: "ขณะนี้ไม่มีสมาชิกหรือผู้ใช้งานออนไลน์อยู่บนเว็บไซต์เลย เซิร์ฟเวอร์กำลังจะสลีปชั่วคราว!",
                color: 15158332, // สีแดงเตือน
                fields: [
                    { name: "👥 จำนวนคนออนเว็บ", value: "```0 คน```", inline: true },
                    { name: "⏳ สถานะระบบ", value: "```กำลังจะพักการทำงานชั่วคราว```", inline: true },
                    { name: "📢 คำแนะนำ", value: "หากต้องการใช้งานระบบจัดการแก๊งต่อ **กรุณากดเข้าหน้าเว็บ BKM ด่วน** เพื่อรักษาสถานะเซิร์ฟเวอร์ค่ะ!", inline: false }
                ],
                footer: { text: "BLACK KINGDOM • Inactivity Alert System" }
            }]
        };

        try {
            if (WEBHOOK_ALERT) {
                await fetch(WEBHOOK_ALERT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(alertEmbed)
                });
            }
        } catch (e) {
            console.error('Error sending inactivity alert:', e);
        }
    }
}

// ตั้งเวลาให้ฟังก์ชันตรวจสอบทำงานทุกๆ 13 นาทีตรง (13 * 60 * 1000 มิลลิวินาที)
setInterval(checkServerInactivityAndAlert, 13 * 60 * 1000);

// ==========================================

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

// API รับใบสมัคร
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
        content: `@everyone @here`,
        embeds: [{
            title: "🌊 🩵 ใบสมัครเข้าแก๊ง BLACK KINGDOM (BKM)",
            description: "มีผู้สนใจสมัครเข้าร่วมตระกูล กรุณาตรวจสอบข้อมูลและดำเนินการสอบตามขั้นตอน",
            color: 3826936,
            fields: [
                { name: "👤 ข้อมูล IC (ในเกม)", value: `• **ชื่อ IC:** \`${data.icName}\`\n• **อายุ IC:** ${data.icAge} ปี\n• **เลเวล:** Lv.${data.level}\n• **เพศ IC:** ${data.icGender}`, inline: false },
                { name: "👽 ข้อมูล OC (นอกเกม)", value: `• **ชื่อ OC:** ${data.ocName}\n• **เวลาเล่น:** ${data.onlineHours}`, inline: false },
                { name: "⚔️ สายการเล่น", value: `\`\`\`${data.playStyle}\`\`\``, inline: true },
                { name: "💬 เหตุผล", value: `\`\`\`${data.reason}\`\`\``, inline: false },
                { name: "💬 Discord & ผู้คุม", value: `• **ผู้สมัคร:** ${data.discordTag}\n• **ผู้คุมสอบ:** ${data.testerTag}\n• **ห้องรอสอบ:** https://discord.gg/C6kKrrGbm`, inline: false }
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

// ตั้งเวลาแจ้งเตือนกิจกรรมและรีเซิร์ฟเวอร์
const CRON_OPTIONS = { timezone: "Asia/Bangkok" };

cron.schedule('55 23 * * *', async () => {
    try {
        if(WEBHOOK_RESTART) {
            const embed = {
                content: "@everyone ⚠️ **ประกาศแจ้งเตือนการรีเซิร์ฟเวอร์**",
                embeds: [{
                    title: "🔄 เซิร์ฟเวอร์กำลังจะรีสตาร์ท",
                    description: "เซิร์ฟเวอร์จะทำการรีสตาร์ทในอีก **5 นาทีข้างหน้า (เวลา 00:00 น.)** กรุณาเตรียมตัวและเก็บของให้เรียบร้อยด้วยนะครับ/คะ!",
                    color: 16776960,
                    footer: { text: "BLACK KINGDOM • System Restart Alert" }
                }]
            };
            await fetch(WEBHOOK_RESTART, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(embed)
            });
        }
    } catch(e) {}
}, CRON_OPTIONS);

cron.schedule('59 12,17,20 * * *', async () => {
    try {
        if(WEBHOOK_ACTIVITY) {
            const embed = {
                content: "@everyone ⏰ **เตรียมตัวให้พร้อม!**",
                embeds: [{
                    title: "📦 AirDrop กำลังจะมาแล้วนะจ๊ะที่ร้ากก",
                    description: "สมาชิกทุกท่านเตรียมตัว เตรียมอาวุธและเกราะให้พร้อมลุยรอบถัดไปกันได้เลย!",
                    color: 3826936,
                    footer: { text: "BLACK KINGDOM • Activity Preparation" }
                }]
            };
            await fetch(WEBHOOK_ACTIVITY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(embed)
            });
        }
    } catch(e) {}
}, CRON_OPTIONS);

cron.schedule('0 13,18,21 * * *', async () => {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
    const hour = now.getHours();
    let timeLabel = "13:00 (บ่าย 1)";
    if(hour === 18) timeLabel = "18:00 (6 โมงเย็น)";
    if(hour === 21) timeLabel = "21:00 (3 ทุ่ม)";
    
    try {
        if(WEBHOOK_ACTIVITY) {
            const embed = {
                content: "@everyone 🚨 **AirDrop เริ่มแล้ว!**",
                embeds: [{
                    title: `⚔️ AirDrop รอบเวลา ${timeLabel} มาแล้วจ้า!`,
                    description: "ขอให้สมาชิกทุกคนเข้าแอร์และลุยไปด้วยกัน ลุยให้เต็มที่เลยน้าาา 🌊🩵",
                    color: 15158332,
                    footer: { text: "BLACK KINGDOM • AirDrop Event" }
                }]
            };
            await fetch(WEBHOOK_ACTIVITY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(embed)
            });
        }
    } catch(e) {}
}, CRON_OPTIONS);

cron.schedule('59 19 * * *', async () => {
    try {
        if(WEBHOOK_ACTIVITY) {
            const embed = {
                content: "@everyone ⏰ **เตรียมตัวยึดคุก!**",
                embeds: [{
                    title: "🏰 กิจกรรมยึดคุกกำลังจะเริ่มใน 1 นาที",
                    description: "ไปรวมตัวและเตรียมความพร้อมกันให้พร้อม ไปยึดคุกกันเถอะะ!",
                    color: 3826936,
                    footer: { text: "BLACK KINGDOM • Prison Event Prep" }
                }]
            };
            await fetch(WEBHOOK_ACTIVITY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(embed)
            });
        }
    } catch(e) {}
}, CRON_OPTIONS);

cron.schedule('0 20 * * *', async () => {
    try {
        if(WEBHOOK_ACTIVITY) {
            const embed = {
                content: "@everyone 🚨 **ลุยยึดคุกกันเลย!**",
                embeds: [{
                    title: "⚔️ กิจกรรมยึดคุก Pawria Town เริ่มแล้ว",
                    description: "ขอให้ทุกคนเข้ามายึดคุกกันด้วยน้าา สู้ๆๆ น้าทุกคน พาชัยชนะกลับมากัน!",
                    color: 15158332,
                    footer: { text: "BLACK KINGDOM • Prison War" }
                }]
            };
            await fetch(WEBHOOK_ACTIVITY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(embed)
            });
        }
    } catch(e) {}
}, CRON_OPTIONS);

cron.schedule('29 21 * * *', async () => {
    try {
        if(WEBHOOK_ACTIVITY) {
            const embed = {
                content: "@everyone ⏰ **เตรียมของยึดโซนด่วน!**",
                embeds: [{
                    title: "🛡️ กิจกรรมยึดโซนกำลังจะมาใน 1 นาที",
                    description: "ให้ทุกคนเตรียมของยึดโซนกันให้พร้อม ไม่อีโก้น้า ชุบเพื่อนด้วย สู้ๆ น้าอ้วนน!",
                    color: 3826936,
                    footer: { text: "BLACK KINGDOM • Zone War Prep" }
                }]
            };
            await fetch(WEBHOOK_ACTIVITY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(embed)
            });
        }
    } catch(e) {}
}, CRON_OPTIONS);

cron.schedule('30 21 * * *', async () => {
    try {
        if(WEBHOOK_ACTIVITY) {
            const embed = {
                content: "@everyone 🚨 **ยึดโซนมาแล้ว ลุยเลยยย!**",
                embeds: [{
                    title: "🔥 กิจกรรมยึดโซนเริ่มขึ้นแล้ว",
                    description: "เข้าพื้นที่แล้วลุยกันให้เต็มที่ สามัคคีคือพลัง พวกเราทำได้อยู่แล้ว!",
                    color: 15158332,
                    footer: { text: "BLACK KINGDOM • Zone War Live" }
                }]
            };
            await fetch(WEBHOOK_ACTIVITY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(embed)
            });
        }
    } catch(e) {}
}, CRON_OPTIONS);

// API ขอออกแก๊ง
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
            description: `**ลาก่อนนะพี่น้อง...** ขอบคุณที่ร่วมเดินทางและสร้างความทรงจำดีๆ ด้วยกันมาตลอดทาง เส้นทางข้างหน้าขอให้โชคดี...\n\n👤 **ชื่อ IC:** \`${icName}\`\n📝 **เหตุผลที่ออก:** \`${reason}\`\n📅 **วันที่ออก:** ${dateStr}`,
            color: 15158332,
            footer: {
                text: "BLACK KINGDOM - เราจะไม่ลืมกัน"
            }
        }]
    };

    try {
        if(WEBHOOK_LEAVE) {
            await fetch(WEBHOOK_LEAVE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(leaveEmbed)
            });
        }
    } catch(e) {}

    res.status(200).json({ success: true });
});

app.get('/api/left-members', (req, res) => res.json(dbData.leftMembers));

app.listen(PORT, () => {
    console.log(`BKM Gang Server is running on port ${PORT}`);
});
