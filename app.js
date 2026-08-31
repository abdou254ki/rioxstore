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

let storeProducts = [], activeProduct = null, currentDuration = "", basePrice = 0, currentQty = 1;
let receiptBase64 = "", rechargeReceiptBase64 = "", globalOrderId = "";
let currentUser = null, userBalance = 0, userProfileData = null;

// المفتاح السري الخاص ببوابة الدفع Chargily (نسخة V2)
const CHARGILY_SECRET_KEY = "ضع_مفتاحك_السري_هنا_الذي_ينتهي_بـ_0Jpb";

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

function handleProfileClick() {
    if (currentUser) { switchPage('profile'); } 
    else { document.getElementById('authModal').classList.add('active'); }
}

function toggleAuthMode() {
    document.getElementById('loginForm').classList.toggle('hidden');
    document.getElementById('registerForm').classList.toggle('hidden');
}

async function registerUser() {
    const name = document.getElementById('regName').value, email = document.getElementById('regEmail').value, password = document.getElementById('regPassword').value;
    if(!name || !email || !password) return alert("أكمل جميع البيانات.");
    try {
        const userCred = await firebase.auth().createUserWithEmailAndPassword(email, password);
        await db.collection("users").doc(userCred.user.uid).set({ name: name, email: email, balance: 0, uid: userCred.user.uid });
        alert("تم إنشاء الحساب بنجاح!");
    } catch (error) { alert("حدث خطأ: " + error.message); }
}

async function loginUser() {
    const email = document.getElementById('authEmail').value, password = document.getElementById('authPassword').value;
    if(!email || !password) return alert("أدخل الإيميل وكلمة المرور.");
    try { await firebase.auth().signInWithEmailAndPassword(email, password); } 
    catch (error) { alert("كلمة المرور أو الإيميل غير صحيح"); }
}

function logoutUser() { firebase.auth().signOut().then(() => { switchPage('home'); }); }

async function initStore() {
    const grid = document.getElementById('productsGrid');
    try {
        const snapshot = await db.collection('products').get();
        storeProducts = []; snapshot.forEach(doc => { let data = doc.data(); data.id = doc.id; storeProducts.push(data); });
        grid.innerHTML = '';
        if(storeProducts.length === 0) { grid.innerHTML = '<div style="text-align:center; grid-column: 1/-1;">لا توجد منتجات حالياً.</div>'; return; }

        storeProducts.forEach(product => {
            let firstPrice = 0;
            if(product.options && product.options.length > 0) firstPrice = product.options[0].price;
            grid.innerHTML += `
                <div class="product-card" onclick="openDetails('${product.id}')">
                    <div class="card-img-placeholder"><img src="${product.image || 'https://via.placeholder.com/150'}"></div>
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-price">ابتداءً من <span>${firstPrice} DZD</span></p>
                    <button class="btn-add">التفاصيل <i class="fas fa-cart-plus"></i></button>
                </div>`;
        });
    } catch (error) { grid.innerHTML = '<div style="text-align:center; grid-column:1/-1; color:red;">خطأ في جلب المنتجات.</div>'; }
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('active'); document.getElementById('sidebarOverlay').classList.toggle('active'); }
function switchPage(pageId) {
    document.querySelectorAll('.page-sec').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId + '-sec').classList.add('active');
    document.querySelectorAll('.side-link').forEach(l => l.classList.remove('active'));
    if(event) event.currentTarget.classList.add('active');
    if (window.innerWidth <= 768) toggleSidebar();
}
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
window.onclick = function(e) { if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('active'); }

function openDetails(id) {
    activeProduct = storeProducts.find(p => p.id === id);
    if (!activeProduct) return;
    currentQty = 1; document.getElementById('qtyDisplay').textContent = currentQty;
    document.getElementById('modalTitle').textContent = activeProduct.name;
    document.getElementById('modalImg').src = activeProduct.image || '';

    const fList = document.getElementById('modalFeatures'); fList.innerHTML = "";
    if(activeProduct.features) {
        activeProduct.features.forEach(f => { let li = document.createElement('li'); li.textContent = f; fList.appendChild(li); });
    }

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
    
    // إظهار فورم معلومات الزبون إذا لم يكن مسجلاً للدخول
    if (!currentUser) {
        document.getElementById('guestInfoForm').classList.remove('hidden');
    } else {
        document.getElementById('guestInfoForm').classList.add('hidden');
    }

    document.getElementById('payMethod').value = "none"; togglePaymentInfo();
    receiptBase64 = ""; document.getElementById('uploadStatus').textContent = "";
}

