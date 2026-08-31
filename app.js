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

// مصفوفة المنتجات (للتحميل إن كانت قاعدة البيانات فارغة)
const localProductsList = [
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

let storeProducts = [], activeProduct = null, currentDuration = "", basePrice = 0, currentQty = 1;
let receiptBase64 = "", rechargeReceiptBase64 = "", globalOrderId = "";
let currentUser = null, userBalance = 0, userProfileData = null;

const CHARGILY_SECRET_KEY = "test_sk_...ضع_المفتاح_هنا"; // تذكر أن هذا للدفع التجريبي فقط أو ضع المفتاح الحقيقي

firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        document.getElementById('userNameDisplay').textContent = "حسابي";
        document.getElementById('navProfile').style.display = "flex";
        document.getElementById('logoutBtn').style.display = "flex";
        closeModal('authModal');
        
        const doc = await db.collection('users').doc(user.uid).get();
        if(doc.exists) {
            userProfileData = doc.data();
            userBalance = userProfileData.balance || 0;
            document.getElementById('profileName').textContent = userProfileData.name;
            document.getElementById('profileEmail').textContent = userProfileData.email;
            document.getElementById('walletBalanceDisplay').textContent = userBalance + " DZD";
        }
    } else {
        currentUser = null; userBalance = 0; userProfileData = null;
        document.getElementById('userNameDisplay').textContent = "دخول";
        document.getElementById('navProfile').style.display = "none";
        document.getElementById('logoutBtn').style.display = "none";
    }
});

function handleProfileClick() { if (currentUser) { switchPage('profile'); } else { document.getElementById('authModal').classList.add('active'); } }
function toggleAuthMode() { document.getElementById('loginForm').classList.toggle('hidden'); document.getElementById('registerForm').classList.toggle('hidden'); }

async function registerUser() {
    const name = document.getElementById('regName').value, email = document.getElementById('regEmail').value, password = document.getElementById('regPassword').value;
    if(!name || !email || !password) return alert("الرجاء إكمال جميع البيانات.");
    try {
        const userCred = await firebase.auth().createUserWithEmailAndPassword(email, password);
        await db.collection("users").doc(userCred.user.uid).set({ name: name, email: email, balance: 0, uid: userCred.user.uid });
        alert("🎉 تم إنشاء الحساب بنجاح!");
    } catch (error) { alert("حدث خطأ أثناء الإنشاء، قد يكون الإيميل مستخدماً أو كلمة المرور ضعيفة."); }
}

async function loginUser() {
    const email = document.getElementById('authEmail').value, password = document.getElementById('authPassword').value;
    if(!email || !password) return alert("أدخل الإيميل وكلمة المرور.");
    try { await firebase.auth().signInWithEmailAndPassword(email, password); } 
    catch (error) { alert("❌ كلمة المرور أو الإيميل غير صحيح"); }
}
function logoutUser() { firebase.auth().signOut().then(() => { switchPage('home'); }); }

