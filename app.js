
// ==========================================
// MONKEY - Customer Storefront
// ==========================================

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
let selectedMake = "all";
let selectedModel = "all";
let checkoutRunning = false;

let galleryImages = [];
let galleryIndex = 0;
let galleryName = "";

// ==========================================
// أدوات مساعدة
// ==========================================

function safe(v = "") {
  return String(v).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function toast(message) {
  const el = $("toast");
  if (!el) return;

  el.textContent = message;
  el.style.display = "block";

  clearTimeout(toast.timer);

  toast.timer = setTimeout(() => {
    el.style.display = "none";
  }, 2600);
}

function imageList(p) {
  return Array.isArray(p.image_urls)
    ? p.image_urls.filter(Boolean)
    : [];
}

function imageOf(p) {
  return imageList(p)[0] || "./monkey-logo.png";
}

function makeOrderId() {
  if (window.crypto && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 3 | 8)).toString(16);
  });
}

// ==========================================
// إدارة ظهور الشريط عند فتح النوافذ
// ==========================================

function syncModalBodyClass() {
  const modalIds = [
    "cartModal",
    "imageModal",
    "detailsModal"
  ];

  const isOpen = modalIds.some(id => {
    const modal = $(id);
    return modal && !modal.classList.contains("hidden");
  });

  document.body.classList.toggle("modal-open", isOpen);
}

// ==========================================
// إعدادات بنكك من لوحة المدير
// ==========================================

async function loadBankSettings() {
  const box = $("bankPaymentBox");

  if (!box) return;

  box.classList.add("hidden");

  try {
    const { data, error } = await db
      .from("app_settings")
      .select(
        "bank_name,bank_account_number,bank_account_holder,bank_payment_instructions,bank_payment_enabled"
      )
      .eq("id", 1)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      console.warn("لا توجد إعدادات بنكك في app_settings.");
      return;
    }

    const bankName = String(data.bank_name || "").trim();
    const accountNumber = String(data.bank_account_number || "").trim();
    const accountHolder = String(data.bank_account_holder || "").trim();
    const instructions = String(data.bank_payment_instructions || "").trim();

    if (
      data.bank_payment_enabled !== true ||
      !bankName ||
      !accountNumber ||
      !accountHolder
    ) {
      return;
    }

    $("bankName").textContent = bankName;
    $("bankAccountNumber").textContent = accountNumber;
    $("bankAccountHolder").textContent = accountHolder;

    $("bankPaymentInstructions").textContent =
      instructions || "حوّل قيمة الطلب ثم أرسل صورة الإيصال إلى الإدارة عبر واتساب.";

    box.classList.remove("hidden");

  } catch (e) {
    console.error("خطأ في قراءة إعدادات بنكك:", e);
    box.classList.add("hidden");
  }
}

// ==========================================
// نسخ رقم حساب بنكك
// ==========================================

async function copyBankAccount() {
  const account = $("bankAccountNumber")?.textContent?.trim();

  if (!account || account === "—") {
    toast("رقم الحساب غير متوفر");
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(account);
    } else {
      const input = document.createElement("textarea");
      input.value = account;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();

      const copied = document.execCommand("copy");
      input.remove();

      if (!copied) throw new Error("تعذر النسخ");
    }

    toast("تم نسخ رقم الحساب");

  } catch (e) {
    console.error(e);
    toast("تعذر النسخ. يمكنك تحديد الرقم ونسخه يدوياً.");
  }
}

// ==========================================
// فلاتر شركات السيارات والموديلات
// ==========================================

function makeFilters() {
  const makes = [
    ...new Set(products.map(p => p.car_make).filter(Boolean))
  ].sort((a, b) => a.localeCompare(b, "ar"));

  const make = $("carMakeFilter");
  if (!make) return;

  const old = selectedMake;

  make.innerHTML =
    '<option value="all">كل الشركات</option>' +
    makes.map(m =>
      `<option value="${safe(m)}">${safe(m)}</option>`
    ).join("");

  make.value = makes.includes(old) ? old : "all";
  selectedMake = make.value;

  makeModels();
}

function makeModels() {
  const el = $("carModelFilter");
  if (!el) return;

  const models = [
    ...new Set(
      products
        .filter(p => selectedMake === "all" || p.car_make === selectedMake)
        .map(p => p.car_model)
        .filter(Boolean)
    )
  ].sort((a, b) => a.localeCompare(b, "ar"));

  el.innerHTML =
    '<option value="all">كل الموديلات</option>' +
    models.map(m =>
      `<option value="${safe(m)}">${safe(m)}</option>`
    ).join("");

  if (!models.includes(selectedModel)) {
    selectedModel = "all";
  }

  el.value = selectedModel;
}

