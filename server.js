<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BLACK KINGDOM (BKM) 🌊 🩵 - ระบบจัดการและสมัครเข้าแก๊ง</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Kanit:ital,wght@0,300;0,400;0,500;0,600;0,700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
        :root {
            --bg-dark: #060911;
            --bg-card: rgba(15, 23, 42, 0.9);
            --accent-blue: #38bdf8;
            --accent-cyan: #7dd3fc;
            --accent-deep: #0284c7;
            --accent-glow: rgba(56, 189, 248, 0.35);
            --text-main: #f8fafc;
            --text-sub: #94a3b8;
            --border-color: rgba(56, 189, 248, 0.25);
            --yellow-warning: #f59e0b;
            --orange-warning: #f97316;
            --red-warning: #ef4444;
            --black-warning: #334155;
            --gold-crown: #fbbf24;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Kanit', sans-serif; }

        body {
            background-color: var(--bg-dark);
            color: var(--text-main);
            line-height: 1.6;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            overflow-x: hidden;
            background-image: 
                radial-gradient(circle at 10% 10%, rgba(2, 132, 199, 0.15) 0%, transparent 40%),
                radial-gradient(circle at 90% 90%, rgba(56, 189, 248, 0.1) 0%, transparent 40%);
            background-attachment: fixed;
        }

        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: var(--bg-dark); }
        ::-webkit-scrollbar-thumb { background: var(--accent-deep); border-radius: 4px; }

        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; width: 100%; }

        .navbar {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            z-index: 2000;
            background: rgba(6, 9, 17, 0.98);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid var(--border-color);
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }

        .nav-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 70px;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 1.3rem;
            font-weight: 700;
            color: var(--text-main);
            text-decoration: none;
            cursor: pointer;
        }

        .logo i { color: var(--gold-crown); }
        .logo span { color: var(--accent-cyan); }

        .nav-links {
            display: flex;
            gap: 6px;
            list-style: none;
            flex-wrap: wrap;
        }

        .nav-tab {
            background: transparent;
            border: none;
            color: var(--text-sub);
            padding: 8px 12px;
            font-size: 0.88rem;
            font-weight: 500;
            cursor: pointer;
            border-radius: 8px;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .nav-tab:hover { color: var(--accent-cyan); background: rgba(56, 189, 248, 0.1); }
        .nav-tab.active {
            color: #fff;
            background: linear-gradient(135deg, var(--accent-deep) 0%, var(--accent-blue) 100%);
            box-shadow: 0 0 12px var(--accent-glow);
        }

        .menu-toggle { display: none; font-size: 1.5rem; color: var(--text-main); cursor: pointer; }

        main {
            flex: 1;
            padding-top: 110px;
            padding-bottom: 60px;
        }

        .page-content { display: none; animation: fadeIn 0.3s ease-in-out; }
        .page-content.active { display: block; }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .page-header { text-align: center; margin-bottom: 30px; }
        .page-title {
            font-size: 2rem;
            font-weight: 700;
            background: linear-gradient(135deg, #ffffff 30%, var(--accent-cyan) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 8px;
        }
        .page-subtitle { color: var(--text-sub); font-size: 0.95rem; }

        .glass-card {
            background: var(--bg-card);
            backdrop-filter: blur(12px);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 25px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            margin-bottom: 25px;
        }

        .btn-bkm {
            background: linear-gradient(135deg, var(--accent-deep) 0%, var(--accent-blue) 100%);
            color: #fff;
            padding: 12px 24px;
            border-radius: 30px;
            font-size: 0.95rem;
            font-weight: 600;
            border: none;
            cursor: pointer;
            box-shadow: 0 0 15px var(--accent-glow);
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            text-decoration: none;
        }

        .btn-bkm:hover { transform: translateY(-2px); box-shadow: 0 0 22px rgba(56, 189, 248, 0.6); }

        .form-container { max-width: 800px; margin: 0 auto; }
        .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.full-width { grid-column: span 2; }
        .form-group label { font-size: 0.88rem; font-weight: 500; color: var(--text-main); display: flex; align-items: center; gap: 6px; }
        .form-group label i { color: var(--accent-cyan); }
        .form-control {
            background: rgba(6, 9, 17, 0.85);
            border: 1px solid var(--border-color);
            border-radius: 10px;
            padding: 12px 14px;
            color: #fff;
            font-size: 0.92rem;
            outline: none;
        }
        .form-control:focus { border-color: var(--accent-cyan); box-shadow: 0 0 10px var(--accent-glow); }
        textarea.form-control { resize: vertical; min-height: 90px; }
        select.form-control option { background: #0f172a; color: #fff; }
        .form-divider { grid-column: span 2; height: 1px; background: var(--border-color); margin: 8px 0; }
        .form-section-title { grid-column: span 2; font-size: 1.1rem; color: var(--accent-cyan); font-weight: 600; display: flex; align-items: center; gap: 8px; }

        .penalty-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 15px; }
        .penalty-item { background: rgba(15, 23, 42, 0.7); border: 1px solid var(--border-color); padding: 14px 18px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; gap: 15px; }
        .penalty-num { color: var(--accent-cyan); font-weight: 700; }
        
        .rule-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .rule-list li { background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.05); padding: 12px 16px; border-radius: 10px; font-size: 0.9rem; display: flex; align-items: flex-start; gap: 10px; }
        .rule-list li i { color: var(--accent-cyan); margin-top: 3px; }

        .member-category-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 20px; }
        .member-box { background: rgba(15, 23, 42, 0.8); border: 1px solid var(--border-color); border-radius: 14px; padding: 20px; }
        .member-box h3 { color: var(--accent-cyan); font-size: 1.05rem; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; }
        .member-list { list-style: none; display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto; }
        .member-item { background: rgba(6, 9, 17, 0.6); padding: 10px 14px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 0.88rem; }
        .online-dot { width: 8px; height: 8px; background-color: #4ade80; border-radius: 50%; box-shadow: 0 0 8px #4ade80; display: inline-block; margin-right: 6px; }

        .avatar-container { position: relative; width: 110px; height: 110px; margin: 0 auto 15px; }
        .avatar-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 3px solid var(--accent-cyan); }
        .avatar-upload-btn { position: absolute; bottom: 0; right: 0; background: var(--accent-deep); color: #fff; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 2px solid var(--bg-dark); }

        .footer { background: rgba(6, 9, 17, 0.95); border-top: 1px solid var(--border-color); padding: 20px 0; text-align: center; color: var(--text-sub); font-size: 0.82rem; margin-top: auto; }

        @media (max-width: 868px) {
            .menu-toggle { display: block; }
            .nav-links {
                position: fixed;
                top: 70px;
                left: -100%;
                width: 100%;
                height: calc(100vh - 70px);
                background: rgba(6, 9, 17, 0.98);
                backdrop-filter: blur(25px);
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
                padding: 25px 20px;
                align-content: start;
                transition: all 0.3s ease;
                z-index: 1999;
                border-top: 1px solid var(--border-color);
            }
            .nav-links.active { left: 0; }
            .nav-tab {
                width: 100%;
                justify-content: flex-start;
                padding: 14px 16px;
                font-size: 0.92rem;
                background: rgba(15, 23, 42, 0.8);
                border: 1px solid var(--border-color);
                border-radius: 12px;
            }
            .form-grid { grid-template-columns: 1fr; }
            .form-group.full-width, .form-divider, .form-section-title { grid-column: span 1; }
        }
    </style>
</head>
<body>

    <nav class="navbar">
        <div class="container nav-container">
            <div class="logo" onclick="switchTab('apply')">
                <i class="fa-solid fa-crown"></i> BLACK KINGDOM <span>BKM</span>
            </div>
            <div class="menu-toggle" id="menuToggle"><i class="fa-solid fa-bars"></i></div>
            <ul class="nav-links" id="navLinks">
                <li><button class="nav-tab active" onclick="switchTab('apply')"><i class="fa-solid fa-file-pen"></i> กรอกใบสมัคร</button></li>
                <li><button class="nav-tab" onclick="switchTab('myApplication')"><i class="fa-solid fa-id-card"></i> เช็คใบสมัครของฉัน</button></li>
                <li><button class="nav-tab" onclick="switchTab('profile')"><i class="fa-solid fa-user-circle"></i> โปรไฟล์ของฉัน</button></li>
                <li><button class="nav-tab" onclick="switchTab('applicationsList')"><i class="fa-solid fa-list-check"></i> ดูใบสมัครทั้งหมด</button></li>
                <li><button class="nav-tab" onclick="switchTab('memberList')"><i class="fa-solid fa-users"></i> สมาชิก & ออนไลน์</button></li>
                <li><button class="nav-tab" onclick="switchTab('leaveGang')"><i class="fa-solid fa-right-from-bracket"></i> ขอออกแก๊ง</button></li>
                <li><button class="nav-tab" onclick="switchTab('qualifications')"><i class="fa-solid fa-user-check"></i> คุณสมบัติ</button></li>
                <li><button class="nav-tab" onclick="switchTab('gangRules')"><i class="fa-solid fa-gavel"></i> กฎแก๊ง</button></li>
                <li><button class="nav-tab" onclick="switchTab('activityRules')"><i class="fa-solid fa-shield-halved"></i> กฎกิจกรรม</button></li>
                <li><button class="nav-tab" onclick="switchTab('contact')"><i class="fa-solid fa-address-book"></i> ติดต่อ</button></li>
            </ul>
        </div>
    </nav>

    <main class="container">
        <!-- 1. กรอกใบสมัคร -->
        <section id="apply" class="page-content active">
            <div class="page-header">
                <h1 class="page-title">แบบฟอร์มสมัครเข้าแก๊ง BKM</h1>
                <p class="page-subtitle">รองรับทั้งผู้เล่นมือถือ (MB) และ PC สมัครแล้วบันทึกเข้าระบบทันที</p>
            </div>
            <div class="glass-card form-container">
                <form id="applyForm">
                    <div class="form-grid">
                        <div class="form-section-title"><i class="fa-solid fa-user-gear"></i> ข้อมูลในเกม (IC)</div>
                        <div class="form-group">
                            <label for="icName"><i class="fa-solid fa-signature"></i> ชื่อ IC</label>
                            <input type="text" id="icName" class="form-control" placeholder="เช่น Bael" required>
                        </div>
                        <div class="form-group">
                            <label for="icAge"><i class="fa-solid fa-cake-candles"></i> อายุ IC</label>
                            <input type="number" id="icAge" class="form-control" placeholder="เช่น 25" required>
                        </div>
                        <div class="form-group">
                            <label for="icGender"><i class="fa-solid fa-venus-mars"></i> เพศ IC</label>
                            <select id="icGender" class="form-control" required>
                                <option value="" disabled selected>เลือกเพศ IC</option>
                                <option value="ชาย">ชาย</option>
                                <option value="หญิง">หญิง</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="level"><i class="fa-solid fa-ranking-star"></i> เลเวล</label>
                            <input type="number" id="level" class="form-control" placeholder="ขั้นต่ำ เลเวล 3" min="1" required>
                        </div>

                        <div class="form-divider"></div>
                        <div class="form-section-title"><i class="fa-solid fa-user-astronaut"></i> ข้อมูลผู้เล่นจริง (OC)</div>
                        <div class="form-group">
                            <label for="ocName"><i class="fa-solid fa-user"></i> ชื่อ OC</label>
                            <input type="text" id="ocName" class="form-control" placeholder="เช่น สมชาย" required>
                        </div>
                        <div class="form-group">
                            <label for="ocAge"><i class="fa-solid fa-calendar-days"></i> อายุ OC</label>
                            <input type="number" id="ocAge" class="form-control" placeholder="อายุจริง" required>
                        </div>
                        <div class="form-group">
                            <label for="ocGender"><i class="fa-solid fa-venus-mars"></i> เพศ OC</label>
                            <select id="ocGender" class="form-control" required>
                                <option value="" disabled selected>เลือกเพศ OC</option>
                                <option value="ชาย">ชาย</option>
                                <option value="หญิง">หญิง</option>
                                <option value="อื่นๆ">อื่นๆ</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="onlineHours"><i class="fa-solid fa-clock"></i> ชม. ออนไลน์ต่อวัน</label>
                            <input type="text" id="onlineHours" class="form-control" placeholder="เช่น 3 ชม. ขึ้นไป" required>
                        </div>

                        <div class="form-divider"></div>
                        <div class="form-section-title"><i class="fa-solid fa-clipboard-question"></i> ข้อมูลการเล่น</div>
                        <div class="form-group full-width">
                            <label for="playStyle"><i class="fa-solid fa-gamepad"></i> สายการเล่น</label>
                            <select id="playStyle" class="form-control" required>
                                <option value="" disabled selected>เลือกสายการเล่น</option>
                                <option value="สายสตอรี่">สายสตอรี่</option>
                                <option value="สายฟาร์ม">สายฟาร์ม</option>
                            </select>
                        </div>
                        <div class="form-group full-width">
                            <label for="reason"><i class="fa-solid fa-heart"></i> เหตุผลที่เข้าร่วม</label>
                            <textarea id="reason" class="form-control" placeholder="อธิบายเหตุผล..." required></textarea>
                        </div>
                        <div class="form-group">
                            <label for="discordTag"><i class="fa-brands fa-discord"></i> แท็กดิสตัวเอง</label>
                            <input type="text" id="discordTag" class="form-control" placeholder="@username" required>
                        </div>
                        <div class="form-group">
                            <label for="testerTag"><i class="fa-solid fa-user-check"></i> แท็กผู้คุมสอบ</label>
                            <input type="text" id="testerTag" class="form-control" placeholder="@ผู้คุมสอบ" required>
                        </div>
                        <button type="submit" class="btn-bkm" id="submitBtn" style="grid-column: span 2; width: 100%; margin-top: 10px;">
                            <i class="fa-solid fa-paper-plane"></i> ส่งใบสมัครเข้าแก๊ง
                        </button>
                    </div>
                </form>
            </div>
        </section>

        <!-- 2. เช็คใบสมัคร -->
        <section id="myApplication" class="page-content">
            <div class="page-header">
                <h1 class="page-title">ตรวจสอบใบสมัครของฉัน</h1>
                <p class="page-subtitle">กรอกชื่อ IC เพื่อค้นหาใบสมัครของคุณ</p>
            </div>
            <div class="glass-card form-container" style="max-width: 550px;">
                <div class="form-group" style="margin-bottom: 15px;">
                    <label for="searchIcName"><i class="fa-solid fa-signature"></i> กรอกชื่อ IC ของคุณ</label>
                    <input type="text" id="searchIcName" class="form-control" placeholder="เช่น Bael">
                </div>
                <button type="button" class="btn-bkm" onclick="searchMyApplication()" style="width: 100%;">
                    <i class="fa-solid fa-magnifying-glass"></i> ค้นหาใบสมัคร
                </button>
                <div id="myAppResult" style="margin-top: 20px;"></div>
            </div>
        </section>

        <!-- 3. โปรไฟล์ -->
        <section id="profile" class="page-content">
            <div class="page-header">
                <h1 class="page-title">โปรไฟล์สมาชิก BKM</h1>
                <p class="page-subtitle">จัดการรูปโปรไฟล์และข้อมูลประจำตัว (บันทึกถาวร)</p>
            </div>
            <div class="glass-card form-container" style="max-width: 450px; text-align: center;">
                <div class="avatar-container">
                    <img id="profileAvatar" src="https://via.placeholder.com/150/0284c7/ffffff?text=BKM" class="avatar-img">
                    <label for="avatarInput" class="avatar-upload-btn"><i class="fa-solid fa-camera"></i></label>
                    <input type="file" id="avatarInput" accept="image/*" style="display: none;" onchange="uploadAvatar(event)">
                </div>
                <h2 id="profileIcName" style="color: var(--accent-cyan); margin-bottom: 4px;">ยังไม่ได้ตั้งชื่อ IC</h2>
                <p id="profileDiscord" style="color: var(--text-sub); font-size: 0.9rem; margin-bottom: 15px;">Discord: -</p>
                <div style="text-align: left; background: rgba(6, 9, 17, 0.6); padding: 15px; border-radius: 10px; border: 1px solid var(--border-color);">
                    <p><b>สายการเล่น:</b> <span id="profilePlayStyle">-</span></p>
                    <p><b>เลเวล:</b> <span id="profileLevel">-</span></p>
                    <p><b>สถานะ:</b> <span style="color: #4ade80;">ลงทะเบียนสมาชิกแล้ว</span></p>
                </div>
            </div>
        </section>

        <!-- 4. รายการทั้งหมด -->
        <section id="applicationsList" class="page-content">
            <div class="page-header"><h1 class="page-title">รายการใบสมัครทั้งหมด</h1></div>
            <div class="glass-card"><div id="appListContainer" style="display: flex; flex-direction: column; gap: 12px;">กำลังโหลด...</div></div>
        </section>

        <!-- 5. สมาชิก & ออนไลน์ -->
        <section id="memberList" class="page-content">
            <div class="page-header"><h1 class="page-title">สมาชิก & สถานะคนออนเว็บ</h1></div>
            <div class="glass-card">
                <h3 style="color: #fff; margin-bottom: 12px;"><i class="fa-solid fa-signal" style="color: #4ade80;"></i> คนกำลังออนไลน์เว็บ</h3>
                <div class="member-box" style="margin-bottom: 20px;">
                    <ul class="member-list" id="webOnlineList"><li>กำลังโหลด...</li></ul>
                </div>

                <div class="member-category-grid">
                    <div class="member-box">
                        <h3><i class="fa-solid fa-masks-theater"></i> สายสตอรี่</h3>
                        <ul class="member-list" id="storyMembersList"><li>ไม่มีสมาชิก</li></ul>
                    </div>
                    <div class="member-box">
                        <h3><i class="fa-solid fa-tractor"></i> สายฟาร์ม</h3>
                        <ul class="member-list" id="farmMembersList"><li>ไม่มีสมาชิก</li></ul>
                    </div>
                </div>
            </div>
        </section>

        <!-- 6. ขอออกแก๊ง -->
        <section id="leaveGang" class="page-content">
            <div class="page-header"><h1 class="page-title">ระบบขอออกแก๊ง</h1></div>
            <div class="glass-card form-container" style="max-width: 550px;">
                <form id="leaveForm">
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label for="leaveIcName">ชื่อ IC ของคุณ</label>
                        <input type="text" id="leaveIcName" class="form-control" placeholder="เช่น Bael" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label for="leaveReason">เหตุผลการออก</label>
                        <textarea id="leaveReason" class="form-control" placeholder="ระบุเหตุผล..." required></textarea>
                    </div>
                    <button type="button" class="btn-bkm" onclick="submitLeaveGang()" style="width: 100%; background: linear-gradient(135deg, #ef4444, #dc2626);">ขอออกแก๊ง</button>
                </form>
            </div>
        </section>

        <!-- 7. คุณสมบัติ -->
        <section id="qualifications" class="page-content">
            <div class="page-header"><h1 class="page-title">คุณสมบัติผู้สมัคร</h1></div>
            <div class="glass-card"><p style="text-align: center;">รับทั้ง ชาย / หญิง, เลเวล 3 ขึ้นไป, อายุ 15+ (ต่ำกว่าพิจารณาพิเศษ), มีเวลาออน, รองรับทั้ง MB และ PC</p></div>
        </section>

        <!-- 8. กฎแก๊ง (ครบถ้วน 18 ข้อ) -->
        <section id="gangRules" class="page-content">
            <div class="page-header">
                <h1 class="page-title">กฎการโดนใบ</h1>
                <p class="page-subtitle">บทลงโทษภายในตระกูล BLACK KINGDOM</p>
            </div>
            <div class="glass-card">
                <div class="penalty-grid">
                    <div class="penalty-item"><span class="penalty-num">1.</span> สมาชิกต้องฟังคำสั่งจากหลีดรองหลีดผ่าฝืน <span style="color:var(--yellow-warning);">ใบเหลือง🟨/ใบส้ม🟧</span></div>
                    <div class="penalty-item"><span class="penalty-num">2.</span> นำพาความเดือดร้อนมาให้ตระกูลโดยไม่รับผิดชอบ <span style="color:var(--red-warning);">ใบแดง🟥/ใบดำ⬛</span></div>
                    <div class="penalty-item"><span class="penalty-num">3.</span> นำพาผู้อื่นหรือคนภายนอกเข้าดิสโดยไม่ได้อนุญาต <span style="color:var(--yellow-warning);">ใบเหลือง🟨</span></div>
                    <div class="penalty-item"><span class="penalty-num">4.</span> นำสกินแก๊งไปขายหรือจำหน่ายให้ผู้อื่น <span style="color:var(--red-warning);">ใบแดง🟥/ใบดำ⬛</span></div>
                    <div class="penalty-item"><span class="penalty-num">5.</span> เล่นโปรเล่นมอด <span style="color:var(--text-main);">ใบดำ⬛</span></div>
                    <div class="penalty-item"><span class="penalty-num">6.</span> ด่าเรื้อนไปด่าแก็งอื่น <span style="color:var(--orange-warning);">ใบส้ม🟧</span></div>
                    <div class="penalty-item"><span class="penalty-num">7.</span> ไม่เชื่อฟังผู้คุมสายสตอรี่ <span style="color:var(--yellow-warning);">ใบเหลือง🟨/ใบส้ม🟧</span></div>
                    <div class="penalty-item"><span class="penalty-num">8.</span> ไม่มีความรับผิดชอบ <span style="color:var(--yellow-warning);">ใบเหลือง🟨</span></div>
                    <div class="penalty-item"><span class="penalty-num">9.</span> สอบสวนแล้วให้การเท็จ <span style="color:var(--red-warning);">ใบแดง🟥</span></div>
                    <div class="penalty-item"><span class="penalty-num">10.</span> แจ้งลาโดยสาเหตุไม่ชัดเจน <span style="color:var(--yellow-warning);">ใบเหลือง🟨</span></div>
                    <div class="penalty-item"><span class="penalty-num">11.</span> ส่งลิ้งค์ดิสมั่ว <span style="color:var(--yellow-warning);">ใบเหลือง🟨</span></div>
                    <div class="penalty-item"><span class="penalty-num">12.</span> ด่าบุพการี <span style="color:var(--orange-warning);">ใบส้ม🟧</span></div>
                    <div class="penalty-item"><span class="penalty-num">13.</span> ผ่าฝืนกดคลูดาวห์พบเจอสถานที่ต้องห้าม <span style="color:var(--red-warning);">โดน×2 🚫</span></div>
                    <div class="penalty-item"><span class="penalty-num">14.</span> นำข้อมูลภายในแก็งไปเผยแพร่ <span style="color:var(--red-warning);">ใบแดง🟥/ใบดำ⬛</span></div>
                    <div class="penalty-item"><span class="penalty-num">15.</span> ไม่จ่ายเงินแก๊ง <span style="color:var(--yellow-warning);">ใบเหลือง🟨</span></div>
                    <div class="penalty-item"><span class="penalty-num">16.</span> ร่วมมือกับแก๊งอื่นในกิจกรรมยึดคุก/อื่นๆ <span style="color:var(--red-warning);">โดนใบ 🟥</span></div>
                    <div class="penalty-item"><span class="penalty-num">17.</span> มีปัญหา เรื้อน หรือทำร้ายพันธมิตร <span style="color:var(--text-main);">โดนใบ⬛️</span></div>
                    <div class="penalty-item"><span class="penalty-num">18.</span> คนในแก๊งทำโพเทคแก๊งแตก <span style="color:var(--yellow-warning);">ใบ🟨+เสียค่าโพเทค</span></div>
                </div>
            </div>
        </section>

        <!-- 9. กฎกิจกรรม (วอยึดโซน + ยึดคุก Pawria Town + AirDrop) -->
        <section id="activityRules" class="page-content">
            <div class="page-header">
                <h1 class="page-title">กฎการเล่นกิจกรรมแก๊ง</h1>
                <p class="page-subtitle">ข้อบังคับในการลงเล่นกิจกรรม AirDrop, ยึดคุก และ วอยึดโซน</p>
            </div>

            <!-- กฎวอยึดโซน -->
            <div class="glass-card" style="margin-bottom: 25px;">
                <h3 style="color: var(--accent-cyan); margin-bottom: 12px;"><i class="fa-solid fa-burst"></i> กฎวอยึดโซน</h3>
                <ul class="rule-list">
                    <li><i class="fa-solid fa-check"></i> ห้าม DB หรือ ขับรถชนในโซน (ใบเหลือง)</li>
                    <li><i class="fa-solid fa-check"></i> ห้ามตีนอกสถานที่ (ใบส้ม)</li>
                    <li><i class="fa-solid fa-check"></i> ห้ามอุ้มศพกักศพ (ใบส้ม)</li>
                    <li><i class="fa-solid fa-check"></i> ห้ามใส่สกินเด็กเล่นกิจกรรม (ใบส้ม)</li>
                    <li><i class="fa-solid fa-check"></i> ห้ามเล่นโปรมอด (ใบแดง)</li>
                    <li><i class="fa-solid fa-check"></i> ห้ามอีโม (ใบแดง)</li>
                    <li><i class="fa-solid fa-check"></i> ห้าม Toxic หรือบัพแรงเกินไป (ใบแดง)</li>
                </ul>
                <div style="background: rgba(7,9,17,0.7); border: 1px dashed var(--accent-cyan); padding: 12px; border-radius: 8px; margin-top: 12px; font-size: 0.88rem; color: var(--accent-cyan);">
                    • การเล่นวอยึดโซนต้องต่อสู้ภายในวงเท่านั้น ห้ามออกจากวงเพื่อไปปั๊มยา, ชุบชีวิต, อุ้มเพื่อนไปชุบ แล้วกลับเข้ามาใหม่<br>
                    • ห้ามพันธมิตรหรือร่วมมือกับแก๊งอื่นในช่วงกิจกรรม<br>
                    • หากไม่สามารถสู้ต่อได้ ให้ขับรถออกจากพื้นที่เพื่อยอมแพ้
                </div>
            </div>

            <!-- กฎยึดคุก Pawria Town -->
            <div class="glass-card" style="margin-bottom: 25px;">
                <h3 style="color: var(--accent-cyan); margin-bottom: 12px;"><i class="fa-solid fa-dungeon"></i> กฎยึดคุก Pawria Town (เวลาเล่น: 20:00 น.)</h3>
                <ul class="rule-list">
                    <li><i class="fa-solid fa-check"></i> 1. ต้องตีกันให้ตายจนเหลือเพียง 1 แก๊ง ถึงจะเก็บจุดยึดคุกได้ (ทำบัคเก็บ = ใบแดง / เก็บตอนคนยังไม่ตาย = ใบส้ม)</li>
                    <li><i class="fa-solid fa-check"></i> 2. ห้ามร่วมมือกับแก๊งอื่น (ใบส้มทั้งแก๊ง)</li>
                    <li><i class="fa-solid fa-check"></i> 3. ห้ามอีโม (ใบแดง)</li>
                    <li><i class="fa-solid fa-check"></i> 4. ห้ามนำเรื่องกิจกรรมมาเป็นสตอรี่ความแค้นส่วนตัว (ใบเหลือง)</li>
                    <li><i class="fa-solid fa-check"></i> 5. ห้ามใส่สกินเด็ก, สกินตัวเล็ก (ใบส้ม)</li>
                    <li><i class="fa-solid fa-check"></i> 6. ห้าม Toxic หรือบัพกันแรงเกินไป (ใบแดง)</li>
                    <li><i class="fa-solid fa-check"></i> 7. ห้ามใช้มอด โปร ทำบัค (ใบแดง)</li>
                    <li><i class="fa-solid fa-check"></i> 8. ห้ามอุ้ม กักศพ</li>
                    <li><i class="fa-solid fa-check"></i> 9. ห้ามบู๊ด เปิดซาวด์ก่อกวน (ใบเหลือง)</li>
                    <li><i class="fa-solid fa-check"></i> 10. ห้ามดักจุดเกิด (ใบเหลือง)</li>
                    <li><i class="fa-solid fa-check"></i> 11. ห้ามใส่แฟชั่นเล่นกิจกรรม</li>
                </ul>
            </div>

            <!-- กฎ AirDrop -->
            <div class="glass-card">
                <h3 style="color: var(--accent-cyan); margin-bottom: 12px;"><i class="fa-solid fa-box-open"></i> กฎการเล่น AirDrop (รอบเวลา: 13:00, 18:00, 21:00 น.)</h3>
                <ul class="rule-list">
                    <li><i class="fa-solid fa-check"></i> ห้ามมีสตอรี่กันโดยเด็ดขาดในเวลากิจกรรม [ บังคับ ]</li>
                    <li><i class="fa-solid fa-check"></i> ห้าม Toxic หรือ บัพกันแรงเกินไป</li>
                    <li><i class="fa-solid fa-check"></i> สามารถใช้ AED และ Bandage ในการ Heal ตัวเองได้</li>
                    <li><i class="fa-solid fa-check"></i> ไม่สามารถใช้อีโมได้ เนื่องจากเป็นการเอาเปรียบ MB / มือถือ [ บังคับ ]</li>
                    <li><i class="fa-solid fa-check"></i> ห้ามใช้ MOD / โปรแกรมโกง / สิ่งที่ทำให้ได้เปรียบฝั่งตรงข้าม [ โทษใบแดง / บังคับ ]</li>
                    <li><i class="fa-solid fa-check"></i> สามารถใช้เกราะได้ปกติ</li>
                    <li><i class="fa-solid fa-triangle-exclamation" style="color: var(--yellow-warning);"></i> <b style="color: var(--yellow-warning);">ห้ามตีก่อน 5 นาทีเด็ดขาด!</b></li>
                </ul>
            </div>
        </section>

        <!-- 10. ติดต่อ -->
        <section id="contact" class="page-content">
            <div class="page-header"><h1 class="page-title">ข้อมูลติดต่อ</h1></div>
            <div class="glass-card" style="text-align: center;">
                <a href="https://discord.gg/beRkvWM5P" target="_blank" class="btn-bkm"><i class="fa-brands fa-discord"></i> Discord BLACK KINGDOM</a>
            </div>
        </section>
    </main>

    <footer class="footer">
        <div class="container">&copy; 2026 BLACK KINGDOM (BKM) All Rights Reserved.</div>
    </footer>

    <script>
        // ระบบเสียงเอฟเฟกต์ (Sound Effects) เมื่อกดปุ่ม
        const clickSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        clickSound.volume = 0.3;

        document.querySelectorAll('button, .logo, a').forEach(el => {
            el.addEventListener('click', () => {
                clickSound.currentTime = 0;
                clickSound.play().catch(e => {});
            });
        });

        let myIcName = localStorage.getItem('bkm_user_ic') || '';
        let myVisitorId = myIcName || ('Visitor_' + Math.floor(Math.random() * 10000));

        window.addEventListener('DOMContentLoaded', () => { loadProfileData(); });

        setInterval(() => {
            fetch('/api/heartbeat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visitorId: myVisitorId })
            }).catch(e => {});
        }, 8000);

        function switchTab(tabId) {
            document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            
            const target = document.getElementById(tabId);
            if(target) target.classList.add('active');
            
            if(event && event.currentTarget) { event.currentTarget.classList.add('active'); }

            document.getElementById('navLinks').classList.remove('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });

            if(tabId === 'applicationsList') loadApplications();
            if(tabId === 'memberList') { loadMembers(); loadWebOnlineUsers(); }
            if(tabId === 'profile') loadProfileData();
        }

        document.getElementById('menuToggle').addEventListener('click', () => {
            document.getElementById('navLinks').classList.toggle('active');
        });

        document.getElementById('applyForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึกข้อมูล...';

            const icNameVal = document.getElementById('icName').value.trim();
            myIcName = icNameVal;
            myVisitorId = icNameVal;
            localStorage.setItem('bkm_user_ic', icNameVal);

            const data = {
                icName: icNameVal,
                icAge: document.getElementById('icAge').value,
                icGender: document.getElementById('icGender').value,
                level: document.getElementById('level').value,
                ocName: document.getElementById('ocName').value,
                ocAge: document.getElementById('ocAge').value,
                ocGender: document.getElementById('ocGender').value,
                onlineHours: document.getElementById('onlineHours').value,
                playStyle: document.getElementById('playStyle').value,
                reason: document.getElementById('reason').value,
                discordTag: document.getElementById('discordTag').value,
                testerTag: document.getElementById('testerTag').value
            };

            localStorage.setItem('bkm_my_application', JSON.stringify(data));

            try {
                const res = await fetch('/api/apply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await res.json();
                if(res.ok && result.success) {
                    alert('บันทึกใบสมัครเข้าสู่ระบบเว็บไซต์เรียบร้อยแล้ว!');
                    this.reset();
                    loadProfileData();
                } else {
                    alert(result.message || 'เกิดข้อผิดพลาดในการส่งใบสมัคร');
                }
            } catch(err) {
                alert('ส่งข้อมูลสำเร็จและบันทึกข้อมูลแล้ว!');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> ส่งใบสมัครเข้าแก๊ง';
            }
        });

        async function searchMyApplication() {
            const queryName = document.getElementById('searchIcName').value.trim();
            const resultBox = document.getElementById('myAppResult');
            if(!queryName) { alert('กรุณากรอกชื่อ IC ก่อนค้นหา'); return; }

            resultBox.innerHTML = '<p style="text-align: center; color: var(--text-sub);">กำลังค้นหา...</p>';
            try {
                const res = await fetch(`/api/search-application?icName=${encodeURIComponent(queryName)}`);
                const data = await res.json();
                if(data.success) {
                    const item = data.application;
                    resultBox.innerHTML = `
                        <div style="background: rgba(6, 9, 17, 0.85); padding: 18px; border-radius: 12px; border: 1px solid var(--accent-cyan);">
                            <h4 style="color: var(--accent-cyan); margin-bottom: 8px;"><i class="fa-solid fa-circle-check"></i> พบใบสมัครแล้ว!</h4>
                            <p><b>ชื่อ IC:</b> ${item.icName} (อายุ ${item.icAge} ปี)</p>
                            <p><b>เลเวล:</b> ${item.level} | <b>สายการเล่น:</b> ${item.playStyle}</p>
                            <p><b>ชื่อ OC:</b> ${item.ocName} | <b>Discord:</b> ${item.discordTag}</p>
                            <p style="margin-top: 6px; color: #cbd5e1;"><b>เหตุผล:</b> ${item.reason}</p>
                        </div>
                    `;
                } else {
                    const localData = JSON.parse(localStorage.getItem('bkm_my_application') || '{}');
                    if(localData.icName && localData.icName.toLowerCase() === queryName.toLowerCase()) {
                        resultBox.innerHTML = `
                            <div style="background: rgba(6, 9, 17, 0.85); padding: 18px; border-radius: 12px; border: 1px solid var(--accent-cyan);">
                                <h4 style="color: var(--accent-cyan); margin-bottom: 8px;"><i class="fa-solid fa-circle-check"></i> พบใบสมัคร (ข้อมูลเครื่องนี้)</h4>
                                <p><b>ชื่อ IC:</b> ${localData.icName}</p>
                                <p><b>เลเวล:</b> ${localData.level} | <b>สายการเล่น:</b> ${localData.playStyle}</p>
                            </div>
                        `;
                    } else {
                        resultBox.innerHTML = `<p style="text-align: center; color: #fca5a5;">ไม่พบใบสมัครสำหรับชื่อ IC: "${queryName}"</p>`;
                    }
                }
            } catch(e) {
                resultBox.innerHTML = `<p style="text-align: center; color: #fca5a5;">เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์</p>`;
            }
        }

        function uploadAvatar(event) {
            const file = event.target.files[0];
            if(file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const base64Image = e.target.result;
                    document.getElementById('profileAvatar').src = base64Image;
                    localStorage.setItem('bkm_user_avatar', base64Image);
                };
                reader.readAsDataURL(file);
            }
        }

        function loadProfileData() {
            const savedAvatar = localStorage.getItem('bkm_user_avatar');
            if(savedAvatar) { document.getElementById('profileAvatar').src = savedAvatar; }

            const localApp = JSON.parse(localStorage.getItem('bkm_my_application') || '{}');
            if(localApp.icName) {
                document.getElementById('profileIcName').innerText = localApp.icName;
                document.getElementById('profileDiscord').innerText = 'Discord: ' + localApp.discordTag;
                document.getElementById('profilePlayStyle').innerText = localApp.playStyle;
                document.getElementById('profileLevel').innerText = localApp.level;
            } else if(myIcName) {
                document.getElementById('profileIcName').innerText = myIcName;
            }
        }

        async function loadApplications() {
            try {
                const res = await fetch('/api/applications');
                const list = await res.json();
                const container = document.getElementById('appListContainer');
                if(list.length === 0) { container.innerHTML = '<p style="text-align: center;">ยังไม่มีใบสมัคร</p>'; return; }
                container.innerHTML = list.map((item, index) => `
                    <div style="background: rgba(6, 9, 17, 0.6); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
                        <h4 style="color: var(--accent-cyan);">#${index+1} ชื่อ IC: ${item.icName} (เลเวล ${item.level})</h4>
                        <p style="font-size: 0.88rem;">สาย: ${item.playStyle} | Discord: ${item.discordTag}</p>
                    </div>
                `).join('');
            } catch(e) {}
        }

        async function loadMembers() {
            try {
                const res = await fetch('/api/members');
                const data = await res.json();
                document.getElementById('storyMembersList').innerHTML = data.story.map(m => `<li class="member-item">${m}</li>`).join('') || '<li class="member-item">ไม่มีสมาชิก</li>';
                document.getElementById('farmMembersList').innerHTML = data.farm.map(m => `<li class="member-item">${m}</li>`).join('') || '<li class="member-item">ไม่มีสมาชิก</li>';
            } catch(e) {}
        }

        async function loadWebOnlineUsers() {
            try {
                const res = await fetch('/api/web-online');
                const users = await res.json();
                const container = document.getElementById('webOnlineList');
                if(users.length === 0) { container.innerHTML = '<li class="member-item">ไม่มีผู้ใช้งานออนไลน์ขณะนี้</li>'; return; }
                container.innerHTML = users.map(u => `<li class="member-item"><span><span class="online-dot"></span>${u}</span><span style="color: #4ade80;">Online</span></li>`).join('');
            } catch(e) {}
        }

        async function submitLeaveGang() {
            const icName = document.getElementById('leaveIcName').value.trim();
            const reason = document.getElementById('leaveReason').value.trim();
            if(!icName || !reason) { alert('กรุณากรอกข้อมูลให้ครบ'); return; }

            try {
                const res = await fetch('/api/leave-gang', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ icName, reason })
                });
                if(res.ok) {
                    alert(`ทำเรื่องออกจากแก๊งของ ${icName} เรียบร้อยแล้ว`);
                    document.getElementById('leaveForm').reset();
                }
            } catch(e) {}
        }
    </script>
</body>
</html>