async function initStore() {
    const grid = document.getElementById('productsGrid');
    try {
        const snapshot = await db.collection('products').get();
        storeProducts = []; snapshot.forEach(doc => { let data = doc.data(); data.id = doc.id; storeProducts.push(data); });
        
        // إذا كانت القاعدة فارغة، نستخدم المصفوفة المحلية لتجربة المستخدم
        if(storeProducts.length === 0) storeProducts = localProductsList;
        
        grid.innerHTML = '';
        storeProducts.forEach(product => {
            let firstPrice = product.options && product.options.length > 0 ? product.options[0].price : 0;
            grid.innerHTML += `
                <div class="product-card" onclick="openDetails('${product.id}')">
                    <div class="card-img-placeholder"><img src="${product.image || 'https://via.placeholder.com/150'}"></div>
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-price">ابتداءً من <span>${firstPrice} DZD</span></p>
                    <button class="btn-add">اطلب الآن <i class="fas fa-shopping-cart"></i></button>
                </div>`;
        });
    } catch (error) { grid.innerHTML = '<div style="text-align:center; grid-column:1/-1; color:red;">خطأ في الاتصال بقاعدة البيانات.</div>'; }
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('active'); document.getElementById('sidebarOverlay').classList.toggle('active'); }
function switchPage(pageId) {
    document.querySelectorAll('.page-sec').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId + '-sec').classList.add('active');
    document.querySelectorAll('.side-link').forEach(l => l.classList.remove('active'));
    if(event) event.currentTarget.classList.add('active');
    if (window.innerWidth <= 768) toggleSidebar();
    window.scrollTo(0,0);
}
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function openDetails(id) {
    activeProduct = storeProducts.find(p => p.id === id);
    if (!activeProduct) return;
    currentQty = 1; document.getElementById('qtyDisplay').textContent = currentQty;
    document.getElementById('modalTitle').textContent = activeProduct.name;
    document.getElementById('modalImg').src = activeProduct.image || '';

    const fList = document.getElementById('modalFeatures'); fList.innerHTML = "";
    if(activeProduct.features) { activeProduct.features.forEach(f => { let li = document.createElement('li'); li.textContent = f; fList.appendChild(li); }); }

    const dContainer = document.getElementById('modalDurations'); dContainer.innerHTML = "";
    let isFirst = true;
    if(activeProduct.options) {
        activeProduct.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = `duration-btn ${isFirst ? 'active' : ''}`;
            btn.textContent = opt.duration;
            if(isFirst) { currentDuration = opt.duration; basePrice = parseInt(opt.price); updatePrice(); isFirst = false; }
            btn.onclick = function() {
                document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active'); currentDuration = opt.duration; basePrice = parseInt(opt.price); updatePrice();
            };
            dContainer.appendChild(btn);
        });
    }
    document.getElementById('detailsModal').classList.add('active');
}

function changeQty(val) { if(currentQty + val >= 1 && currentQty + val <= 10) { currentQty += val; document.getElementById('qtyDisplay').textContent = currentQty; updatePrice(); } }
function updatePrice() { document.getElementById('modalPrice').textContent = (basePrice * currentQty) + " DZD"; }

function openCheckout() {
    closeModal('detailsModal'); 
    document.getElementById('checkoutModal').classList.add('active');
    document.getElementById('checkoutTotalDisplay').textContent = (basePrice * currentQty) + " DZD";
    
    if (!currentUser) document.getElementById('guestInfoForm').classList.remove('hidden');
    else document.getElementById('guestInfoForm').classList.add('hidden');

    document.getElementById('payMethod').value = "none"; togglePaymentInfo();
    receiptBase64 = ""; document.getElementById('uploadStatus').textContent = "";
}

function togglePaymentInfo() {
    let method = document.getElementById('payMethod').value;
    let manualDiv = document.getElementById('manualPaymentDetails'), walletDiv = document.getElementById('walletSection'), chargilyDiv = document.getElementById('chargilySection'), instruct = document.getElementById('payInstructions');
    
    manualDiv.classList.add('hidden'); walletDiv.classList.add('hidden'); chargilyDiv.classList.add('hidden');

    if(method === "Wallet") {
        if(!currentUser) { alert("🔒 يجب تسجيل الدخول لكي تتمكن من الدفع عبر المحفظة."); document.getElementById('payMethod').value = "none"; return; }
        walletDiv.classList.remove('hidden'); document.getElementById('checkoutWalletBalance').textContent = userBalance;
    }
    else if(method === "Chargily") { chargilyDiv.classList.remove('hidden'); }
    else if(method === "Binance") { manualDiv.classList.remove('hidden'); instruct.innerHTML = "<b>رقم حساب (Binance Pay ID):</b><br> <span style='color:var(--badge-orange); font-size:1.6rem; font-weight:900; user-select:all;'>123456789</span>"; }
    else if(method === "Bybit") { manualDiv.classList.remove('hidden'); instruct.innerHTML = "<b>رقم حساب (Bybit UID):</b><br> <span style='color:var(--badge-orange); font-size:1.6rem; font-weight:900; user-select:all;'>987654321</span>"; }
    else if(method === "BaridiMob") { manualDiv.classList.remove('hidden'); instruct.innerHTML = "<b>رقم الحساب (RIP) لبريدي موب:</b><br> <span style='color:var(--badge-orange); font-size:1.4rem; font-weight:900; user-select:all; letter-spacing:1px;'>00799999002345678910</span>"; }
}