function shownProducts() {
  const q = $("search").value.trim().toLocaleLowerCase("ar");

  return products.filter(p =>
    (filter === "all" || p.condition === filter) &&
    (selectedMake === "all" || p.car_make === selectedMake) &&
    (selectedModel === "all" || p.car_model === selectedModel) &&
    (
      `${p.name || ""} ${p.description || ""} ${p.car_make || ""} ${p.car_model || ""} ${p.model_years || ""}`
    ).toLocaleLowerCase("ar").includes(q)
  );
}

// ==========================================
// معرض صور المنتجات
// ==========================================

function showGalleryImage() {
  const img = $("largeProductImage");
  const counter = $("imageCounter");

  if (!galleryImages.length || !img) return;

  img.src = galleryImages[galleryIndex];
  img.alt = galleryName || "صورة المنتج";

  $("imageModalCaption").textContent = galleryName;

  if (counter) {
    counter.textContent =
      `${galleryIndex + 1} / ${galleryImages.length}`;
  }

  const prev = $("imagePrev");
  const next = $("imageNext");

  if (prev) prev.disabled = galleryImages.length <= 1;
  if (next) next.disabled = galleryImages.length <= 1;
}

function openGallery(images, name, startIndex = 0) {
  galleryImages = (images || []).filter(Boolean);

  if (!galleryImages.length) {
    galleryImages = ["./monkey-logo.png"];
  }

  galleryName = name || "صورة المنتج";

  galleryIndex = Math.max(
    0,
    Math.min(startIndex, galleryImages.length - 1)
  );

  showGalleryImage();

  $("imageModal").classList.remove("hidden");
  syncModalBodyClass();
}

function openImage(src, name) {
  openGallery([src], name);
}

function closeImage() {
  $("imageModal")?.classList.add("hidden");
  syncModalBodyClass();
}

function previousImage() {
  if (galleryImages.length <= 1) return;

  galleryIndex =
    (galleryIndex - 1 + galleryImages.length) % galleryImages.length;

  showGalleryImage();
}

function nextImage() {
  if (galleryImages.length <= 1) return;

  galleryIndex =
    (galleryIndex + 1) % galleryImages.length;

  showGalleryImage();
}

// ==========================================
// تفاصيل المنتج والمنتجات المشابهة
// ==========================================

function openProductDetails(id) {
  const p = products.find(x => String(x.id) === String(id));

  if (!p) return;

  const imgs = imageList(p);
  const firstImage = imageOf(p);

  const related = products
    .filter(x =>
      String(x.id) !== String(p.id) &&
      (
        (p.car_make && x.car_make === p.car_make) ||
        (p.car_model && x.car_model === p.car_model)
      )
    )
    .slice(0, 4);

  const modal = $("detailsModal");
  const content = $("detailsContent");

  if (!modal || !content) {
    toast("نافذة تفاصيل المنتج غير موجودة في الصفحة");
    return;
  }

  content.innerHTML = `
    <img
      class="details-main-image"
      id="detailsMainImage"
      src="${safe(firstImage)}"
      alt="${safe(p.name)}"
      onerror="this.onerror=null;this.src='./monkey-logo.png'"
    >

    ${imgs.length > 1
      ? `<p class="image-count">اضغط الصورة لمشاهدة جميع الصور (${imgs.length})</p>`
      : ""
    }

    <h3 class="details-title" id="detailsName">
      ${safe(p.name)}
    </h3>

    <div class="details-price">
      ${money(p.price_sdg)}
    </div>

    <p class="details-description">
      ${safe(p.description || "لا يوجد وصف إضافي لهذا المنتج حالياً.")}
    </p>

    <div class="details-meta">
      <div>الشركة: ${safe(p.car_make || "غير محدد")}</div>
      <div>الموديل: ${safe(p.car_model || "غير محدد")}</div>
      <div>سنوات الصنع: ${safe(p.model_years || "غير محددة")}</div>
      <div>الحالة: ${p.condition === "used" ? "مستعمل نظيف" : "جديد"}</div>
      <div>التوفر: ${p.available ? "متوفر" : "غير متوفر"}</div>
    </div>

    <div class="details-actions">
      <button
        class="details-btn"
        type="button"
        id="detailsAddBtn"
      >
        أضف للسلة
      </button>

      <button
        class="buy-btn"
        type="button"
        id="detailsBuyBtn"
      >
        شراء
      </button>
    </div>

    ${
      related.length
        ? `
          <h3 class="similar-title">
            منتجات أخرى قد تعجبك
          </h3>

          <div class="similar-grid">
            ${related.map(x => `
              <button
                class="similar-card"
                type="button"
                data-related="${safe(x.id)}"
              >
                <img
                  src="${safe(imageOf(x))}"
                  alt="${safe(x.name)}"
                  loading="lazy"
                  onerror="this.onerror=null;this.src='./monkey-logo.png'"
                >

                <b>${safe(x.name)}</b>
                <span>${money(x.price_sdg)}</span>
              </button>
            `).join("")}
          </div>
        `
        : ""
    }
  `;

  $("detailsMainImage").onclick = () => {
    openGallery(imgs.length ? imgs : [firstImage], p.name);
  };

  $("detailsAddBtn").onclick = () => {
    addToCart(p.id);
  };

  $("detailsBuyBtn").onclick = () => {
    addToCart(p.id);
    modal.classList.add("hidden");
    syncModalBodyClass();
    openCart();
  };

  document.querySelectorAll("[data-related]").forEach(btn => {
    btn.onclick = () => openProductDetails(btn.dataset.related);
  });

  modal.classList.remove("hidden");
  syncModalBodyClass();
}

