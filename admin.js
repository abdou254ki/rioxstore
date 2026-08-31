const firebaseConfig = {
    apiKey: "AIzaSyDyMO2egBBg4-_AFcp3H0QaRZu6cROEwxI",
    authDomain: "riox-store-de.firebaseapp.com",
    projectId: "riox-store-de",
    storageBucket: "riox-store-de.firebasestorage.app",
    messagingSenderId: "47146599539",
    appId: "1:47146599539:web:7aa18d24330c9a0e16d606"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const ADMIN_EMAIL = "support@rioxads.store";

firebase.auth().onAuthStateChanged((user) => {
    if (user && user.email === ADMIN_EMAIL) {
        document.getElementById('appContent').style.display = 'block';
        document.getElementById('adminEmail').textContent = user.email;
        loadOrders(); loadRecharges(); loadUsers(); loadProducts(); loadPromoCodes();
    } else {
        alert("يجب الدخول بحساب الأدمن.");
        window.location.href = "index.html";
    }
});

function logoutAdmin() { firebase.auth().signOut().then(() => { window.location.href = "index.html"; }); }

function openTab(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    btn.classList.add('active');
}

function showImage(src) { document.getElementById('modalImg').src = src; document.getElementById('imageModal').classList.add('active'); }

// ------ الطلبات ------
async function loadOrders() {
    const tbody = document.getElementById('ordersTableBody');
    const snap = await db.collection("orders").orderBy("date", "desc").get();
    tbody.innerHTML = "";
    snap.forEach(doc => {
        let o = doc.data();
        let rcpt = o.receiptImage ? `<img src="${o.receiptImage}" class="receipt-img" onclick="showImage('${o.receiptImage}')">` : '<span style="color:red">لايوجد</span>';
        let statusColor = o.status.includes('Pending') ? 'var(--warning)' : (o.status.includes('Paid') || o.status === 'Completed' ? 'var(--success)' : 'var(--text-gray)');
        
        let clientName = o.guestName || "لم يكتب";
        let clientInfo = `👤 <b>${clientName}</b><br>✉️ ${o.userEmail}<br>📱 <a href="https://wa.me/${o.phone}" target="_blank">${o.phone}</a>`;

        tbody.innerHTML += `
            <tr>
                <td><b>${o.orderId}</b></td>
                <td style="text-align:right;">${clientInfo}</td>
                <td><b>${o.product}</b><br><small>${o.duration} (الكمية: ${o.qty})</small></td>
                <td><b>${o.price} DZD</b><br><small>${o.paymentMethod}</small></td>
                <td>${rcpt}</td>
                <td><span style="background:#F1F5F9; padding:5px 10px; border-radius:5px; color:${statusColor}; font-weight:bold;">${o.status}</span></td>
                <td>
                    <button class="btn btn-success" style="padding: 6px; margin:2px;" onclick="updateOrderStatus('${doc.id}', 'Completed')"><i class="fas fa-check"></i></button>
                    <button class="btn btn-danger" style="padding: 6px; margin:2px;" onclick="updateOrderStatus('${doc.id}', 'Cancelled')"><i class="fas fa-times"></i></button>
                </td>
            </tr>`;
    });
}
async function updateOrderStatus(docId, status) { await db.collection("orders").doc(docId).update({ status: status }); loadOrders(); }

// ------ الشحن ------
async function loadRecharges() {
    const tbody = document.getElementById('rechargesTableBody');
    const snap = await db.collection("recharges").orderBy("date", "desc").get();
    tbody.innerHTML = "";
    snap.forEach(doc => {
        let r = doc.data();
        let rcpt = r.receiptImage ? `<img src="${r.receiptImage}" class="receipt-img" onclick="showImage('${r.receiptImage}')">` : '-';
        let actionBtn = r.status === 'Pending' 
            ? `<button class="btn btn-primary" onclick="approveRecharge('${doc.id}', '${r.uid}', ${r.amount})"><i class="fas fa-plus"></i> شحن الرصيد</button>` 
            : `<span style="color:var(--success); font-weight:bold;"><i class="fas fa-check-circle"></i> تم الشحن</span>`;

        tbody.innerHTML += `<tr><td>${r.date ? new Date(r.date.toDate()).toLocaleDateString('ar-DZ') : '-'}</td><td>${r.userEmail}</td><td style="color:var(--success); font-weight:bold; font-size:1.1rem;">${r.amount} DZD</td><td>${r.method}</td><td>${rcpt}</td><td>${actionBtn}</td></tr>`;
    });
}
async function approveRecharge(docId, uid, amount) {
    if(!confirm(`إضافة ${amount} DZD؟`)) return;
    await db.collection("users").doc(uid).update({ balance: firebase.firestore.FieldValue.increment(amount) });
    await db.collection("recharges").doc(docId).update({ status: 'Approved' });
    loadRecharges(); loadUsers();
}

// ------ الزبائن والمحافظ ------
async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    const snap = await db.collection("users").get();
    tbody.innerHTML = "";
    snap.forEach(doc => {
        let u = doc.data();
        tbody.innerHTML += `<tr><td style="font-size:0.8rem;">${doc.id}</td><td><b>${u.name}</b></td><td>${u.email}</td><td style="font-size:1.2rem; font-weight:bold; color:var(--primary-blue);">${u.balance || 0} DZD</td><td><button class="btn btn-warning" onclick="editUserBalance('${doc.id}', '${u.name}', ${u.balance || 0})"><i class="fas fa-edit"></i> تعديل</button></td></tr>`;
    });
}
async function editUserBalance(uid, name, currentBalance) {
    let newBal = prompt(`تعديل رصيد: ${name}\nالرصيد الحالي: ${currentBalance}\n\nاكتب الرصيد الجديد:`, currentBalance);
    if(newBal !== null && !isNaN(newBal)) {
        await db.collection("users").doc(uid).update({ balance: parseFloat(newBal) });
        loadUsers();
    }
}

