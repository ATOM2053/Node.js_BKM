const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch'); // หรือใช้ global fetch ใน Node.js เวอร์ชั่นใหม่
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Discord Webhooks ตามที่คุณกำหนด
const WEBHOOK_APPLY = "https://discord.com/api/webhooks/1561321885386670140/Fx2iPim0F9bL00h8EC6lXSAtN054VAFQW0OGd1ZQTyz1KeWg9tO730nycZqx7kAvC6iY";
const WEBHOOK_LEAVE = "https://discord.com/api/webhooks/1561320841059241994/VtmCOkw_XFJ2f-6xvBWIc8l4WcoucbQiPQlYr4624C5dBx5AZuQj5suUlIk0QXdKVq2h";

// ข้อมูลจำลองในหน่วยความจำ (สามารถปรับเปลี่ยนเป็น Database เช่น MongoDB หรือ SQLite ได้ตามต้องการ)
let applications = [];
let leftMembers = [];
let members = {
    story: ["Somchai_BKM", "AdminStory_BKM"],
    farm: ["NongName_BKM", "FarmerPro_BKM"]
};

// 1. API รับใบสมัคร
app.post('/api/apply', async (req, res) => {
    const data = req.body;
    applications.push(data);

    // แยกสายลงหมวดหมู่สมาชิกอัตโนมัติ
    if(data.playStyle === 'สายสตอรี่') {
        if(!members.story.includes(data.icName)) members.story.push(data.icName);
    } else {
        if(!members.farm.includes(data.icName)) members.farm.push(data.icName);
    }

    // ส่ง Webhook ไปยัง Discord ใบสมัคร
    const payload = {
        content: `@everyone 📢 **มีใบสมัครใหม่เข้าสู่ระบบเว็บไซต์!**\n👤 **ผู้สมัคร:** ${data.discordTag} (${data.icName})\n🎮 **สายการเล่น:** ${data.playStyle}`,
        embeds: [{
            title: "🌊 🩵 ใบสมัครเข้าแก๊ง BLACK KINGDOM",
            color: 3719416,
            fields: [
                { name: "ชื่อ IC", value: data.icName, inline: true },
                { name: "เลเวล", value: String(data.level), inline: true },
                { name: "สายการเล่น", value: data.playStyle, inline: true },
                { name: "เหตุผล", value: data.reason, inline: false }
            ],
            timestamp: new Date().toISOString()
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
        console.error('Webhook Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ดึงรายการใบสมัคร
app.get('/api/applications', (req, res) => {
    res.json(applications);
});

// ดึงรายชื่อสมาชิกแยกตามสาย
app.get('/api/members', (req, res) => {
    res.json(members);
});

// 2. API แจ้งเตือนเวลากิจกรรมเริ่มลง Discord
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

// 3. API ขอออกแก๊ง & ส่งแจ้งเตือนข้อความอำลาเศร้าๆ ไปยัง Discord 
app.post('/api/leave-gang', async (req, res) => {
    const { icName, reason } = req.body;
    const dateStr = new Date().toLocaleString('th-TH');
    
    leftMembers.push({ icName, reason, date: dateStr });

    // ลบออกจากรายชื่อสมาชิกปัจจุบัน
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

app.get('/api/left-members', (req, res) => {
    res.json(leftMembers);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