function closeProductDetails() {
  $("detailsModal")?.classList.add("hidden");
  syncModalBodyClass();
}

// ==========================================
// عرض المنتجات
// ==========================================

function render() {
  const list = shownProducts();

  $("productGrid").innerHTML = list.length
    ? list.map(p => {
        const imgs = imageList(p);
        const firstImage = imageOf(p);

        return `
          <article class="product">

            <button
              class="product-photo"
              type="button"
              data-gallery="${safe(p.id)}"
              aria-label="تكبير صورة ${safe(p.name)}"
            >
              <img
                src="${safe(firstImage)}"
                alt="${safe(p.name)}"
                loading="lazy"
                onerror="this.onerror=null;this.src='./monkey-logo.png'"
              >
            </button>

            <div class="product-body">

              <h3>${safe(p.name)}</h3>

              <p>${safe(p.description || "")}</p>

              <div class="product-meta">
                ${safe(p.car_make || "")}
                ${safe(p.car_model || "")}
                ${safe(p.model_years || "")}
              </div>

              <span class="condition">
                ${p.condition === "used" ? "مستعمل نظيف" : "جديد"}
              </span>

              <div class="product-bottom">

                <span class="price">
                  ${money(p.price_sdg)}
                </span>

                <div class="product-actions">

                  <button
                    class="details-btn"
                    type="button"
                    data-details="${safe(p.id)}"
                  >
                    التفاصيل
                  </button>

                  <button
                    class="order-btn"
                    type="button"
                    data-add="${safe(p.id)}"
                  >
                    أضف للسلة
                  </button>

                </div>

                <button
                  class="buy-btn"
                  type="button"
                  data-buy="${safe(p.id)}"
                >
                  شراء
                </button>

              </div>

              ${
                imgs.length > 1
                  ? `<small class="image-count">${imgs.length} صور - اضغط الصورة للتكبير</small>`
                  : ""
              }

            </div>
          </article>
        `;
      }).join("")
    : '<div class="empty">لا توجد منتجات مطابقة حالياً</div>';

  document.querySelectorAll("[data-add]").forEach(b => {
    b.onclick = () => addToCart(b.dataset.add);
  });

  document.querySelectorAll("[data-buy]").forEach(b => {
    b.onclick = () => {
      addToCart(b.dataset.buy);
      openCart();
    };
  });

  document.querySelectorAll("[data-details]").forEach(b => {
    b.onclick = () => openProductDetails(b.dataset.details);
  });

  document.querySelectorAll("[data-gallery]").forEach(b => {
    b.onclick = () => {
      const p = products.find(x => String(x.id) === b.dataset.gallery);
      if (p) openGallery(imageList(p), p.name);
    };
  });

  updateCartBadge();
}

// ==========================================
// تحميل المنتجات من Supabase
// ==========================================

