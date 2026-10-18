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
const WEBHOOK_APPLY = "https://discord.com/api/webhooks/1560910735494881402/nzUeuIZSq39cqTlifuljoYVAy78-Bn_XwKHH6K8in_5myVPsG1L6XQiculo68fOXwe_Q";
const WEBHOOK_ACTIVITY = "https://discord.com/api/webhooks/1561321885386670140/Fx2iPim0F9bL00h8EC6lXSAtN054VAFQW0OGd1ZQTyz1KeWg9tO730nycZqx7kAvC6iY"; 
const WEBHOOK_LEAVE = "https://discord.com/api/webhooks/1561320841059241994/VtmCOkw_XFJ2f-6xvBWIc8l4WcoucbQiPQlYr4624C5dBx5AZuQj5suUlIk0QXdKVq2h";

// ไฟล์บันทึกข้อมูลถาวร
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

// ระบบคนออนเว็บเรียลไทม์
let activeVisitors = {};

app.post('/api/heartbeat', (req, res) => {
    const { visitorId } = req.body;
    if (visitorId) {
        activeVisitors[visitorId] = Date.now();
    }
    res.sendStatus(200);
});

setInterval(() => {
    const now = Date.now();
    for (let id in activeVisitors) {
        if (now - activeVisitors[id] > 25000) {
            delete activeVisitors[id];
        }
    }
}, 10000);

app.get('/api/web-online', (req, res) => {
    res.json(Object.keys(activeVisitors));
});

app.get('/api/verify-member', (req, res) => {
    const { icName } = req.query;
    if(dbData.verifiedMembers.includes(icName)) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// 1. API รับใบสมัครส่งเข้า Discord และบันทึกข้อมูล
app.post('/api/apply', async (req, res) => {
    const data = req.body;
    dbData.applications.push(data);

    if(!dbData.verifiedMembers.includes(data.icName)) {
        dbData.verifiedMembers.push(data.icName);
    }

    if(data.playStyle === 'สายสตอรี่') {
        if(!dbData.members.story.includes(data.icName)) dbData.members.story.push(data.icName);
    } else {
        if(!dbData.members.farm.includes(data.icName)) dbData.members.farm.push(data.icName);
    }

    saveData();

    const payload = {
        content: `@everyone @here\n📢 **มีใบสมัครใหม่เข้ามาครับ!**\n👤 **ผู้สมัคร:** ${data.discordTag}\n📋 **ผู้คุมสอบ:** ${data.testerTag}\n🔗 **ห้องรอสอบ:** https://discord.gg/C6kKrrGbm`,
        embeds: [{
            title: "🌊 🩵 ใบสมัครเข้าแก๊ง BLACK KINGDOM (BKM)",
            description: "มีผู้สนใจสมัครเข้าร่วมตระกูล กรุณาตรวจสอบข้อมูลและดำเนินการสอบตามขั้นตอน",
            color: 3719416,
            fields: [
                {
                    name: "👤 ข้อมูล IC (ในเกม)",
                    value: `• **ชื่อ IC:** ${data.icName}\n• **อายุ IC:** ${data.icAge} ปี\n• **เพศ IC:** ${data.icGender}\n• **เลเวล:** ${data.level}`,
                    inline: false
                },
                {
                    name: "👽 ข้อมูล OC (นอกเกม)",
                    value: `• **ชื่อ OC:** ${data.ocName}\n• **อายุ OC:** ${data.ocAge} ปี\n• **เพศ OC:** ${data.ocGender}\n• **เวลาเล่น:** ${data.onlineHours}`,
                    inline: false
                },
                {
                    name: "⚔️ สายการเล่น",
                    value: data.playStyle,
                    inline: false
                },
                {
                    name: "💬 เหตุผลที่อยากเข้าร่วม",
                    value: data.reason,
                    inline: false
                },
                {
                    name: "🏷️ แท็ก Discord ผู้สมัคร",
                    value: data.discordTag,
                    inline: false
                },
                {
                    name: "📋 แท็กผู้คุมสอบ",
                    value: data.testerTag,
                    inline: false
                }
            ],
            footer: {
                text: "BLACK KINGDOM System • " + new Date().toLocaleString('th-TH')
            }
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
        res.status(500).json({ success: false });
    }
});

app.get('/api/applications', (req, res) => res.json(dbData.applications));
app.get('/api/members', (req, res) => res.json(dbData.members));

// 2. API กดปุ่มแจ้งเตือนกิจกรรม
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

// ระบบตั้งเวลาแจ้งเตือนอัตโนมัติ (เวลาไทย Asia/Bangkok)
const CRON_OPTIONS = { timezone: "Asia/Bangkok" };

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

// 3. API ขอออกแก๊ง
app.post('/api/leave-gang', async (req, res) => {
    const { icName, reason } = req.body;
    
    if(!dbData.verifiedMembers.includes(icName)) {
        return res.status(400).json({ success: false, message: 'ไม่พบรายชื่อนี้ในระบบ' });
    }

    const dateStr = new Date().toLocaleString('th-TH');
    dbData.leftMembers.push({ icName, reason, date: dateStr });
    
    dbData.members.story = dbData.members.story.filter(m => m !== icName);
    dbData.members.farm = dbData.members.farm.filter(m => m !== icName);
    dbData.verifiedMembers = dbData.verifiedMembers.filter(m => m !== icName);

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
        res.status(500).json({ success: false });
    }
});

app.get('/api/left-members', (req, res) => res.json(dbData.leftMembers));

app.listen(PORT, () => {
    console.log(`BKM Gang Server is running on port ${PORT}`);
});
