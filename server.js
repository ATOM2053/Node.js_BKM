const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// DISCORD WEBHOOK URLS
const WEBHOOK_APPLY = "https://discord.com/api/webhooks/1560910735494881402/nzUeuIZSq39cqTlifuljoYVAy78-Bn_XwKHH6K8in_5myVPsG1L6XQiculo68fOXwe_Q";
const WEBHOOK_LEAVE = "https://discord.com/api/webhooks/1561320841059241994/VtmCOkw_XFJ2f-6xvBWIc8l4WcoucbQiPQlYr4624C5dBx5AZuQj5suUlIk0QXdKVq2h";

let applications = [];
let leftMembers = [];
let members = {
    story: ["Somchai_BKM", "AdminStory_BKM"],
    farm: ["NongName_BKM", "FarmerPro_BKM"]
};

// 1. API รับใบสมัครส่งเข้า Discord
app.post('/api/apply', async (req, res) => {
    const data = req.body;
    applications.push(data);

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
                {
                    name: "👤 ข้อมูล IC (ในเกม)",
                    value: `• **ชื่อ IC:** ${data.icName}\n• **อายุ IC:** ${data.icAge} ปี\n• **เพศ:** ${data.icGender}\n• **เลเวล:** ${data.level}`,
                    inline: false
                },
                {
                    name: "🎮 ข้อมูล OC (นอกเกม)",
                    value: `• **ชื่อ OC:** ${data.ocName}\n• **อายุ OC:** ${data.ocAge} ปี\n• **เพศ:** ${data.ocGender}\n• **เวลาเล่น:** ${data.onlineHours}`,
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
        console.error('Error sending webhook:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/applications', (req, res) => res.json(applications));
app.get('/api/members', (req, res) => res.json(members));

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

// 3. API ขอออกแก๊ง
app.post('/api/leave-gang', async (req, res) => {
    const { icName, reason } = req.body;
    const dateStr = new Date().toLocaleString('th-TH');
    
    leftMembers.push({ icName, reason, date: dateStr });
    members.story = members.story.filter(m => m !== icName);
    members.farm = members.farm.filter(m => m !== icName);

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