// ------ المنتجات والـ GitHub ------
const defaultProductsList = [
    { id: 'claude-pro', name: 'Claude Pro', image: 'https://raw.githubusercontent.com/abdou254ki/abdou254ki/main/claude_pro.png', options: [{ duration: '1 شهر', price: 6580 }], features: ['وصول غير محدود لـ Claude 3.5', 'أولوية في أوقات الذروة', 'ضمان طيلة مدة الاشتراك'] },
    { id: 'youtube-premium', name: 'YouTube Premium', image: 'https://raw.githubusercontent.com/abdou254ki/abdou254ki/main/youtube_premium.png', options: [{ duration: '1 شهر', price: 900 }, { duration: '3 شهور', price: 2500 }, { duration: '6 شهور', price: 4000 }], features: ['مشاهدة بدون إعلانات', 'تشغيل في الخلفية', 'يوتيوب ميوزك متضمن'] },
    { id: 'canva-pro', name: 'Canva Pro', image: 'https://raw.githubusercontent.com/abdou254ki/abdou254ki/main/canva_pro.png', options: [{ duration: '12 شهر', price: 500 }, { duration: 'عامين', price: 800 }, { duration: '3 سنين', price: 1200 }], features: ['وصول لجميع القوالب المدفوعة', 'مساحة تخزين سحابية', 'تفعيل على حسابك الشخصي'] },
    { id: 'capcut-pro', name: 'CapCut Pro', image: 'https://raw.githubusercontent.com/abdou254ki/abdou254ki/main/capcut_pro.png', options: [{ duration: '1 شهر', price: 1000 }, { duration: '6 شهور', price: 3800 }], features: ['انتقالات وتأثيرات Pro', 'تصدير بجودة عالية بدون علامة مائية'] },
    { id: 'spotify-premium', name: 'Spotify Premium', image: 'https://raw.githubusercontent.com/abdou254ki/abdou254ki/main/spotify_premium.png', options: [{ duration: '1 شهر', price: 900 }, { duration: '3 شهور', price: 2100 }, { duration: '6 شهور', price: 3800 }, { duration: '12 شهر', price: 5500 }], features: ['استماع بدون إعلانات', 'جودة صوت عالية جداً', 'تحميل الأغاني للاستماع بدون أنترنت'] },
    { id: 'chatgpt-plus', name: 'ChatGPT Plus', image: 'https://raw.githubusercontent.com/abdou254ki/abdou254ki/main/chatgpt_plus.png', options: [{ duration: '1 شهر', price: 1500 }], features: ['وصول لـ GPT-4o', 'استجابة أسرع', 'توليد الصور (DALL-E 3)'] },
    { id: 'chatgpt-business', name: 'ChatGPT Business', image: 'https://raw.githubusercontent.com/abdou254ki/abdou254ki/main/chatgpt_plus.png', options: [{ duration: '1 شهر', price: 900 }], features: ['ميزات مخصصة للأعمال', 'أمان وخصوصية عالية للبيانات'] },
    { id: 'nord-vpn', name: 'Nord VPN', image: 'https://raw.githubusercontent.com/abdou254ki/abdou254ki/main/nord_vpn.png', options: [{ duration: '3 شهور', price: 2400 }], features: ['تصفح آمن ومخفي تماماً', 'سرعة خوادم عالية', 'فتح المحتوى المحظور'] },
    { id: 'netflix', name: 'Netflix 4K', image: 'https://raw.githubusercontent.com/abdou254ki/abdou254ki/main/netflix_4k.png', options: [{ duration: '1 شهر', price: 1000 }, { duration: '3 شهور', price: 2600 }], features: ['مشاهدة بدقة 4K Ultra HD', 'شاشة خاصة بك (Profile)', 'ضمان طيلة فترة الاشتراك'] },
    { id: 'prime-video', name: 'Prime Video', image: 'https://raw.githubusercontent.com/abdou254ki/abdou254ki/main/prime_video.png', options: [{ duration: '6 شهور', price: 2500 }], features: ['محتوى أمازون الحصري', 'دقة عالية 4K', 'ترجمة عربية متوفرة'] },
    { id: 'gemini-pro', name: 'Gemini Pro', image: 'https://raw.githubusercontent.com/abdou254ki/abdou254ki/main/gemini_pro.png', options: [{ duration: '12 شهر', price: 1000 }, { duration: '18 شهر', price: 1500 }], features: ['وصول لأقوى نموذج من جوجل', 'تحليل البيانات والملفات الكبيرة'] },
    { id: 'snap-plus', name: 'Snap+', image: 'https://raw.githubusercontent.com/abdou254ki/abdou254ki/main/snap_plus.png', options: [{ duration: '1 شهر', price: 900 }, { duration: '12 شهر', price: 3400 }], features: ['ميزات حصرية قبل الجميع', 'تغيير أيقونة التطبيق', 'معرفة من أعاد مشاهدة القصة'] },
    { id: 'telegram-premium', name: 'Telegram Premium', image: 'https://raw.githubusercontent.com/abdou254ki/abdou254ki/main/telegram_premium.png', options: [{ duration: '3 شهور', price: 4500 }], features: ['سرعة تحميل مضاعفة', 'رفع ملفات حتى 4GB', 'بدون إعلانات'] }
];

