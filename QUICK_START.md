# 🚀 START HERE: SOC Dashboard Quick Start

## ⚡ 30-Second Quick Start

```bash
# Terminal 1: Start Server
cd server
npm install
npm start

# Terminal 2: Start Client  
cd client
npm install
npm start
```

That's it! Dashboard opens automatically at `http://localhost:3000` ✅

---

## What You'll See

✅ **Real-time attack feed** updating live  
✅ **World threat map** with pins dropping from different countries  
✅ **Threat gauge** showing current threat level (0-100)  
✅ **Attacker profiles** with threat scores  
✅ **Honeytoken panel** showing deception assets  

---

## 🎯 Interactive Features (Click These!)

| Button | Does What |
|--------|-----------|
| **⬇ PDF** | Download professional incident report |
| **⊘ Block** | Block attacker IP via firewall |
| **▶ Replay** | See forensic timeline of their attacks |

---

## 📊 Database

**No configuration needed!** 

- Uses mock data by default ✅
- If you have PostgreSQL: Edit `server/.env` and add your DATABASE_URL
- Supports Neon.tech, AWS RDS, or local PostgreSQL

---

## 🆘 Troubleshooting

**"Port 5000 in use?"**
```bash
lsof -i :5000 | grep node | awk '{print $2}' | xargs kill -9
```

**"npm install failing?"**
```bash
rm -rf node_modules package-lock.json
npm install
```

**"React won't connect to server?"**
- Check server is running: http://localhost:5000/api/events
- Check client .env has: REACT_APP_API_URL=http://localhost:5000

---

## 📚 For More Info

- See **SETUP_GUIDE.md** for detailed setup
- See **IMPLEMENTATION_REPORT.md** for what was built
- See **README_IMPLEMENTATION_COMPLETE.md** for feature overview

---

## 🎓 What to Show an Examiner

1. **Live Feed**: New attacks appear in real-time
2. **Threat Map**: Geographic visualization of attackers
3. **PDF Report**: Click button, see professional incident report
4. **Block IP**: Shows system is integrated with firewall
5. **Session Replay**: Forensic timeline of attacker's actions
6. **Architecture**: Full stack: React + Express + PostgreSQL

---

## ✅ Status

**FULLY OPERATIONAL** - All features working, ready to demonstrate.

**Questions?** Read SETUP_GUIDE.md or IMPLEMENTATION_REPORT.md

---

**Now run `npm start` in both directories and enjoy! 🎉**