async function loadProducts() {
  $("productGrid").innerHTML =
    '<div class="empty">جارٍ تحميل المنتجات...</div>';

  try {
    const { data, error } = await db
      .from("products")
      .select(
        "id,name,description,condition,price_sdg,image_urls,available,car_make,car_model,model_years,created_at"
      )
      .eq("available", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    products = data || [];

    makeFilters();
    render();

  } catch (e) {
    console.error(e);

    $("productGrid").innerHTML =
      '<div class="empty">تعذر تحميل المنتجات. تحقق من الاتصال والصلاحيات.</div>';
  }
}

// ==========================================
// السلة
// ==========================================

function addToCart(id) {
  const p = products.find(x => String(x.id) === String(id));

  if (!p) return;

  cart.set(id, (cart.get(id) || 0) + 1);

  updateCartBadge();
  toast("أضيفت القطعة إلى السلة");
}

function updateCartBadge() {
  const n = [...cart.values()].reduce((a, b) => a + b, 0);

  const headerCount = $("cartCount");

  if (headerCount) {
    headerCount.textContent = n;
    headerCount.classList.toggle("hidden", n === 0);
  }

  const bottomCount = $("bottomCartCount");

  if (bottomCount) {
    bottomCount.textContent = n;
    bottomCount.classList.toggle("hidden", n === 0);
  }
}

function getCartRows() {
  return [...cart.entries()]
    .map(([id, quantity]) => ({
      product: products.find(p => String(p.id) === String(id)),
      quantity
    }))
    .filter(x => x.product);
}

function calculateTotal(rows) {
  return rows.reduce(
    (s, x) =>
      s + Number(x.product.price_sdg || 0) * x.quantity,
    0
  );
}

function renderCart() {
  const rows = getCartRows();

  $("cartItems").innerHTML = rows.length
    ? rows.map(({ product, quantity }) => `
        <div class="cart-row">

          <img
            class="cart-thumb"
            src="${safe(imageOf(product))}"
            alt="${safe(product.name)}"
            data-cart-image="${safe(product.id)}"
            onerror="this.onerror=null;this.src='./monkey-logo.png'"
          >

          <div class="cart-info">
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
    : '<p class="empty">السلة فارغة حالياً.</p>';

  $("cartTotal").textContent = money(calculateTotal(rows));

  document.querySelectorAll("[data-minus]").forEach(b => {
    b.onclick = () => changeQty(b.dataset.minus, -1);
  });

  document.querySelectorAll("[data-plus]").forEach(b => {
    b.onclick = () => changeQty(b.dataset.plus, 1);
  });

  document.querySelectorAll("[data-remove]").forEach(b => {
    b.onclick = () => {
      cart.delete(b.dataset.remove);
      renderCart();
      updateCartBadge();
    };
  });

  document.querySelectorAll("[data-cart-image]").forEach(b => {
    b.onclick = () => {
      const p = products.find(x => String(x.id) === b.dataset.cartImage);

      if (p) openGallery(imageList(p), p.name);
    };
  });

  $("checkoutBtn").disabled =
    !rows.length || checkoutRunning;
}

function changeQty(id, d) {
  const n = (cart.get(id) || 0) + d;

  if (n <= 0) {
    cart.delete(id);
  } else {
    cart.set(id, n);
  }

  renderCart();
  updateCartBadge();
}

function openCart() {
  renderCart();
  $("cartModal").classList.remove("hidden");
  syncModalBodyClass();
}

function closeCart() {
  $("cartModal").classList.add("hidden");
  syncModalBodyClass();
}

function showCheckoutMessage(message) {
  $("checkoutMessage").textContent = message;
}

// ==========================================
// تأكيد الطلب وحفظه ثم فتح واتساب
// ==========================================

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

  for (const x of rows) {
    const n = Number(x.product.price_sdg);

    if (!Number.isFinite(n) || n < 0) {
      showCheckoutMessage(
        "يوجد سعر غير صالح. تواصل مع الإدارة."
      );
      return;
    }
  }

  const total = calculateTotal(rows);
  const orderId = makeOrderId();

  const whatsappWindow = window.open("about:blank", "_blank");

  checkoutRunning = true;
  $("checkoutBtn").disabled = true;

  showCheckoutMessage("جارٍ حفظ الطلب...");

  try {
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
      throw new Error(
        "تعذر حفظ الطلب: " + orderError.message
      );
    }

    const items = rows.map(x => ({
      order_id: orderId,
      product_id: x.product.id,
      product_name: x.product.name,
      quantity: x.quantity,
      unit_price_sdg: Number(x.product.price_sdg)
    }));

    const { error: itemsError } = await db
      .from("order_items")
      .insert(items);

    if (itemsError) {
      if (whatsappWindow) whatsappWindow.close();

      showCheckoutMessage(
        "تم إنشاء سجل الطلب لكن تعذر حفظ تفاصيل القطع. لا تعاود الطلب الآن. رقم الطلب: " +
        orderId
      );

      console.error(itemsError);
      return;
    }

    const lines = rows.map(x =>
      `• ${x.product.name} × ${x.quantity} = ${
        money(Number(x.product.price_sdg) * x.quantity)
      }`
    ).join("\n");

    const message =
      `السلام عليكم، أريد تأكيد طلبي من متجر MONKEY\n` +
      `رقم الطلب: ${orderId}\n` +
      `الاسم: ${name}\n` +
      `الجوال: ${phone}\n` +
      `العنوان: ${address || "لم يحدد"}\n\n` +
      `${lines}\n\n` +
      `الإجمالي: ${money(total)}\n\n` +
      `سأرسل صورة إيصال التحويل داخل هذه المحادثة بعد الدفع.\n` +
      `الرجاء تأكيد التوفر والشحن.`;

    const whatsappUrl =
      `https://wa.me/${WHATSAPP_SUDAN}?text=${encodeURIComponent(message)}`;

    if (whatsappWindow) {
      whatsappWindow.location.href = whatsappUrl;
    } else {
      $("checkoutMessage").innerHTML =
        `تم حفظ الطلب بنجاح. ` +
        `<a href="${safe(whatsappUrl)}" target="_blank" rel="noopener">اضغط هنا للمتابعة إلى واتساب</a>`;
    }

    cart.clear();
    updateCartBadge();

    $("customerName").value = "";
    $("customerPhone").value = "";
    $("customerAddress").value = "";

    closeCart();

    toast("تم حفظ الطلب. أكمل الإرسال من واتساب.");

  } catch (e) {
    if (whatsappWindow) whatsappWindow.close();

    console.error(e);

    showCheckoutMessage(
      e.message || "حدث خطأ أثناء حفظ الطلب."
    );

  } finally {
    checkoutRunning = false;

    $("checkoutBtn").disabled =
      getCartRows().length === 0;
  }
}

// ==========================================
// شريط التنقل السفلي
// ==========================================

function setupBottomNavigation() {
  document.querySelectorAll("[data-nav]").forEach(button => {
    button.addEventListener("click", () => {
      const target = button.dataset.nav;

      if (target === "home") {
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }

      if (target === "cart") {
        openCart();
      }

      if (target === "bank") {
        const bank = $("bankPaymentBox");

        if (!bank || bank.classList.contains("hidden")) {
          toast("خدمة بنكك غير متاحة حالياً");
          return;
        }

        bank.open = true;

        bank.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }

      if (target === "contact") {
        window.open(
          "https://wa.me/" + WHATSAPP_SUDAN,
          "_blank",
          "noopener"
        );
      }
    });
  });
}

// ==========================================
// ربط الأزرار والحقول
// ==========================================

$("search").addEventListener("input", render);

document.querySelectorAll(".filter").forEach(b => {
  b.onclick = () => {
    filter = b.dataset.filter;

    document.querySelectorAll(".filter").forEach(x => {
      x.classList.toggle("active", x === b);
    });

    render();
  };
});

$("cartOpen").onclick = openCart;
$("cartClose").onclick = closeCart;
$("checkoutBtn").onclick = checkout;

$("copyBankAccount")?.addEventListener(
  "click",
  copyBankAccount
);

$("imageModalClose")?.addEventListener(
  "click",
  closeImage
);

$("imagePrev")?.addEventListener(
  "click",
  previousImage
);

$("imageNext")?.addEventListener(
  "click",
  nextImage
);

$("imageModal")?.addEventListener("click", e => {
  if (e.target.id === "imageModal") {
    closeImage();
  }
});

$("detailsClose")?.addEventListener(
  "click",
  closeProductDetails
);

$("detailsModal")?.addEventListener("click", e => {
  if (e.target.id === "detailsModal") {
    closeProductDetails();
  }
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    closeImage();
    closeProductDetails();
  }

  if (!$("imageModal")?.classList.contains("hidden")) {
    if (e.key === "ArrowRight") previousImage();
    if (e.key === "ArrowLeft") nextImage();
  }
});

$("carMakeFilter")?.addEventListener("change", e => {
  selectedMake = e.target.value;
  selectedModel = "all";

  makeModels();
  render();
});

$("carModelFilter")?.addEventListener("change", e => {
  selectedModel = e.target.value;
  render();
});

setupBottomNavigation();

// ==========================================
// تشغيل المتجر
// ==========================================

loadProducts();
loadBankSettings();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .catch(console.warn);
  });
}