function handleFileUpload(event) {
    let file = event.target.files[0];
    if(file) { let reader = new FileReader(); reader.onloadend = function() { receiptBase64 = reader.result; document.getElementById('uploadStatus').innerHTML = "✅ تم إرفاق الوصل بنجاح، يمكنك الآن الإرسال."; }; reader.readAsDataURL(file); }
}

async function payWithWallet() {
    const phone = document.getElementById('orderPhone').value.trim();
    if(!phone) return alert("الرجاء إدخال رقم الواتساب الخاص بك للتواصل.");
    const totalPrice = basePrice * currentQty;
    
    if(userBalance < totalPrice) return alert("عفواً، رصيد المحفظة غير كافٍ. يرجى شحن المحفظة أو اختيار طريقة دفع أخرى.");
    
    const btn = document.getElementById('walletSubmitBtn'); btn.innerHTML = "جاري معالجة الدفع... <i class='fas fa-spinner fa-spin'></i>";
    globalOrderId = "RX-" + Math.floor(10000 + Math.random() * 90000);

    try {
        await db.collection("users").doc(currentUser.uid).update({ balance: firebase.firestore.FieldValue.increment(-totalPrice) });
        await db.collection("orders").doc(globalOrderId).set({
            orderId: globalOrderId, uid: currentUser.uid, userEmail: currentUser.email, guestName: userProfileData.name, phone: phone,
            product: activeProduct.name, duration: currentDuration, qty: currentQty, price: totalPrice,
            paymentMethod: "Wallet", status: "Paid - Processing", date: firebase.firestore.FieldValue.serverTimestamp()
        });

        userBalance -= totalPrice; document.getElementById('walletBalanceDisplay').textContent = userBalance + " DZD";
        
        closeModal('checkoutModal');
        document.getElementById('successTitle').textContent = "تم الدفع بنجاح! 🎉";
        document.getElementById('successMsg').innerHTML = `تم خصم ${totalPrice} DZD من محفظتك.<br>سيتم إرسال طلبك قريباً.<br>رقم التتبع: <b style='color:var(--primary-blue); font-size:1.5rem;'>${globalOrderId}</b>`;
        document.getElementById('successModal').classList.add('active');
        btn.innerHTML = "تأكيد الدفع من المحفظة <i class='fas fa-check-circle'></i>";
    } catch(e) { alert("حدث خطأ غير متوقع."); btn.innerHTML = "تأكيد الدفع من المحفظة <i class='fas fa-check-circle'></i>"; }
}

