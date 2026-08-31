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
        loadOrders(); loadRecharges(); loadUsers(); loadProducts();
    } else {
        alert("يجب تسجيل الدخول كأدمن من صفحة المتجر الرئيسية أولاً.");
        window.location.href = "index.html"; // توجيه للمتجر إن لم يكن مسجلاً
    }
});

function logoutAdmin() {
    firebase.auth().signOut().then(() => { window.location.href = "index.html"; });
}

function openTab(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    btn.classList.add('active');
}

function showImage(src) { 
    document.getElementById('modalImg').src = src; 
    document.getElementById('imageModal').classList.add('active'); 
}

// ----------------- إدارة الطلبات -----------------
async function loadOrders() {
    const tbody = document.getElementById('ordersTableBody');
    const snap = await db.collection("orders").orderBy("date", "desc").get();
    tbody.innerHTML = "";
    if(snap.empty) { tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">لا توجد طلبات.</td></tr>`; return; }

    snap.forEach(doc => {
        let o = doc.data();
        let rcpt = o.receiptImage ? `<img src="${o.receiptImage}" class="receipt-img" onclick="showImage('${o.receiptImage}')">` : '-';
        let statusColor = o.status.includes('Pending') ? 'var(--warning)' : (o.status.includes('Paid') || o.status === 'Completed' ? 'var(--success)' : 'var(--text-gray)');
        
        // تفاصيل الزبون المتقدمة
        let clientInfo = `<b>${o.userEmail}</b><br><span style="color:gray;font-size:0.85rem;">واتس: ${o.phone}</span>`;
        if(o.guestName) clientInfo += `<br><span style="color:var(--primary-blue);font-size:0.85rem;">الاسم: ${o.guestName}</span>`;

        tbody.innerHTML += `
            <tr>
                <td><b>${o.orderId}</b></td>
                <td>${clientInfo}</td>
                <td>${o.product}<br><small>(${o.duration} / كمية: ${o.qty})</small></td>
                <td><b>${o.price} DZD</b></td>
                <td>${o.paymentMethod}</td>
                <td>${rcpt}</td>
                <td><span style="color:${statusColor}; font-weight:bold;">${o.status}</span></td>
                <td>
                    <button class="btn btn-success" style="padding: 5px 10px; margin-bottom: 5px;" onclick="updateOrderStatus('${doc.id}', 'Completed')">تفعيل</button>
                    <button class="btn btn-danger" style="padding: 5px 10px;" onclick="updateOrderStatus('${doc.id}', 'Cancelled')">إلغاء</button>
                </td>
            </tr>`;
    });
}
async function updateOrderStatus(docId, status) { 
    if(confirm(`تغيير حالة الطلب إلى ${status}؟`)) {
        await db.collection("orders").doc(docId).update({ status: status }); 
        loadOrders(); 
    }
}

// ----------------- إدارة طلبات الشحن -----------------
async function loadRecharges() {
    const tbody = document.getElementById('rechargesTableBody');
    const snap = await db.collection("recharges").orderBy("date", "desc").get();
    tbody.innerHTML = "";
    if(snap.empty) { tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">لا توجد طلبات شحن.</td></tr>`; return; }

    snap.forEach(doc => {
        let r = doc.data();
        let rcpt = r.receiptImage ? `<img src="${r.receiptImage}" class="receipt-img" onclick="showImage('${r.receiptImage}')">` : '-';
        let actionBtn = r.status === 'Pending' 
            ? `<button class="btn btn-success" onclick="approveRecharge('${doc.id}', '${r.uid}', ${r.amount})"><i class="fas fa-check"></i> قبول الشحن</button>` 
            : `<span style="color:var(--success); font-weight:bold;">مكتمل</span>`;

        tbody.innerHTML += `
            <tr>
                <td>${r.date ? new Date(r.date.toDate()).toLocaleString('ar-DZ') : '-'}</td>
                <td>${r.userEmail}</td>
                <td style="color:var(--primary-blue); font-weight:bold; font-size:1.1rem;">${r.amount} DZD</td>
                <td>${r.method}</td>
                <td>${rcpt}</td>
                <td>${r.status}</td>
                <td>${actionBtn}</td>
            </tr>`;
    });
}
async function approveRecharge(docId, uid, amount) {
    if(!confirm(`هل أنت متأكد من إضافة ${amount} DZD لمحفظة هذا المستخدم؟`)) return;
    await db.collection("users").doc(uid).update({ balance: firebase.firestore.FieldValue.increment(amount) });
    await db.collection("recharges").doc(docId).update({ status: 'Approved' });
    alert("تم شحن المحفظة بنجاح!"); 
    loadRecharges(); loadUsers();
}

// ----------------- إدارة العملاء والمحافظ (الجديد) -----------------
async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    const snap = await db.collection("users").get();
    tbody.innerHTML = "";
    snap.forEach(doc => {
        let u = doc.data();
        tbody.innerHTML += `
            <tr>
                <td style="font-size:0.8rem; color:gray;">${doc.id}</td>
                <td><b>${u.name}</b></td>
                <td>${u.email}</td>
                <td style="font-size:1.1rem; font-weight:bold; color:var(--primary-blue);">${u.balance || 0} DZD</td>
                <td>
                    <button class="btn btn-warning" onclick="editUserBalance('${doc.id}', '${u.name}', ${u.balance || 0})"><i class="fas fa-edit"></i> تعديل</button>
                </td>
            </tr>`;
    });
}
async function editUserBalance(uid, name, currentBalance) {
    let newBal = prompt(`تعديل رصيد العميل: ${name}\nالرصيد الحالي: ${currentBalance} DZD\n\nأدخل الرصيد الجديد (اكتب الرقم النهائي):`, currentBalance);
    if(newBal !== null && newBal !== "" && !isNaN(newBal)) {
        await db.collection("users").doc(uid).update({ balance: parseFloat(newBal) });
        alert("تم تحديث الرصيد بنجاح!");
        loadUsers();
    }
}

// ----------------- إدارة المنتجات (الضخ والإضافة اليدوية) -----------------
async function loadProducts() {
    const tbody = document.getElementById('productsTableBody');
    const snap = await db.collection("products").get();
    tbody.innerHTML = "";
    snap.forEach(doc => {
        let p = doc.data();
        let optionsHtml = (p.options || []).map(opt => `${opt.duration}: <b>${opt.price}</b>`).join(' | ');
        tbody.innerHTML += `
            <tr>
                <td><b>${p.name}</b></td>
                <td><img src="${p.image}" style="width:40px; border-radius:5px;"></td>
                <td style="font-size:0.85rem;">${optionsHtml}</td>
                <td><button class="btn btn-danger" onclick="deleteProd('${doc.id}')"><i class="fas fa-trash-alt"></i> حذف</button></td>
            </tr>`;
    });
}

// الإضافة اليدوية المتقدمة
async function addManualProduct() {
    const id = document.getElementById('prodId').value.trim();
    const name = document.getElementById('prodName').value.trim();
    const image = document.getElementById('prodImage').value.trim();
    const featuresRaw = document.getElementById('prodFeatures').value.trim();
    const optionsRaw = document.getElementById('prodOptions').value.trim();

    if(!id || !name || !optionsRaw) return alert("معرف المنتج، الاسم، وخيارات السعر حقول إجبارية.");

    let featuresArray = featuresRaw ? featuresRaw.split('\n').filter(f => f.trim() !== '') : [];
    
    let optionsArray = [];
    let lines = optionsRaw.split('\n');
    for(let line of lines) {
        if(line.includes(':')) {
            let parts = line.split(':');
            optionsArray.push({ duration: parts[0].trim(), price: parseInt(parts[1].trim()) });
        }
    }

    try {
        await db.collection("products").doc(id).set({
            name: name, image: image, features: featuresArray, options: optionsArray
        });
        alert("تم إضافة المنتج يدوياً بنجاح!");
        document.getElementById('prodId').value = ""; document.getElementById('prodName').value = ""; 
        document.getElementById('prodImage').value = ""; document.getElementById('prodFeatures').value = ""; document.getElementById('prodOptions').value = "";
        loadProducts();
    } catch(e) { alert("حدث خطأ في الإضافة."); }
}

async function deleteProd(id) { 
    if(confirm("هل أنت متأكد من حذف هذا المنتج نهائياً؟")) { 
        await db.collection("products").doc(id).delete(); 
        loadProducts(); 
    } 
}

// قائمة المنتجات الافتراضية للضخ السحري
const defaultProductsList = [
    { id: 'claude-pro', name: 'Claude Pro', image: 'https://logo.clearbit.com/anthropic.com', options: [{ duration: '1 شهر', price: 6580 }], features: ['وصول غير محدود لـ Claude 3.5', 'أولوية في أوقات الذروة', 'ضمان طيلة مدة الاشتراك'] },
    { id: 'youtube-premium', name: 'YouTube Premium', image: 'https://logo.clearbit.com/youtube.com', options: [{ duration: '1 شهر', price: 900 }, { duration: '3 شهور', price: 2500 }, { duration: '6 شهور', price: 4000 }], features: ['مشاهدة بدون إعلانات', 'تشغيل في الخلفية', 'يوتيوب ميوزك متضمن'] },
    { id: 'canva-pro', name: 'Canva Pro', image: 'https://logo.clearbit.com/canva.com', options: [{ duration: '12 شهر', price: 500 }, { duration: 'عامين', price: 800 }, { duration: '3 سنين', price: 1200 }], features: ['وصول لجميع القوالب المدفوعة', 'مساحة تخزين سحابية', 'تفعيل على حسابك الشخصي'] },
    { id: 'capcut-pro', name: 'CapCut Pro', image: 'https://logo.clearbit.com/capcut.com', options: [{ duration: '1 شهر', price: 1000 }, { duration: '6 شهور', price: 3800 }], features: ['انتقالات وتأثيرات Pro', 'تصدير بجودة عالية بدون علامة مائية'] },
    { id: 'spotify-premium', name: 'Spotify Premium', image: 'https://logo.clearbit.com/spotify.com', options: [{ duration: '1 شهر', price: 900 }, { duration: '3 شهور', price: 2100 }, { duration: '6 شهور', price: 3800 }, { duration: '12 شهر', price: 5500 }], features: ['استماع بدون إعلانات', 'جودة صوت عالية جداً', 'تحميل الأغاني للاستماع بدون أنترنت'] },
    { id: 'chatgpt-plus', name: 'ChatGPT Plus', image: 'https://logo.clearbit.com/openai.com', options: [{ duration: '1 شهر', price: 1500 }], features: ['وصول لـ GPT-4o', 'استجابة أسرع', 'توليد الصور (DALL-E 3)'] },
    { id: 'chatgpt-business', name: 'ChatGPT Business', image: 'https://logo.clearbit.com/openai.com', options: [{ duration: '1 شهر', price: 900 }], features: ['ميزات مخصصة للأعمال', 'أمان وخصوصية عالية للبيانات'] },
    { id: 'nord-vpn', name: 'Nord VPN', image: 'https://logo.clearbit.com/nordvpn.com', options: [{ duration: '3 شهور', price: 2400 }], features: ['تصفح آمن ومخفي تماماً', 'سرعة خوادم عالية', 'فتح المحتوى المحظور'] },
    { id: 'netflix', name: 'Netflix 4K', image: 'https://logo.clearbit.com/netflix.com', options: [{ duration: '1 شهر', price: 1000 }, { duration: '3 شهور', price: 2600 }], features: ['مشاهدة بدقة 4K Ultra HD', 'شاشة خاصة بك (Profile)', 'ضمان طيلة فترة الاشتراك'] },
    { id: 'prime-video', name: 'Prime Video', image: 'https://logo.clearbit.com/primevideo.com', options: [{ duration: '6 شهور', price: 2500 }], features: ['محتوى أمازون الحصري', 'دقة عالية 4K', 'ترجمة عربية متوفرة'] },
    { id: 'gemini-pro', name: 'Gemini Pro', image: 'https://logo.clearbit.com/google.com', options: [{ duration: '12 شهر', price: 1000 }, { duration: '18 شهر', price: 1500 }], features: ['وصول لأقوى نموذج من جوجل', 'تحليل البيانات والملفات الكبيرة'] },
    { id: 'snap-plus', name: 'Snap+', image: 'https://logo.clearbit.com/snapchat.com', options: [{ duration: '1 شهر', price: 900 }, { duration: '12 شهر', price: 3400 }], features: ['ميزات حصرية قبل الجميع', 'تغيير أيقونة التطبيق', 'معرفة من أعاد مشاهدة القصة'] },
    { id: 'telegram-premium', name: 'Telegram Premium', image: 'https://logo.clearbit.com/telegram.org', options: [{ duration: '3 شهور', price: 4500 }], features: ['سرعة تحميل مضاعفة', 'رفع ملفات حتى 4GB', 'بدون إعلانات'] }
];

async function injectAllProducts() {
    if(!confirm("هل أنت متأكد من ضخ جميع المنتجات الافتراضية لـ Firebase؟")) return;
    for(let p of defaultProductsList) {
        await db.collection("products").doc(p.id).set({ name: p.name, image: p.image, options: p.options, features: p.features });
    }
    alert("✅ تم رفع جميع المنتجات بنجاح!");
    loadProducts();
}
