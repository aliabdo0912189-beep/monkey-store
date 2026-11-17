// MONKEY Customer Storefront - updated
const SUPABASE_URL = "https://imuasdnaomubnlxcjvci.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_nvxMo7OEi917ycwbfBcf9w_I3NBsNDa";
const WHATSAPP_SUDAN = "249912189332";
const money = n => new Intl.NumberFormat("ar-SD").format(Number(n) || 0) + " ج.س";
const $ = id => document.getElementById(id);
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
let products = [], cart = new Map(), filter = "all", selectedMake = "all", selectedModel = "all", checkoutRunning = false;
function safe(v="") { return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function toast(message) { const el=$("toast"); el.textContent=message; el.style.display="block"; clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.style.display="none",2600); }
function imageList(p) { return Array.isArray(p.image_urls) ? p.image_urls.filter(Boolean) : []; }
function imageOf(p) { return imageList(p)[0] || "./monkey-icon.png"; }
function makeFilters() {
  const makes=[...new Set(products.map(p=>p.car_make).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ar"));
  const make=$("carMakeFilter"); if(!make) return;
  const old=selectedMake; make.innerHTML='<option value="all">كل الشركات</option>'+makes.map(m=>`<option value="${safe(m)}">${safe(m)}</option>`).join("");
  make.value=makes.includes(old)?old:"all"; selectedMake=make.value;
  makeModels();
}
function makeModels() {
  const el=$("carModelFilter"); if(!el) return;
  const models=[...new Set(products.filter(p=>selectedMake==="all"||p.car_make===selectedMake).map(p=>p.car_model).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ar"));
  el.innerHTML='<option value="all">كل الموديلات</option>'+models.map(m=>`<option value="${safe(m)}">${safe(m)}</option>`).join("");
  if(!models.includes(selectedModel)) selectedModel="all"; el.value=selectedModel;
}
function shownProducts() {
  const q=$("search").value.trim().toLocaleLowerCase("ar");
  return products.filter(p=>(filter==="all"||p.condition===filter)&&(selectedMake==="all"||p.car_make===selectedMake)&&(selectedModel==="all"||p.car_model===selectedModel)&&(`${p.name||""} ${p.description||""} ${p.car_make||""} ${p.car_model||""} ${p.model_years||""}`).toLocaleLowerCase("ar").includes(q));
}
function openImage(src, name) { const modal=$("imageModal"); if(!modal) return; $("largeProductImage").src=src; $("largeProductImage").alt=name||"صورة المنتج"; $("imageModalCaption").textContent=name||""; modal.classList.remove("hidden"); }
function closeImage() { $("imageModal")?.classList.add("hidden"); }
function render() {
 const list=shownProducts();
 $("productGrid").innerHTML=list.length?list.map(p=>{const imgs=imageList(p);return `<article class="product"><button class="product-photo" type="button" data-image="${safe(imageOf(p))}" data-name="${safe(p.name)}" aria-label="تكبير صورة ${safe(p.name)}"><img src="${safe(imageOf(p))}" alt="${safe(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='./monkey-icon.png'"></button><div class="product-body"><h3>${safe(p.name)}</h3><p>${safe(p.description||"")}</p><div class="product-meta">${safe(p.car_make||"")} ${safe(p.car_model||"")} ${safe(p.model_years||"")}</div><span class="condition">${p.condition==="used"?"مستعمل نظيف":"جديد"}</span><div class="product-bottom"><span class="price">${money(p.price_sdg)}</span><button class="order-btn" data-add="${safe(p.id)}">أضف للسلة</button></div>${imgs.length>1?`<small class="image-count">${imgs.length} صور - اضغط الصورة للتكبير</small>`:""}</div></article>`;}).join(""):`<div class="empty">لا توجد منتجات مطابقة حالياً</div>`;
 document.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>addToCart(b.dataset.add));
 document.querySelectorAll("[data-image]").forEach(b=>b.onclick=()=>openImage(b.dataset.image,b.dataset.name)); updateCartBadge();
}
async function loadProducts() {
 $("productGrid").innerHTML='<div class="empty">جارٍ تحميل المنتجات...</div>';
 try { const {data,error}=await db.from("products").select("id,name,description,condition,price_sdg,image_urls,available,car_make,car_model,model_years,created_at").eq("available",true).order("created_at",{ascending:false}); if(error) throw error; products=data||[]; makeFilters(); render(); }
 catch(e){console.error(e);$("productGrid").innerHTML='<div class="empty">تعذر تحميل المنتجات. تحقق من الاتصال والصلاحيات.</div>';}
}
function addToCart(id){const p=products.find(x=>x.id===id);if(!p)return;cart.set(id,(cart.get(id)||0)+1);updateCartBadge();toast("أضيفت القطعة إلى السلة");}
function updateCartBadge(){const n=[...cart.values()].reduce((a,b)=>a+b,0);$("cartCount").textContent=n;$("cartCount").classList.toggle("hidden",n===0);}
function getCartRows(){return [...cart.entries()].map(([id,quantity])=>({product:products.find(p=>p.id===id),quantity})).filter(x=>x.product);}
function calculateTotal(rows){return rows.reduce((s,x)=>s+Number(x.product.price_sdg||0)*x.quantity,0);}
function renderCart(){const rows=getCartRows();$("cartItems").innerHTML=rows.length?rows.map(({product,quantity})=>`<div class="cart-row"><img class="cart-thumb" src="${safe(imageOf(product))}" alt="${safe(product.name)}" data-cart-image="${safe(imageOf(product))}" data-cart-name="${safe(product.name)}" onerror="this.onerror=null;this.src='./monkey-icon.png'"><div class="cart-info"><b>${safe(product.name)}</b><small>${money(product.price_sdg)} للقطعة</small></div><div class="qty"><button data-minus="${safe(product.id)}" aria-label="تقليل">−</button><span>${quantity}</span><button data-plus="${safe(product.id)}" aria-label="زيادة">+</button><button data-remove="${safe(product.id)}" class="remove">حذف</button></div></div>`).join(""):'<p class="empty">السلة فارغة حالياً.</p>';
 $("cartTotal").textContent=money(calculateTotal(rows)); document.querySelectorAll("[data-minus]").forEach(b=>b.onclick=()=>changeQty(b.dataset.minus,-1));document.querySelectorAll("[data-plus]").forEach(b=>b.onclick=()=>changeQty(b.dataset.plus,1));document.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{cart.delete(b.dataset.remove);renderCart();updateCartBadge();});document.querySelectorAll("[data-cart-image]").forEach(b=>b.onclick=()=>openImage(b.dataset.cartImage,b.dataset.cartName));$("checkoutBtn").disabled=!rows.length||checkoutRunning;
}
function changeQty(id,d){const n=(cart.get(id)||0)+d;if(n<=0)cart.delete(id);else cart.set(id,n);renderCart();updateCartBadge();}
function openCart(){renderCart();$("cartModal").classList.remove("hidden");} function closeCart(){$("cartModal").classList.add("hidden");}
function showCheckoutMessage(m){$("checkoutMessage").textContent=m;}
async function checkout(){if(checkoutRunning)return;const name=$("customerName").value.trim(),phone=$("customerPhone").value.trim(),address=$("customerAddress").value.trim(),rows=getCartRows();if(!name||!phone){showCheckoutMessage("أدخل الاسم ورقم الجوال أولاً.");return;}if(!rows.length){showCheckoutMessage("السلة فارغة.");return;}for(const x of rows){const n=Number(x.product.price_sdg);if(!Number.isFinite(n)||n<0){showCheckoutMessage("يوجد سعر غير صالح. تواصل مع الإدارة.");return;}}
 const total=calculateTotal(rows),orderId=crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==="x"?r:(r&3|8)).toString(16);});const w=window.open("about:blank","_blank");checkoutRunning=true;$("checkoutBtn").disabled=true;showCheckoutMessage("جارٍ حفظ الطلب...");
 try{const {error:oe}=await db.from("orders").insert({id:orderId,customer_name:name,customer_phone:phone,customer_address:address||null,notes:"طلب من متجر MONKEY",total_sdg:total,status:"new"});if(oe)throw new Error("تعذر حفظ الطلب: "+oe.message);
 const items=rows.map(x=>({order_id:orderId,product_id:x.product.id,product_name:x.product.name,quantity:x.quantity,unit_price_sdg:Number(x.product.price_sdg)}));const {error:ie}=await db.from("order_items").insert(items);if(ie){if(w)w.close();showCheckoutMessage("تم إنشاء سجل الطلب لكن تعذر حفظ تفاصيل القطع. لا تعاود الطلب الآن. رقم الطلب: "+orderId);console.error(ie);return;}
 const lines=rows.map(x=>`• ${x.product.name} × ${x.quantity} = ${money(Number(x.product.price_sdg)*x.quantity)}`).join("\n");const message=`السلام عليكم، أريد تأكيد طلبي من متجر MONKEY\nرقم الطلب: ${orderId}\nالاسم: ${name}\nالجوال: ${phone}\nالعنوان: ${address||"لم يحدد"}\n\n${lines}\n\nالإجمالي: ${money(total)}\nالرجاء تأكيد التوفر والشحن.`;const url=`https://wa.me/${WHATSAPP_SUDAN}?text=${encodeURIComponent(message)}`;if(w)w.location.href=url;else $("checkoutMessage").innerHTML=`تم حفظ الطلب بنجاح. <a href="${safe(url)}" target="_blank" rel="noopener">اضغط هنا للمتابعة إلى واتساب</a>`;cart.clear();updateCartBadge();$("customerName").value=$("customerPhone").value=$("customerAddress").value="";closeCart();toast("تم حفظ الطلب. أكمل الإرسال من واتساب.");
 }catch(e){if(w)w.close();console.error(e);showCheckoutMessage(e.message||"حدث خطأ أثناء حفظ الطلب.");}finally{checkoutRunning=false;$("checkoutBtn").disabled=getCartRows().length===0;}}
$("search").addEventListener("input",render);document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));render();});
$("cartOpen").onclick=openCart;$("cartClose").onclick=closeCart;$("checkoutBtn").onclick=checkout;$("imageModalClose")?.addEventListener("click",closeImage);$("imageModal")?.addEventListener("click",e=>{if(e.target.id==="imageModal")closeImage();});document.addEventListener("keydown",e=>{if(e.key==="Escape")closeImage();});
$("carMakeFilter")?.addEventListener("change",e=>{selectedMake=e.target.value;selectedModel="all";makeModels();render();});$("carModelFilter")?.addEventListener("change",e=>{selectedModel=e.target.value;render();});
loadProducts();if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(console.warn));
