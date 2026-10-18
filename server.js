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
const WEBHOOK_ACTIVITY = "https://discord.com/api/webhooks/1561321885386670140/Fx2iPim0F9bL00h8EC6lXSAtN054VAFQW0OGd1ZQTyz1KeWg9tO730nycZqx7kAvC6iY"; 
const WEBHOOK_LEAVE = "https://discord.com/api/webhooks/1561320841059241994/VtmCOkw_XFJ2f-6xvBWIc8l4WcoucbQiPQlYr4624C5dBx5AZuQj5suUlIk0QXdKVq2h";

let applications = [];
let verifiedMembers = []; // รายชื่อสมาชิกจะเพิ่มเข้ามาก็ต่อเมื่อสมัครผ่านเว็บเท่านั้น
let leftMembers = [];
let members = {
    story: [],
    farm: []
};

// เก็บสถานะคนออนไลน์ในเว็บ (Active Visitors)
let activeVisitors = {};

app.post('/api/heartbeat', (req, res) => {
    const { visitorId } = req.body;
    activeVisitors[visitorId] = Date.now();
    res.sendStatus(200);
});

// เคลียร์รายชื่อคนที่ปิดเว็บไปแล้วเกิน 25 วินาที
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

// ตรวจสอบสมาชิกก่อนให้ทำเรื่องออกแก๊ง
app.get('/api/verify-member', (req, res) => {
    const { icName } = req.query;
    if(verifiedMembers.includes(icName)) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// 1. API รับใบสมัครส่งเข้า Discord และบันทึกชื่อเข้าฐานข้อมูลสมาชิกเว็บ
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

// ตั้งเวลาแจ้งเตือนอัตโนมัติ (Cron Jobs)
cron.schedule('59 12,17,20 * * *', async () => {
    await fetch(WEBHOOK_ACTIVITY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `@everyone ⏰ **AirDrop จะมาแล้วนะจ๊ะที่ร้ากก เตรียมตัวให้พร้อม!** 🌊🩵` })
    });
});

cron.schedule('0 13,18,21 * * *', async () => {
    let timeLabel = "13:00 (บ่าย 1)";
    const hour = new Date().getHours();
    if(hour === 18) timeLabel = "18:00 (6 โมงเย็น)";
    if(hour === 21) timeLabel = "21:00 (3 ทุ่ม)";
    
    await fetch(WEBHOOK_ACTIVITY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `@everyone 🚨 **AirDrop รอบ ${timeLabel} มาแล้วนะจ๊ะที่ร้ากก ขอให้สมาชิกทุกคนเข้าแอร์กันด้วยนะจ๊ะที่ร้ากก** 🌊🩵` })
    });
});

cron.schedule('59 19 * * *', async () => {
    await fetch(WEBHOOK_ACTIVITY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `@everyone ⏰ **ยึดคุกจะมาแล้วว ไปยึดคุกกันเถอะะ!** 🌊🩵` })
    });
});

cron.schedule('0 20 * * *', async () => {
    await fetch(WEBHOOK_ACTIVITY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `@everyone 🚨 **ขอให้ทุกคนเข้ามายึดคุกกันด้วยยยน้าา สู้ๆๆน้าาา** 🌊🩵` })
    });
});

cron.schedule('29 21 * * *', async () => {
    await fetch(WEBHOOK_ACTIVITY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `@everyone ⏰ **ให้ทุกคนเตรียมของยึดโซนกันให้พร้อม ไม่อีโก้น้าาา ชุบเพื่อนด้วย สู้ๆน้าาอ้วนน!** 🌊🩵` })
    });
});

cron.schedule('30 21 * * *', async () => {
    await fetch(WEBHOOK_ACTIVITY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `@everyone 🚨 **ยึดโซนมาแล้วลุ่ยเลยยๆ!** 🌊🩵` })
    });
});

// 3. API ขอออกแก๊ง (เช็คว่ามีชื่อในระบบจริงถึงจะลบออกได้)
app.post('/api/leave-gang', async (req, res) => {
    const { icName, reason } = req.body;
    
    if(!verifiedMembers.includes(icName)) {
        return res.status(400).json({ success: false, message: 'ไม่พบรายชื่อนี้ในระบบ' });
    }

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
