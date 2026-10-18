const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');
const cron = require('node-cron'); // ใช้ตั้งเวลาแจ้งเตือนอัตโนมัติ

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// DISCORD WEBHOOK URLS
const WEBHOOK_APPLY = "https://discord.com/api/webhooks/1560910735494881402/nzUeuIZSq39cqTlifuljoYVAy78-Bn_XwKHH6K8in_5myVPsG1L6XQiculo68fOXwe_Q";
const WEBHOOK_LEAVE = "https://discord.com/api/webhooks/1561320841059241994/VtmCOkw_XFJ2f-6xvBWIc8l4WcoucbQiPQlYr4624C5dBx5AZuQj5suUlIk0QXdKVq2h";

// ข้อมูลดิสคอร์ด (หากคุณใช้งาน Discord Bot Token และ Guild ID สามารถใส่เพื่อดึงรายชื่อคนออนไลน์จริงได้ที่นี่)
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || ""; 
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID || "";

let applications = [];
let verifiedMembers = ["Somchai_BKM", "NongName_BKM", "AdminStory_BKM", "FarmerPro_BKM"]; // รายชื่อสมาชิกที่ผ่านการสมัคร
let leftMembers = [];
let members = {
    story: ["Somchai_BKM", "AdminStory_BKM"],
    farm: ["NongName_BKM", "FarmerPro_BKM"]
};

// ตรวจสอบสมาชิกก่อนเข้าชมเว็บ
app.get('/api/verify-member', (req, res) => {
    const { icName } = req.query;
    if(verifiedMembers.includes(icName)) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// 1. API รับใบสมัครส่งเข้า Discord และเพิ่มชื่อเข้าฐานข้อมูลสมาชิกอัตโนมัติ
app.post('/api/apply', async (req, res) => {
    const data = req.body;
    applications.push(data);

    if(!verifiedMembers.includes(data.icName)) {
        verifiedMembers.push(data.icName);
    }

    if(data.playStyle === 'สายสตอรี่') {
        if(!members.story.includes(data.icName)) members.story.push(data.icName);
    } else {
        if(!members.farm.includes(data.icName)) members.farm.push(data.icName);
    }

    const payload = {
        content: `@everyone @here\n📢 **มีใบสมัครใหม่เข้ามาครับ!**\n👤 **ผู้สมัคร:** ${data.discordTag}\n📋 **ผู้คุมสอบ:** ${data.testerTag}\n🔗 **ห้องรอสอบ:** https://discord.gg/C6kKrrGbm`,
        embeds: [{
            title: "🌊 🩵 ใบสมัครเข้าแก๊ง BLACK KINGDOM (BKM)",
            description: "มีผู้สนใจสมัครเข้าร่วมตระกูล กรุณาตรวจสอบข้อมูลและดำเนินการสอบตามขั้นตอน",
            color: 3719416,
            fields: [
                { name: "👤 ข้อมูล IC (ในเกม)", value: `• **ชื่อ IC:** ${data.icName}\n• **อายุ IC:** ${data.icAge} ปี\n• **เลเวล:** ${data.level}`, inline: false },
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
        res.status(500).json({ success: false });
    }
});

app.get('/api/applications', (req, res) => res.json(applications));
app.get('/api/members', (req, res) => res.json(members));

// ดึงสถานะคนออนไลน์จริงจาก Discord (ถ้าเปิดใช้งาน Bot Token)
app.get('/api/discord-online', async (req, res) => {
    if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) {
        // หากยังไม่ได้ตั้งค่า Bot Token จะแสดงตัวอย่างสมาชิกจำลองที่ออนไลน์จริง
        return res.json([
            { username: "Somchai_BKM (สายสตอรี่)" },
            { username: "NongName_BKM (สายฟาร์ม)" }
        ]);
    }
    try {
        const response = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members?limit=50`, {
            headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` }
        });
        const guildMembers = await response.json();
        // กรองเฉพาะสมาชิกที่ออนไลน์ (หากต่อ API Gateway)
        res.json(guildMembers.map(m => ({ username: m.user.username })));
    } catch (e) {
        res.json([]);
    }
});

// 2. API แจ้งเตือนเวลากิจกรรม
app.post('/api/notify-activity', async (req, res) => {
    const { activityName, timeText } = req.body;
    const payload = {
        content: `@everyone 🚨 **ประกาศสำคัญ! กิจกรรม ${activityName} เริ่มขึ้นแล้ว!** ⏰ รอบเวลา: ${timeText}\nขอให้สมาชิกทุกคนเตรียมตัวให้พร้อมและเข้าจุดประจำการทันที! 🌊🩵`
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

// ตั้งเวลาแจ้งเตือน AirDrop อัตโนมัติทุกวันตามเวลา 13:00, 18:00, 21:00
cron.schedule('0 13,18,21 * * *', async () => {
    const payload = {
        content: `@everyone 🚨 **[แจ้งเตือนอัตโนมัติ] กิจกรรม AirDrop (แอร์ดรอป) รอบเวลาปัจจุบันเริ่มแล้ว!**\nขอให้สมาชิกทุกคนเตรียมตัวเข้าพื้นที่ด่วน! 🌊🩵`
    };
    try {
        await fetch(WEBHOOK_APPLY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch(e) { console.error('Auto cron error:', e); }
});

// 3. API ขอออกแก๊ง
app.post('/api/leave-gang', async (req, res) => {
    const { icName, reason } = req.body;
    const dateStr = new Date().toLocaleString('th-TH');
    
    leftMembers.push({ icName, reason, date: dateStr });
    members.story = members.story.filter(m => m !== icName);
    members.farm = members.farm.filter(m => m !== icName);
    verifiedMembers = verifiedMembers.filter(m => m !== icName);

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

app.get('/api/left-members', (req, res) => res.json(leftMembers));

app.listen(PORT, () => {
    console.log(`BKM Gang Server is running on port ${PORT}`);
});