function togglePaymentInfo() {
    let method = document.getElementById('payMethod').value;
    let manualDiv = document.getElementById('manualPaymentDetails'), walletDiv = document.getElementById('walletSection'), chargilyDiv = document.getElementById('chargilySection'), instruct = document.getElementById('payInstructions');
    
    manualDiv.classList.add('hidden'); walletDiv.classList.add('hidden'); chargilyDiv.classList.add('hidden');

    if(method === "Wallet") {
        if(!currentUser) { alert("يجب تسجيل الدخول لاستخدام المحفظة."); document.getElementById('payMethod').value = "none"; return; }
        walletDiv.classList.remove('hidden'); document.getElementById('checkoutWalletBalance').textContent = userBalance;
    }
    else if(method === "Chargily") { chargilyDiv.classList.remove('hidden'); }
    else if(method === "Binance") { manualDiv.classList.remove('hidden'); instruct.innerHTML = "<b>Binance Pay ID:</b><br> <span style='color:var(--badge-orange); font-size:1.3rem;'>123456789</span>"; }
    else if(method === "Bybit") { manualDiv.classList.remove('hidden'); instruct.innerHTML = "<b>Bybit UID:</b><br> <span style='color:var(--badge-orange); font-size:1.3rem;'>987654321</span>"; }
    else if(method === "BaridiMob") { manualDiv.classList.remove('hidden'); instruct.innerHTML = "<b>RIP:</b><br> 00799999002345678910"; }
}

function handleFileUpload(event) {
    let file = event.target.files[0];
    if(file) { let reader = new FileReader(); reader.onloadend = function() { receiptBase64 = reader.result; document.getElementById('uploadStatus').innerHTML = "✅ تم إرفاق الوصل بنجاح!"; }; reader.readAsDataURL(file); }
}

async function payWithWallet() {
    const phone = document.getElementById('orderPhone').value.trim();
    if(!phone) return alert("أدخل رقم الواتساب أولاً.");
    const totalPrice = basePrice * currentQty;
    
    if(userBalance < totalPrice) return alert("عفواً، رصيد المحفظة غير كافٍ.");
    
    const btn = document.getElementById('walletSubmitBtn'); btn.innerHTML = "جاري الدفع... <i class='fas fa-spinner fa-spin'></i>";
    globalOrderId = "RX-" + Math.floor(10000 + Math.random() * 90000);

    try {
        await db.collection("users").doc(currentUser.uid).update({ balance: firebase.firestore.FieldValue.increment(-totalPrice) });
        await db.collection("orders").doc(globalOrderId).set({
            orderId: globalOrderId, uid: currentUser.uid, userEmail: currentUser.email, phone: phone,
            product: activeProduct.name, duration: currentDuration, qty: currentQty, price: totalPrice,
            paymentMethod: "Wallet", status: "Paid - Processing", date: firebase.firestore.FieldValue.serverTimestamp()
        });

        userBalance -= totalPrice; document.getElementById('walletBalanceDisplay').textContent = userBalance + " DZD";
        
        closeModal('checkoutModal');
        document.getElementById('successTitle').textContent = "تم الدفع بنجاح!";
        document.getElementById('successMsg').innerHTML = `تم خصم ${totalPrice} DZD من محفظتك.<br>رقم طلبك: <b style='color:var(--primary-blue); font-size:1.5rem;'>${globalOrderId}</b>`;
        document.getElementById('successModal').classList.add('active');
        btn.innerHTML = "الدفع من المحفظة وتأكيد الطلب <i class='fas fa-wallet'></i>";
    } catch(e) { alert("حدث خطأ."); btn.innerHTML = "الدفع من المحفظة وتأكيد الطلب <i class='fas fa-wallet'></i>"; }
}

// ================= نظام الدفع الآلي Chargily V2 =================
async function payWithChargily() {
    const phone = document.getElementById('orderPhone').value.trim();
    let guestEmail = document.getElementById('orderGuestEmail').value.trim();
    
    if(!phone) return alert("الرجاء إدخال رقم الواتساب.");
    if(!currentUser && !guestEmail) return alert("الرجاء كتابة البريد الإلكتروني لاستلام الحساب.");

    const totalPrice = basePrice * currentQty;
    const btn = document.getElementById('chargilySubmitBtn');
    btn.innerHTML = "جاري تحويلك لبوابة الدفع... <i class='fas fa-spinner fa-spin'></i>";

    // توليد رقم طلب عشوائي
    globalOrderId = "RX-" + Math.floor(10000 + Math.random() * 90000);
    
    // استدعاء رابط الدفع من API Chargily
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
                success_url: window.location.href,
                failure_url: window.location.href,
                metadata: {
                    order_id: globalOrderId,
                    client_phone: phone,
                    client_email: currentUser ? currentUser.email : guestEmail,
                    product_name: activeProduct.name
                }
            })
        });

        const data = await response.json();
        
        if (data && data.checkout_url) {
            // حفظ الطلب في Firebase كـ "قيد انتظار الدفع" قبل التوجيه
            let uIdToUse = currentUser ? currentUser.uid : "guest_" + Date.now();
            let emailToUse = currentUser ? currentUser.email : guestEmail;

            await db.collection("orders").doc(globalOrderId).set({
                orderId: globalOrderId, uid: uIdToUse, userEmail: emailToUse, phone: phone,
                product: activeProduct.name, duration: currentDuration, qty: currentQty, price: totalPrice,
                paymentMethod: "Chargily CIB/Edahabia", status: "Pending Payment", date: firebase.firestore.FieldValue.serverTimestamp()
            });

            // توجيه العميل لبوابة الدفع
            window.location.href = data.checkout_url;
        } else {
            alert("حدث خطأ في إنشاء رابط الدفع من Chargily.");
            btn.innerHTML = "إكمال الدفع بـ البطاقة الذهبية / CIB <i class='fas fa-credit-card'></i>";
        }
    } catch (error) {
        alert("فشل الاتصال ببوابة الدفع. تأكد من إعدادات Chargily.");
        btn.innerHTML = "إكمال الدفع بـ البطاقة الذهبية / CIB <i class='fas fa-credit-card'></i>";
    }
}

