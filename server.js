const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// DISCORD WEBHOOK URLS
const WEBHOOK_APPLY = "https://discord.com/api/webhooks/1560910735494881402/nzUeuIZSq39cqTlifuljoYVAy78-Bn_XwKHH6K8in_5myVPsG1L6XQiculo68fOXwe_Q";
const WEBHOOK_ACTIVITY = "https://discord.com/api/webhooks/1561321885386670140/Fx2iPim0F9bL00h8EC6lXSAtN054VAFQW0OGd1ZQTyz1KeWg9tO730nycZqx7kAvC6iY"; // ห้องแจ้งเตือนกิจกรรม
const WEBHOOK_LEAVE = "https://discord.com/api/webhooks/1561320841059241994/VtmCOkw_XFJ2f-6xvBWIc8l4WcoucbQiPQlYr4624C5dBx5AZuQj5suUlIk0QXdKVq2h";

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || ""; 
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID || "";

let applications = [];
let verifiedMembers = ["Somchai_BKM", "NongName_BKM", "AdminStory_BKM", "FarmerPro_BKM"];
let leftMembers = [];
let members = {
    story: ["Somchai_BKM", "AdminStory_BKM"],
    farm: ["NongName_BKM", "FarmerPro_BKM"]
};

// ฟังก์ชันส่งข้อความเข้า Webhook ห้องกิจกรรม
async function sendDiscordActivity(message) {
    try {
        await fetch(WEBHOOK_ACTIVITY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: message })
        });
    } catch(e) { console.error('Webhook error:', e); }
}

// 1. API รับใบสมัครส่งเข้า Discord
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

// ดึงสถานะคนออนไลน์จริงจาก Discord API
app.get('/api/discord-online', async (req, res) => {
    if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) {
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
        res.json(guildMembers.map(m => ({ username: m.user.username })));
    } catch (e) {
        res.json([]);
    }
});

// 2. API กดปุ่มแจ้งเตือนกิจกรรมจากหน้าเว็บ
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

    await sendDiscordActivity(msg);
    res.status(200).json({ success: true });
});

// ==========================================
// ระบบตั้งเวลาแจ้งเตือนอัตโนมัติ (Cron Jobs)
// ==========================================

// --- AIRDROP (13:00, 18:00, 21:00) ---
// แจ้งเตือนก่อน 1 นาที (12:59, 17:59, 20:59)
cron.schedule('59 12,17,20 * * *', async () => {
    await sendDiscordActivity(`@everyone ⏰ **AirDrop จะมาแล้วนะจ๊ะที่ร้ากก เตรียมตัวให้พร้อม!** 🌊🩵`);
});
// แจ้งเตือนตอนถึงเวลา (13:00, 18:00, 21:00)
cron.schedule('0 13,18,21 * * *', async () => {
    let timeLabel = "13:00 (บ่าย 1)";
    const hour = new Date().getHours();
    if(hour === 18) timeLabel = "18:00 (6 โมงเย็น)";
    if(hour === 21) timeLabel = "21:00 (3 ทุ่ม)";
    
    await sendDiscordActivity(`@everyone 🚨 **AirDrop รอบ ${timeLabel} มาแล้วนะจ๊ะที่ร้ากก ขอให้สมาชิกทุกคนเข้าแอร์กันด้วยนะจ๊ะที่ร้ากก** 🌊🩵`);
});

// --- ยึดคุก (เวลา 20:00 น.) ---
// แจ้งเตือนก่อน 1 นาที (19:59)
cron.schedule('59 19 * * *', async () => {
    await sendDiscordActivity(`@everyone ⏰ **ยึดคุกจะมาแล้วว ไปยึดคุกกันเถอะะ!** 🌊🩵`);
});
// แจ้งเตือนตอนถึงเวลา (20:00)
cron.schedule('0 20 * * *', async () => {
    await sendDiscordActivity(`@everyone 🚨 **ขอให้ทุกคนเข้ามายึดคุกกันด้วยยยน้าา สู้ๆๆน้าาา** 🌊🩵`);
});

// --- วอยึดโซน (เวลา 21:30 น.) ---
// แจ้งเตือนก่อน 1 นาที (21:29)
cron.schedule('29 21 * * *', async () => {
    await sendDiscordActivity(`@everyone ⏰ **ให้ทุกคนเตรียมของยึดโซนกันให้พร้อม ไม่อีโก้น้าาา ชุบเพื่อนด้วย สู้ๆน้าาอ้วนน!** 🌊🩵`);
});
// แจ้งเตือนตอนถึงเวลา (21:30)
cron.schedule('30 21 * * *', async () => {
    await sendDiscordActivity(`@everyone 🚨 **ยึดโซนมาแล้วลุ่ยเลยยๆ!** 🌊🩵`);
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
