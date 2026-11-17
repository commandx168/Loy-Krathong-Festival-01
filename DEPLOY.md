# ดูแลเว็บ Cloudflare

- เว็บจริง: https://bkeetc-loykrathong.pages.dev/
- Pages project: `bkeetc-loykrathong` (production branch `main`)
- D1: `bkeetc-loykrathong`, binding `DB`, region APAC
- รหัสสุ่มรางวัลผู้บริหาร: เก็บใน `.secrets/draw_admin_code.txt` บนเครื่องนี้ และตั้งเป็น Pages secret `DRAW_ADMIN_TOKEN` แล้ว ห้ามนำไฟล์รหัสขึ้น GitHub
- ผู้มีสิทธิ์สุ่ม: ผู้ที่ลอยกระทงแบบสาธารณะพร้อมแสดงชื่อ หนึ่งผู้ใช้เป็นหนึ่งรายชื่อ ผู้ชนะแล้วจะไม่ถูกสุ่มซ้ำ
- การ deploy: Direct Upload จาก `dist/`; ไม่ได้เชื่อม GitHub

ไฟล์แก้ไขอยู่ในโฟลเดอร์หลัก `index.html`, `css/`, `js/`, `assets/`, `ref/`, `functions/` และ `schema.sql` ส่วน `dist/` เป็นผลลัพธ์สำหรับอัปโหลด ไม่ควรแก้ตรงนั้น

## Deploy อีกครั้ง

ใช้ PowerShell ในโฟลเดอร์ `bkeetc` หลังล็อกอินด้วย `npx wrangler login`:

```powershell
New-Item -ItemType Directory -Path dist -Force | Out-Null
Copy-Item index.html dist/index.html -Force
Copy-Item css,js,assets,ref,bgmusics dist -Recurse -Force
npx wrangler pages deploy dist --project-name bkeetc-loykrathong --branch main
```

หากแก้ schema หลัง deploy ให้ใช้ SQL migration เฉพาะส่วนที่เพิ่ม ไม่รันคำสั่งลบตารางบนฐานจริง ตัวอย่างตรวจรายการกิจกรรม:

```powershell
npx wrangler d1 execute bkeetc-loykrathong --remote --command "SELECT id,title,status FROM events"
```

`schema.sql` ใช้สร้างฐานใหม่หรือทดสอบในเครื่อง เนื้อหาภาพกระทงถูกเก็บใน D1 โดยจำกัด 250 KB ต่อภาพ และฐานฟรีมีเพดาน 500 MB ต่อฐาน ติดตามขนาดและสำรองข้อมูลใน Cloudflare Dashboard