async function submitManualOrder() {
    const phone = document.getElementById('orderPhone').value.trim();
    let guestEmail = document.getElementById('orderGuestEmail').value.trim();
    let guestName = document.getElementById('orderGuestName').value.trim();
    const payMethod = document.getElementById('payMethod').value;
    
    if(!phone || !receiptBase64) return alert("يرجى كتابة رقم الواتساب وإرفاق صورة الوصل.");
    if(!currentUser && !guestEmail) return alert("الرجاء كتابة البريد الإلكتروني.");

    globalOrderId = "RX-" + Math.floor(10000 + Math.random() * 90000);
    const btn = document.getElementById('submitBtn'); btn.innerHTML = "جاري الإرسال... <i class='fas fa-spinner fa-spin'></i>";
    
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
        document.getElementById('successMsg').innerHTML = `جاري مراجعة الوصل وتفعيل طلبك.<br>رقم طلبك: <b style='color:var(--primary-blue); font-size:1.5rem;'>${globalOrderId}</b>`;
        document.getElementById('successModal').classList.add('active');
        btn.innerHTML = "إرسال الطلب للمراجعة <i class='fas fa-check'></i>";
    } catch (error) { alert("حدث خطأ."); btn.innerHTML = "إرسال الطلب للمراجعة <i class='fas fa-check'></i>"; }
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
    if(method === "Binance") { manualDiv.classList.remove('hidden'); instruct.innerHTML = "<b>Binance Pay ID:</b> 123456789"; }
    else if(method === "BaridiMob") { manualDiv.classList.remove('hidden'); instruct.innerHTML = "<b>RIP:</b> 00799999002345678910"; }
}

function handleRechargeUpload(event) {
    let file = event.target.files[0];
    if(file) { let reader = new FileReader(); reader.onloadend = function() { rechargeReceiptBase64 = reader.result; document.getElementById('rechargeUploadStatus').innerHTML = "✅ تم إرفاق الوصل بنجاح!"; }; reader.readAsDataURL(file); }
}

async function submitRechargeRequest() {
    let amount = parseFloat(document.getElementById('rechargeAmount').value), method = document.getElementById('rechargeMethod').value;
    if(!amount || amount <= 0 || !rechargeReceiptBase64) return alert("أدخل مبلغاً صحيحاً وارفع صورة الوصل.");

    const btn = document.getElementById('rechargeBtn'); btn.innerHTML = "جاري الإرسال... <i class='fas fa-spinner fa-spin'></i>";
    try {
        await db.collection("recharges").add({
            uid: currentUser.uid, userEmail: currentUser.email, amount: amount,
            method: method, receiptImage: rechargeReceiptBase64, status: "Pending", date: firebase.firestore.FieldValue.serverTimestamp()
        });
        closeModal('rechargeModal');
        document.getElementById('successTitle').textContent = "تم استلام طلب الشحن!";
        document.getElementById('successMsg').innerHTML = `جاري مراجعة الوصل من قبل الإدارة وسيتم إضافة ${amount} DZD لمحفظتك قريباً.`;
        document.getElementById('successModal').classList.add('active');
        btn.innerHTML = "إرسال طلب الشحن";
    } catch(e) { alert("حدث خطأ"); btn.innerHTML = "إرسال طلب الشحن"; }
}

async function trackOrder() {
    let id = document.getElementById('trackInput').value.trim(), res = document.getElementById('trackResult');
    if(!id) return;
    res.innerHTML = "جاري البحث... <i class='fas fa-spinner fa-spin'></i>";
    try {
        const doc = await db.collection('orders').doc(id).get();
        if (doc.exists) res.innerHTML = `الحالة: <span style="color:var(--primary-blue);">${doc.data().status}</span>`;
        else res.innerHTML = "❌ لم يتم العثور على هذا الطلب.";
    } catch (error) { res.innerHTML = "❌ خطأ في الاتصال."; }
}

window.onload = initStore;
