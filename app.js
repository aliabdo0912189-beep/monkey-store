
// MONKEY Customer Storefront
// Connected to the existing Supabase schema.

const SUPABASE_URL = "https://imuasdnaomubnlxcjvci.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_nvxMo7OEi917ycwbfBcf9w_I3NBsNDa";
const WHATSAPP_SUDAN = "249912189332";

const money = n =>
  new Intl.NumberFormat("ar-SD").format(Number(n) || 0) + " ج.س";

const $ = id => document.getElementById(id);

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

let products = [];
let cart = new Map();
let filter = "all";
let checkoutRunning = false;

// Generate a UUID, including on browsers without randomUUID.
function createUUID() {
  if (crypto.randomUUID) return crypto.randomUUID();

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 3 | 8)).toString(16);
  });
}

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.style.display = "block";

  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    el.style.display = "none";
  }, 2800);
}

function safe(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function imageOf(product) {
  const images = Array.isArray(product.image_urls)
    ? product.image_urls
    : [];

  return images[0] || "icon.svg";
}

function shownProducts() {
  const q = $("search").value.trim().toLocaleLowerCase("ar");

  return products.filter(p =>
    (filter === "all" || p.condition === filter) &&
    (
      `${p.name || ""} ${p.description || ""} ${p.car_make || ""} ${p.car_model || ""}`
    ).toLocaleLowerCase("ar").includes(q)
  );
}

function render() {
  const list = shownProducts();

  $("productGrid").innerHTML = list.length
    ? list.map(p => `
      <article class="product">
        <img
          src="${safe(imageOf(p))}"
          alt="${safe(p.name)}"
          loading="lazy"
          onerror="this.onerror=null;this.src='icon.svg'"
        >

        <div class="product-body">
          <h3>${safe(p.name)}</h3>
          <p>${safe(p.description || "")}</p>

          <span class="condition">
            ${p.condition === "used" ? "مستعمل نظيف" : "جديد"}
          </span>

          <div class="product-bottom">
            <span class="price">${money(p.price_sdg)}</span>
            <button class="order-btn" data-add="${safe(p.id)}">
              أضف للسلة
            </button>
          </div>
        </div>
      </article>
    `).join("")
    : `<div class="empty">لا توجد منتجات متاحة حالياً</div>`;

  document.querySelectorAll("[data-add]").forEach(button => {
    button.onclick = () => addToCart(button.dataset.add);
  });

  updateCartBadge();
}

async function loadProducts() {
  $("productGrid").innerHTML =
    `<div class="empty">جارٍ تحميل المنتجات...</div>`;

  try {
    const { data, error } = await db
      .from("products")
      .select(`
        id,
        name,
        description,
        condition,
        price_sdg,
        image_urls,
        available,
        car_make,
        car_model,
        model_years
      `)
      .eq("available", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    products = data || [];
    render();

  } catch (error) {
    console.error("MONKEY products error:", error);

    $("productGrid").innerHTML =
      `<div class="empty">تعذر تحميل المنتجات. تحقق من الاتصال والصلاحيات.</div>`;
  }
}

function addToCart(id) {
  const product = products.find(p => p.id === id);

  if (!product) return;

  cart.set(id, (cart.get(id) || 0) + 1);

  updateCartBadge();
  toast("أضيفت القطعة إلى السلة");
}

function updateCartBadge() {
  const count = [...cart.values()]
    .reduce((sum, quantity) => sum + quantity, 0);

  $("cartCount").textContent = count;
  $("cartCount").classList.toggle("hidden", count === 0);
}

function getCartRows() {
  return [...cart.entries()]
    .map(([id, quantity]) => ({
      product: products.find(p => p.id === id),
      quantity
    }))
    .filter(item => item.product);
}

function calculateTotal(rows) {
  return rows.reduce((sum, item) => {
    return sum +
      Number(item.product.price_sdg || 0) * item.quantity;
  }, 0);
}

function renderCart() {
  const rows = getCartRows();
  const total = calculateTotal(rows);

  $("cartItems").innerHTML = rows.length
    ? rows.map(({ product, quantity }) => `
      <div class="cart-row">
        <div>
          <b>${safe(product.name)}</b>
          <small>${money(product.price_sdg)} للقطعة</small>
        </div>

        <div class="qty">
          <button data-minus="${safe(product.id)}" aria-label="تقليل">−</button>
          <span>${quantity}</span>
          <button data-plus="${safe(product.id)}" aria-label="زيادة">+</button>
          <button data-remove="${safe(product.id)}" class="remove">حذف</button>
        </div>
      </div>
    `).join("")
    : `<p class="empty">السلة فارغة حالياً.</p>`;

  $("cartTotal").textContent = money(total);

  document.querySelectorAll("[data-minus]").forEach(button => {
    button.onclick = () => changeQty(button.dataset.minus, -1);
  });

  document.querySelectorAll("[data-plus]").forEach(button => {
    button.onclick = () => changeQty(button.dataset.plus, 1);
  });

  document.querySelectorAll("[data-remove]").forEach(button => {
    button.onclick = () => {
      cart.delete(button.dataset.remove);
      renderCart();
      updateCartBadge();
    };
  });

  $("checkoutBtn").disabled = rows.length === 0 || checkoutRunning;
}

function changeQty(id, delta) {
  const next = (cart.get(id) || 0) + delta;

  if (next <= 0) {
    cart.delete(id);
  } else {
    cart.set(id, next);
  }

  renderCart();
  updateCartBadge();
}

function openCart() {
  renderCart();
  $("cartModal").classList.remove("hidden");
}

function closeCart() {
  $("cartModal").classList.add("hidden");
}

function showCheckoutMessage(message) {
  $("checkoutMessage").textContent = message;
}

async function checkout() {
  if (checkoutRunning) return;

  const name = $("customerName").value.trim();
  const phone = $("customerPhone").value.trim();
  const address = $("customerAddress").value.trim();

  const rows = getCartRows();

  if (!name || !phone) {
    showCheckoutMessage("أدخل الاسم ورقم الجوال أولاً.");
    return;
  }

  if (!rows.length) {
    showCheckoutMessage("السلة فارغة.");
    return;
  }

  // Validate prices before saving.
  for (const item of rows) {
    const price = Number(item.product.price_sdg);

    if (!Number.isFinite(price) || price < 0) {
      showCheckoutMessage("يوجد سعر غير صالح. تواصل مع الإدارة.");
      return;
    }
  }

  const total = calculateTotal(rows);
  const orderId = createUUID();

  // Open the WhatsApp window immediately during the button click.
  // This reduces browser popup-blocking after the database request.
  const whatsappWindow = window.open("about:blank", "_blank");

  checkoutRunning = true;
  $("checkoutBtn").disabled = true;
  showCheckoutMessage("جارٍ حفظ الطلب...");

  try {
    // Save the main order.
    const { error: orderError } = await db
      .from("orders")
      .insert({
        id: orderId,
        customer_name: name,
        customer_phone: phone,
        customer_address: address || null,
        notes: "طلب من متجر MONKEY",
        total_sdg: total,
        status: "new"
      });

    if (orderError) {
      throw new Error("تعذر حفظ الطلب: " + orderError.message);
    }

    // Save all order items.
    const itemRows = rows.map(item => ({
      order_id: orderId,
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      unit_price_sdg: Number(item.product.price_sdg)
    }));

    const { error: itemError } = await db
      .from("order_items")
      .insert(itemRows);

    if (itemError) {
      if (whatsappWindow) whatsappWindow.close();

      showCheckoutMessage(
        "تم إنشاء سجل الطلب لكن تعذر حفظ تفاصيل القطع. " +
        "لا تعاود الطلب الآن. رقم الطلب: " + orderId
      );

      console.error("MONKEY order items error:", itemError);
      return;
    }

    // Prepare WhatsApp confirmation message.
    const lines = rows.map(item =>
      `• ${item.product.name} × ${item.quantity} = ` +
      money(Number(item.product.price_sdg) * item.quantity)
    ).join("\n");

    const message =
      `السلام عليكم، أريد تأكيد طلبي من متجر MONKEY\n` +
      `رقم الطلب: ${orderId}\n` +
      `الاسم: ${name}\n` +
      `الجوال: ${phone}\n` +
      `العنوان: ${address || "لم يحدد"}\n\n` +
      `${lines}\n\n` +
      `الإجمالي: ${money(total)}\n` +
      `الرجاء تأكيد التوفر والشحن.`;

    const whatsappURL =
      `https://wa.me/${WHATSAPP_SUDAN}?text=${encodeURIComponent(message)}`;

    // Navigate the already-opened window.
    if (whatsappWindow) {
      whatsappWindow.location.href = whatsappURL;
    } else {
      // If the browser blocked the popup, show a manual link.
      $("checkoutMessage").innerHTML =
        `تم حفظ الطلب بنجاح. <a href="${safe(whatsappURL)}" target="_blank" rel="noopener">اضغط هنا للمتابعة إلى واتساب</a>`;
    }

    cart.clear();
    updateCartBadge();

    $("customerName").value = "";
    $("customerPhone").value = "";
    $("customerAddress").value = "";

    closeCart();
    toast("تم حفظ الطلب. أكمل الإرسال من واتساب.");

  } catch (error) {
    if (whatsappWindow) whatsappWindow.close();

    console.error("MONKEY checkout error:", error);
    showCheckoutMessage(error.message || "حدث خطأ أثناء حفظ الطلب.");

  } finally {
    checkoutRunning = false;
    $("checkoutBtn").disabled = getCartRows().length === 0;
  }
}

// Search
$("search").addEventListener("input", render);

// Product filters
document.querySelectorAll(".filter").forEach(button => {
  button.onclick = () => {
    filter = button.dataset.filter;

    document.querySelectorAll(".filter").forEach(item => {
      item.classList.toggle("active", item === button);
    });

    render();
  };
});

// Cart controls
$("cartOpen").onclick = openCart;
$("cartClose").onclick = closeCart;
$("checkoutBtn").onclick = checkout;

// Start
loadProducts();

// Service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .catch(console.warn);
  });
}