// تعديل الدفع بـ Chargily للتعامل مع الأخطاء بدون Alert مزعج
async function payWithChargily() {
    const phone = document.getElementById('orderPhone').value.trim();
    let guestEmail = document.getElementById('orderGuestEmail') ? document.getElementById('orderGuestEmail').value.trim() : "";
    
    if(!phone) return alert("الرجاء إدخال رقم الواتساب.");
    if(!currentUser && !guestEmail) return alert("الرجاء كتابة البريد الإلكتروني لاستلام الطلب.");

    const totalPrice = basePrice * currentQty;
    const btn = document.getElementById('chargilySubmitBtn');
    btn.innerHTML = "جاري إنشاء رابط الدفع الآمن... <i class='fas fa-spinner fa-spin'></i>";
    globalOrderId = "RX-" + Math.floor(10000 + Math.random() * 90000);
    
    try {
        const response = await fetch("https://pay.chargily.net/api/v2/checkouts", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${CHARGILY_SECRET_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                amount: totalPrice,
                currency: "dzd",
                success_url: window.location.href, // رابط العودة في حال النجاح
                failure_url: window.location.href,
                metadata: { order_id: globalOrderId, client_phone: phone, product_name: activeProduct.name }
            })
        });

        const data = await response.json();
        
        if (data && data.checkout_url) {
            let uIdToUse = currentUser ? currentUser.uid : "guest_" + Date.now();
            let emailToUse = currentUser ? currentUser.email : guestEmail;

            await db.collection("orders").doc(globalOrderId).set({
                orderId: globalOrderId, uid: uIdToUse, userEmail: emailToUse, phone: phone,
                product: activeProduct.name, duration: currentDuration, qty: currentQty, price: totalPrice,
                paymentMethod: "Chargily", status: "Pending Payment", date: firebase.firestore.FieldValue.serverTimestamp()
            });

            window.location.href = data.checkout_url;
        } else {
            // إذا كان هناك خطأ في إعدادات Chargily (كمشكلة Webhook أو المفاتيح)
            alert("⚠️ عذراً، بوابة الدفع الآلي غير متاحة حالياً بسبب صيانة تقنية. يرجى اختيار طريقة دفع أخرى مثل بريدي موب أو المحفظة.");
            btn.innerHTML = "الانتقال لدفع بـ البطاقة الذهبية / CIB <i class='fas fa-credit-card'></i>";
        }
    } catch (error) {
        alert("⚠️ تعذر الاتصال بخادم الدفع. تأكد من اتصالك بالإنترنت أو جرب طريقة أخرى.");
        btn.innerHTML = "الانتقال لدفع بـ البطاقة الذهبية / CIB <i class='fas fa-credit-card'></i>";
    }
}

async function submitManualOrder() {
    const phone = document.getElementById('orderPhone').value.trim();
    let guestEmail = document.getElementById('orderGuestEmail') ? document.getElementById('orderGuestEmail').value.trim() : "";
    let guestName = document.getElementById('orderGuestName') ? document.getElementById('orderGuestName').value.trim() : "";
    const payMethod = document.getElementById('payMethod').value;
    
    if(!phone || !receiptBase64) return alert("يرجى كتابة رقم الواتساب وإرفاق صورة الوصل لإثبات الدفع.");
    if(!currentUser && !guestEmail) return alert("البريد الإلكتروني إجباري لإرسال الحساب لك.");

    globalOrderId = "RX-" + Math.floor(10000 + Math.random() * 90000);
    const btn = document.getElementById('submitBtn'); btn.innerHTML = "جاري رفع الطلب... <i class='fas fa-spinner fa-spin'></i>";
    
    let uIdToUse = currentUser ? currentUser.uid : "guest_" + Date.now();
    let emailToUse = currentUser ? currentUser.email : guestEmail;

    try {
        await db.collection("orders").doc(globalOrderId).set({
            orderId: globalOrderId, uid: uIdToUse, userEmail: emailToUse, guestName: guestName, phone: phone,
            product: activeProduct.name, duration: currentDuration, qty: currentQty, price: basePrice * currentQty,
            paymentMethod: payMethod, receiptImage: receiptBase64, status: "Pending", date: firebase.firestore.FieldValue.serverTimestamp()
        });
        closeModal('checkoutModal');
        document.getElementById('successTitle').textContent = "تم استلام طلبك!";
        document.getElementById('successMsg').innerHTML = `فريقنا يقوم بمراجعة الوصل لتفعيل طلبك قريباً.<br>احتفظ برقم الطلب للتتبع: <b style='color:var(--primary-blue); font-size:1.5rem;'>${globalOrderId}</b>`;
        document.getElementById('successModal').classList.add('active');
        btn.innerHTML = "إرسال الطلب للمراجعة <i class='fas fa-paper-plane'></i>";
    } catch (error) { alert("حدث خطأ في الإرسال."); btn.innerHTML = "إرسال الطلب للمراجعة <i class='fas fa-paper-plane'></i>"; }
}

function openRechargeModal() {
    document.getElementById('rechargeModal').classList.add('active');
    document.getElementById('rechargeAmount').value = ""; document.getElementById('rechargeMethod').value = "none";
    document.getElementById('rechargeManualDetails').classList.add('hidden');
    rechargeReceiptBase64 = ""; document.getElementById('rechargeUploadStatus').textContent = "";
}