async function loadProducts() {
    const tbody = document.getElementById('productsTableBody');
    const snap = await db.collection("products").get();
    tbody.innerHTML = "";
    snap.forEach(doc => {
        let p = doc.data();
        let optionsHtml = (p.options || []).map(opt => `${opt.duration}: <b>${opt.price}</b>`).join('<br>');
        tbody.innerHTML += `<tr><td><b>${p.name}</b></td><td><img src="${p.image}" style="width:40px; border-radius:5px;"></td><td style="font-size:0.85rem;">${optionsHtml}</td><td><button class="btn btn-danger" onclick="deleteProd('${doc.id}')"><i class="fas fa-trash-alt"></i></button></td></tr>`;
    });
}
async function injectAllProducts() {
    if(!confirm("سيتم استيراد قائمة المنتجات من النظام مع صورها في GitHub. متابعة؟")) return;
    for(let p of defaultProductsList) { await db.collection("products").doc(p.id).set({ name: p.name, image: p.image, options: p.options, features: p.features }); }
    alert("✅ تم الرفع والتزامن بنجاح!"); loadProducts();
}
async function addManualProduct() {
    const id = document.getElementById('prodId').value.trim(), name = document.getElementById('prodName').value.trim(), image = document.getElementById('prodImage').value.trim(), featuresRaw = document.getElementById('prodFeatures').value.trim(), optionsRaw = document.getElementById('prodOptions').value.trim();
    if(!id || !name || !optionsRaw) return alert("أكمل البيانات الإجبارية.");
    let featuresArray = featuresRaw ? featuresRaw.split('\n').filter(f => f.trim() !== '') : [];
    let optionsArray = optionsRaw.split('\n').filter(l=>l.includes(':')).map(line => { let p=line.split(':'); return { duration: p[0].trim(), price: parseInt(p[1].trim()) }});
    try { await db.collection("products").doc(id).set({ name: name, image: image, features: featuresArray, options: optionsArray }); alert("تم الإضافة!"); loadProducts(); } catch(e) { alert("خطأ."); }
}
async function deleteProd(id) { if(confirm("حذف؟")) { await db.collection("products").doc(id).delete(); loadProducts(); } }

// ------ أكواد الخصم ------
async function loadPromoCodes() {
    const tbody = document.getElementById('promoTableBody');
    const snap = await db.collection("promocodes").get();
    tbody.innerHTML = "";
    snap.forEach(doc => {
        let p = doc.data();
        tbody.innerHTML += `<tr><td><b style="color:var(--primary-blue);">${p.code}</b></td><td>${p.discount} DZD</td><td>مفعل</td><td><button class="btn btn-danger" onclick="deletePromo('${doc.id}')">حذف</button></td></tr>`;
    });
}
async function addPromoCode() {
    let code = document.getElementById('promoCodeStr').value.trim().toUpperCase();
    let val = parseFloat(document.getElementById('promoCodeVal').value);
    if(!code || !val) return alert("أدخل الكود والقيمة.");
    await db.collection("promocodes").doc(code).set({ code: code, discount: val });
    loadPromoCodes();
}
async function deletePromo(id) { await db.collection("promocodes").doc(id).delete(); loadPromoCodes(); }