function toggleRechargeInfo() {
    let method = document.getElementById('rechargeMethod').value;
    let manualDiv = document.getElementById('rechargeManualDetails'), instruct = document.getElementById('rechargeInstructions');
    manualDiv.classList.add('hidden');
    if(method === "Binance") { manualDiv.classList.remove('hidden'); instruct.innerHTML = "<b>رقم حساب (Binance Pay ID):</b><br><span style='font-size:1.5rem;font-weight:900;'>123456789</span>"; }
    else if(method === "Bybit") { manualDiv.classList.remove('hidden'); instruct.innerHTML = "<b>رقم حساب (Bybit UID):</b><br><span style='font-size:1.5rem;font-weight:900;'>987654321</span>"; }
    else if(method === "BaridiMob") { manualDiv.classList.remove('hidden'); instruct.innerHTML = "<b>رقم الحساب (RIP) لبريدي موب:</b><br><span style='font-size:1.3rem;font-weight:900;'>00799999002345678910</span>"; }
}

function handleRechargeUpload(event) {
    let file = event.target.files[0];
    if(file) { let reader = new FileReader(); reader.onloadend = function() { rechargeReceiptBase64 = reader.result; document.getElementById('rechargeUploadStatus').innerHTML = "✅ تم إرفاق صورة الوصل."; }; reader.readAsDataURL(file); }
}

async function submitRechargeRequest() {
    let amount = parseFloat(document.getElementById('rechargeAmount').value), method = document.getElementById('rechargeMethod').value;
    if(!amount || amount <= 0 || !rechargeReceiptBase64) return alert("تأكد من كتابة المبلغ وإرفاق صورة وصل التحويل.");

    const btn = document.getElementById('rechargeBtn'); btn.innerHTML = "جاري الإرسال... <i class='fas fa-spinner fa-spin'></i>";
    try {
        await db.collection("recharges").add({
            uid: currentUser.uid, userEmail: currentUser.email, amount: amount,
            method: method, receiptImage: rechargeReceiptBase64, status: "Pending", date: firebase.firestore.FieldValue.serverTimestamp()
        });
        closeModal('rechargeModal');
        document.getElementById('successTitle').textContent = "طلب الشحن قيد المراجعة!";
        document.getElementById('successMsg').innerHTML = `سيتم إضافة مبلغ <b>${amount} DZD</b> إلى محفظتك فور التأكد من وصول الحوالة.`;
        document.getElementById('successModal').classList.add('active');
        btn.innerHTML = "إرسال طلب الشحن <i class='fas fa-paper-plane'></i>";
    } catch(e) { alert("حدث خطأ."); btn.innerHTML = "إرسال طلب الشحن <i class='fas fa-paper-plane'></i>"; }
}

async function trackOrder() {
    let id = document.getElementById('trackInput').value.trim(), res = document.getElementById('trackResult');
    if(!id) return;
    res.style.display = 'block'; res.innerHTML = "<i class='fas fa-circle-notch fa-spin'></i> جاري البحث في النظام...";
    try {
        const doc = await db.collection('orders').doc(id).get();
        if (doc.exists) {
            let status = doc.data().status;
            let color = status.includes('Pending') ? '#F59E0B' : (status.includes('Paid') || status === 'Completed' ? '#10B981' : '#64748B');
            res.innerHTML = `تم العثور على الطلب!<br>المنتج: ${doc.data().product}<br>الحالة: <span style="color:${color}; font-weight:900;">${status}</span>`;
            res.style.background = '#F8FAFC'; res.style.border = '1px solid #E2E8F0';
        }
        else { res.innerHTML = "❌ لم يتم العثور على أي طلب بهذا الرقم."; res.style.background = '#FEF2F2'; res.style.color = '#EF4444'; }
    } catch (error) { res.innerHTML = "❌ خطأ في الاتصال بقاعدة البيانات."; }
}

window.onload = initStore;
