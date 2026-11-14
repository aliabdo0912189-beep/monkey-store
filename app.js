/* =========================================
   MONKEY STORE - APP.JS
   الجزء 1: الاتصال والإعدادات والمنتجات
========================================= */

const SUPABASE_URL = "https://imuasdnaomubnlxcjvci.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_nvxMo7OEi917ycwbfBcf9w_I3NBsNDa";
const WHATSAPP_SUDAN = "249912189332";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const $ = (id) => document.getElementById(id);

let products = [];
let cart = [];

try {
  const savedCart = JSON.parse(localStorage.getItem("monkey_cart") || "[]");
  cart = Array.isArray(savedCart) ? savedCart : [];
} catch (error) {
  console.warn("Saved cart could not be read.", error);
  cart = [];
}

let selectedCondition = "all";

let galleryImages = [];
let galleryIndex = 0;
let galleryName = "";

let currentDetailsProduct = null;

/* =========================================
   أدوات مساعدة
========================================= */

function safe(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function money(value) {
  return Number(value || 0).toLocaleString("ar");
}

function toast(message) {
  const box = $("toast");
  if (!box) return;

  box.textContent = message;
  box.style.display = "block";

  clearTimeout(window.monkeyToastTimer);

  window.monkeyToastTimer = setTimeout(() => {
    box.style.display = "none";
  }, 2800);
}

function imageList(product) {
  let images = product?.image_urls || [];

  if (typeof images === "string") {
    try {
      images = JSON.parse(images);
    } catch {
      images = [images];
    }
  }

  if (!Array.isArray(images)) images = [];

  return images
    .filter(Boolean)
    .map((image) => String(image));
}

function imageOf(product) {
  return imageList(product)[0] || "./monkey-logo.png";
}

function makeOrderId() {
  return "MON-" + Date.now().toString().slice(-9);
}

function saveCart() {
  localStorage.setItem("monkey_cart", JSON.stringify(cart));
  updateCartBadge();
}

function syncModalBodyClass() {
  const modalIds = [
    "cartModal",
    "detailsModal",
    "requestPartModal",
    "imageModal"
  ];

  const opened = modalIds.some((id) => {
    const element = $(id);
    return element && (
      element.classList.contains("show") ||
      getComputedStyle(element).display !== "none"
    );
  });

  document.body.classList.toggle("modal-open", opened);
}

/* =========================================
   إعدادات بنكك
========================================= */

async function loadBankSettings() {
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!data) return;

    if ($("bankName")) {
      $("bankName").textContent = data.bank_name || "بنكك";
    }

    if ($("bankAccountHolder")) {
      $("bankAccountHolder").textContent =
        data.bank_account_holder || "غير متوفر";
    }

    if ($("bankAccountNumber")) {
      const account = String(data.bank_account_number || "").trim();

      $("bankAccountNumber").textContent =
        account === "1890245" || !account
          ? "غير متوفر حالياً"
          : account;
    }

    if ($("bankPaymentInstructions")) {
      $("bankPaymentInstructions").textContent =
        data.bank_payment_instructions ||
        "يرجى التأكد من بيانات الحساب قبل التحويل.";
    }

    const enabled = data.bank_payment_enabled !== false;

    const bankBox = $("bankPaymentBox");
    if (bankBox) {
      bankBox.style.display = enabled ? "" : "none";
    }

  } catch (error) {
    console.error("Bank settings error:", error);
  }
}

async function copyBankAccount() {
  const account = $("bankAccountNumber")?.textContent?.trim();

  if (!account || account === "غير متوفر حالياً") {
    toast("رقم الحساب غير متوفر حالياً");
    return;
  }

  try {
    await navigator.clipboard.writeText(account);
    toast("تم نسخ رقم الحساب");
  } catch {
    toast("تعذر نسخ رقم الحساب");
  }
}

/* =========================================
   فلاتر السيارات
========================================= */

function makeFilters() {
  const makes = [...new Set(
    products.map((p) => p.car_make).filter(Boolean)
  )].sort();

  const makeFilter = $("carMakeFilter");

  if (makeFilter) {
    const selected = makeFilter.value;

    makeFilter.innerHTML =
      '<option value="">جميع شركات السيارات</option>' +
      makes.map((make) =>
        `<option value="${safe(make)}">${safe(make)}</option>`
      ).join("");

    makeFilter.value = selected;
  }

  makeModels();
}

function makeModels() {
  const make = $("carMakeFilter")?.value || "";

  const models = [...new Set(
    products
      .filter((p) => !make || p.car_make === make)
      .map((p) => p.car_model)
      .filter(Boolean)
  )].sort();

  const modelFilter = $("carModelFilter");

  if (!modelFilter) return;

  const selected = modelFilter.value;

  modelFilter.innerHTML =
    '<option value="">جميع الموديلات</option>' +
    models.map((model) =>
      `<option value="${safe(model)}">${safe(model)}</option>`
    ).join("");

  modelFilter.value = models.includes(selected) ? selected : "";
}

function shownProducts() {
  const search = $("search")?.value?.trim().toLowerCase() || "";
  const make = $("carMakeFilter")?.value || "";
  const model = $("carModelFilter")?.value || "";
  const condition = $("conditionFilter")?.value || "";

  return products.filter((p) => {
    const searchable = [
      p.name,
      p.description,
      p.car_make,
      p.car_model,
      p.model_years
    ].join(" ").toLowerCase();

    return (
      (!search || searchable.includes(search)) &&
      (!make || p.car_make === make) &&
      (!model || p.car_model === model) &&
      (!condition || p.condition === condition)
    );
  });
}

/* =========================================
   معرض صور المنتجات
========================================= */

function showGalleryImage(index) {
  if (!galleryImages.length) return;

  galleryIndex =
    (index + galleryImages.length) % galleryImages.length;

  const image = $("imageModalImg");

  if (image) {
    image.src = galleryImages[galleryIndex];
    image.alt = galleryName;
    image.style.transform = "scale(1)";
  }

  const counter = $("imageCounter");

  if (counter) {
    counter.textContent =
      `${galleryIndex + 1} / ${galleryImages.length}`;
  }
}

function openGallery(images, name, index = 0) {
  galleryImages = images?.length ? images : ["./monkey-logo.png"];
  galleryName = name || "صورة المنتج";

  const modal = $("imageModal");
  if (!modal) return;

  modal.classList.add("show");
  modal.style.display = "flex";

  showGalleryImage(index);
  syncModalBodyClass();
}

function openImage(url, name = "") {
  openGallery([url], name, 0);
}

function closeImage() {
  const modal = $("imageModal");
  if (!modal) return;

  modal.classList.remove("show");
  modal.style.display = "none";

  const image = $("imageModalImg");
  if (image) {
    image.src = "";
    image.style.transform = "scale(1)";
  }

  syncModalBodyClass();
}

function previousImage() {
  showGalleryImage(galleryIndex - 1);
}

function nextImage() {
  showGalleryImage(galleryIndex + 1);
}

/* =========================================
   عرض المنتجات
========================================= */

function renderProductGallery(product) {
  const images = imageList(product);
  const firstImage = images[0] || "./monkey-logo.png";

  return `
    <div class="product-gallery">
      <img
        src="${safe(firstImage)}"
        alt="${safe(product.name)}"
        class="product-image"
        data-gallery="${safe(product.id)}"
        loading="lazy"
      >

      ${
        images.length > 1
          ? `<div class="gallery-dots">
              ${images.map((_, index) => `
                <button
                  type="button"
                  class="gallery-dot ${index === 0 ? "active" : ""}"
                  data-product-dot="${safe(product.id)}"
                  data-index="${index}"
                  aria-label="الصورة ${index + 1}"
                ></button>
              `).join("")}
            </div>`
          : ""
      }
    </div>
  `;
}

function render() {
  const grid = $("productGrid");
  if (!grid) return;

  const list = shownProducts();

  if (!list.length) {
    grid.innerHTML = `
      <div class="empty-products">
        لا توجد منتجات مطابقة للبحث حالياً
      </div>
    `;
    return;
  }

  grid.innerHTML = list.map((p) => `
    <article class="product-card">

      ${renderProductGallery(p)}

      <div class="product-info">

        <h3>${safe(p.name)}</h3>

        <div class="product-price">
          ${money(p.price_sdg)} جنيه
        </div>

        <p class="product-description">
          ${safe(p.description || "")}
        </p>

        <div class="product-actions">

          <button
            type="button"
            data-details="${safe(p.id)}"
          >
            التفاصيل
          </button>

          <button
            type="button"
            data-add="${safe(p.id)}"
          >
            أضف للسلة
          </button>

          <button
            type="button"
            data-buy="${safe(p.id)}"
          >
            شراء
          </button>

        </div>
      </div>
    </article>
  `).join("");
}
/* =========================================
   تفاصيل المنتج
========================================= */

function openProductDetails(id) {
  const product = products.find((p) => String(p.id) === String(id));

  if (!product) {
    toast("تعذر العثور على المنتج");
    return;
  }

  currentDetailsProduct = product;

  const images = imageList(product);
  const firstImage = images[0] || "./monkey-logo.png";

  const modal = $("detailsModal");
  const content = $("detailsContent");

  if (!modal || !content) return;

  content.innerHTML = `
    <div class="details-info">

      <div class="details-gallery">

        <img
          id="detailsMainImage"
          src="${safe(firstImage)}"
          alt="${safe(product.name)}"
        >

        ${
          images.length > 1
            ? `
              <button type="button"
                class="gallery-arrow prev"
                id="detailsPrev">‹</button>

              <button type="button"
                class="gallery-arrow next"
                id="detailsNext">›</button>

              <div class="gallery-dots">
                ${images.map((_, index) => `
                  <button
                    type="button"
                    class="gallery-dot ${index === 0 ? "active" : ""}"
                    data-details-dot="${index}"
                    aria-label="الصورة ${index + 1}"
                  ></button>
                `).join("")}
              </div>
            `
            : ""
        }

      </div>

      <h2>${safe(product.name)}</h2>

      <div class="details-price">
        ${money(product.price_sdg)} جنيه
      </div>

      <div class="details-description">
        ${safe(product.description || "لا يوجد وصف إضافي")}
      </div>

      <div class="details-meta">

        <div>
          <strong>الشركة:</strong>
          ${safe(product.car_make || "غير محدد")}
        </div>

        <div>
          <strong>الموديل:</strong>
          ${safe(product.car_model || "غير محدد")}
        </div>

        <div>
          <strong>سنوات الصنع:</strong>
          ${safe(product.model_years || "غير محدد")}
        </div>

        <div>
          <strong>الحالة:</strong>
          ${safe(product.condition || "غير محدد")}
        </div>

        <div>
          <strong>التوفر:</strong>
          ${product.available ? "متوفر" : "غير متوفر"}
        </div>

      </div>

      <div class="details-actions">

        <button
          type="button"
          class="primary-btn"
          id="detailsAddBtn"
          ${product.available ? "" : "disabled"}
        >
          أضف للسلة
        </button>

        <button
          type="button"
          class="secondary-btn"
          id="detailsBuyBtn"
          ${product.available ? "" : "disabled"}
        >
          شراء الآن
        </button>

      </div>

    </div>
  `;

  let detailsImageIndex = 0;

  function changeDetailsImage(index) {
    if (!images.length) return;

    detailsImageIndex =
      (index + images.length) % images.length;

    const mainImage = $("detailsMainImage");

    if (mainImage) {
      mainImage.src = images[detailsImageIndex];
    }

    content.querySelectorAll("[data-details-dot]").forEach((dot) => {
      dot.classList.toggle(
        "active",
        Number(dot.dataset.detailsDot) === detailsImageIndex
      );
    });
  }

  content.querySelectorAll("[data-details-dot]").forEach((dot) => {
    dot.addEventListener("click", () => {
      changeDetailsImage(Number(dot.dataset.detailsDot));
    });
  });

  $("detailsPrev")?.addEventListener("click", () => {
    changeDetailsImage(detailsImageIndex - 1);
  });

  $("detailsNext")?.addEventListener("click", () => {
    changeDetailsImage(detailsImageIndex + 1);
  });

  $("detailsMainImage")?.addEventListener("click", () => {
    openGallery(images, product.name, detailsImageIndex);
  });

  $("detailsAddBtn")?.addEventListener("click", () => {
    addToCart(product.id);
  });

  $("detailsBuyBtn")?.addEventListener("click", () => {
    addToCart(product.id);
    closeDetails();
    openCart();
  });

  modal.classList.add("show");
  modal.style.display = "flex";

  syncModalBodyClass();
}

function closeDetails() {
  const modal = $("detailsModal");
  if (!modal) return;

  modal.classList.remove("show");
  modal.style.display = "none";

  syncModalBodyClass();
}

/* =========================================
   السلة
========================================= */

function addToCart(id) {
  const product = products.find(
    (p) => String(p.id) === String(id)
  );

  if (!product) {
    toast("المنتج غير موجود");
    return;
  }

  if (!product.available) {
    toast("هذه القطعة غير متوفرة حالياً");
    return;
  }

  const existing = cart.find(
    (item) => String(item.product_id) === String(id)
  );

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      unit_price_sdg: Number(product.price_sdg || 0),
      image: imageOf(product)
    });
  }

  saveCart();
  toast("تمت إضافة المنتج إلى السلة");
}

function updateCartBadge() {
  const badge = $("cartBadge");
  if (!badge) return;

  const count = cart.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  badge.textContent = count > 0 ? count : "";
}

function getCartRows() {
  return cart.map((item) => {
    const product = products.find(
      (p) => String(p.id) === String(item.product_id)
    );

    return {
      ...item,
      product,
      product_name: product?.name || item.product_name,
      unit_price_sdg: Number(
        product?.price_sdg ?? item.unit_price_sdg ?? 0
      ),
      image: product ? imageOf(product) : item.image
    };
  });
}

function calculateTotal() {
  return getCartRows().reduce(
    (total, item) =>
      total +
      Number(item.unit_price_sdg || 0) *
      Number(item.quantity || 0),
    0
  );
}

function renderCart() {
  const container = $("cartItems");
  if (!container) return;

  const rows = getCartRows();

  if (!rows.length) {
    container.innerHTML = `
      <p class="empty-cart">السلة فارغة حالياً</p>
    `;
  } else {
    container.innerHTML = rows.map((item) => `
      <div class="cart-row">

        <img
          src="${safe(item.image || "./monkey-logo.png")}"
          alt="${safe(item.product_name)}"
        >

        <div class="cart-row-info">

          <h4>${safe(item.product_name)}</h4>

          <div class="cart-row-price">
            ${money(item.unit_price_sdg)} جنيه
          </div>

          <div class="qty-controls">

            <button
              type="button"
              data-qty-plus="${safe(item.product_id)}"
            >+</button>

            <span>${Number(item.quantity)}</span>

            <button
              type="button"
              data-qty-minus="${safe(item.product_id)}"
            >−</button>

            <button
              type="button"
              data-remove="${safe(item.product_id)}"
              style="background:#444;color:white;width:auto;padding:0 8px"
            >حذف</button>

          </div>

        </div>

      </div>
    `).join("");
  }

  const total = $("cartTotal");

  if (total) {
    total.textContent = `${money(calculateTotal())} جنيه`;
  }
}

function changeQty(id, amount) {
  const item = cart.find(
    (row) => String(row.product_id) === String(id)
  );

  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) {
    cart = cart.filter(
      (row) => String(row.product_id) !== String(id)
    );
  }

  saveCart();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(
    (item) => String(item.product_id) !== String(id)
  );

  saveCart();
  renderCart();

  toast("تم حذف المنتج من السلة");
}

function openCart() {
  const modal = $("cartModal");
  if (!modal) return;

  renderCart();

  modal.classList.add("show");
  modal.style.display = "flex";

  syncModalBodyClass();
}

function closeCart() {
  const modal = $("cartModal");
  if (!modal) return;

  modal.classList.remove("show");
  modal.style.display = "none";

  syncModalBodyClass();
}

/* =========================================
   أزرار صور المنتجات وأزرار البطاقات
========================================= */

function setupProductActions() {
  const grid = $("productGrid");
  if (!grid) return;

  grid.addEventListener("click", (event) => {

    const detailsButton = event.target.closest("[data-details]");

    if (detailsButton) {
      openProductDetails(detailsButton.dataset.details);
      return;
    }

    const addButton = event.target.closest("[data-add]");

    if (addButton) {
      addToCart(addButton.dataset.add);
      return;
    }

    const buyButton = event.target.closest("[data-buy]");

    if (buyButton) {
      const id = buyButton.dataset.buy;
      const product = products.find(
        (p) => String(p.id) === String(id)
      );

      if (!product?.available) {
        toast("هذه القطعة غير متوفرة حالياً");
        return;
      }

      addToCart(id);
      openCart();
      return;
    }

    const dot = event.target.closest("[data-product-dot]");

    if (dot) {
      const id = dot.dataset.productDot;
      const index = Number(dot.dataset.index);

      const product = products.find(
        (p) => String(p.id) === String(id)
      );

      if (!product) return;

      const images = imageList(product);
      const gallery = dot.closest(".product-gallery");
      const image = gallery?.querySelector(".product-image");

      if (image && images[index]) {
        image.src = images[index];
      }

      gallery?.querySelectorAll("[data-product-dot]").forEach((button) => {
        button.classList.toggle(
          "active",
          Number(button.dataset.index) === index
        );
      });

      return;
    }

    const image = event.target.closest("[data-gallery]");

    if (image) {
      const id = image.dataset.gallery;

      const product = products.find(
        (p) => String(p.id) === String(id)
      );

      if (product) {
        openGallery(
          imageList(product),
          product.name,
          0
        );
      }
    }

  });
}

/* =========================================
   أزرار السلة
========================================= */

function setupCartActions() {
  const container = $("cartItems");
  if (!container) return;

  container.addEventListener("click", (event) => {

    const plus = event.target.closest("[data-qty-plus]");

    if (plus) {
      changeQty(plus.dataset.qtyPlus, 1);
      return;
    }

    const minus = event.target.closest("[data-qty-minus]");

    if (minus) {
      changeQty(minus.dataset.qtyMinus, -1);
      return;
    }

    const remove = event.target.closest("[data-remove]");

    if (remove) {
      removeFromCart(remove.dataset.remove);
    }

  });
}
/* =========================================
   إتمام الطلب وحفظه في قاعدة البيانات
========================================= */

async function checkout() {
  if (!cart.length) {
    toast("السلة فارغة");
    return;
  }

  const customerName = $("customerName")?.value.trim();
  const customerPhone = $("customerPhone")?.value.trim();
  const customerAddress = $("customerAddress")?.value.trim();
  const orderNotes = $("orderNotes")?.value.trim() || "";

  if (!customerName || !customerPhone || !customerAddress) {
    toast("يرجى إدخال الاسم ورقم الهاتف والعنوان");
    return;
  }

  const button = $("checkoutBtn");

  if (button) {
    button.disabled = true;
    button.textContent = "جاري حفظ الطلب...";
  }

  try {
    const rows = getCartRows();

    for (const item of rows) {
      if (!item.product || !item.product.available) {
        throw new Error(
          `القطعة ${item.product_name} لم تعد متوفرة`
        );
      }
    }

    const total = calculateTotal();
    const orderId = makeOrderId();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([{
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        notes: orderNotes
          ? `${orderNotes} | رقم الطلب: ${orderId}`
          : `رقم الطلب: ${orderId}`,
        total_sdg: total,
        status: "جديد"
      }])
      .select("id")
      .single();

    if (orderError) throw orderError;

    const orderItems = rows.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: Number(item.quantity),
      unit_price_sdg: Number(item.unit_price_sdg)
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Order items error:", itemsError);
      throw new Error(
        "تم إنشاء الطلب لكن تعذر حفظ تفاصيل المنتجات. يرجى التواصل معنا."
      );
    }

    const message = [
      "السلام عليكم، أريد تأكيد طلب من متجر MONKEY",
      "",
      `رقم الطلب: ${orderId}`,
      `الاسم: ${customerName}`,
      `الهاتف: ${customerPhone}`,
      `العنوان: ${customerAddress}`,
      "",
      "المنتجات:",
      ...rows.map((item) =>
        `- ${item.product_name} × ${item.quantity} = ${money(item.unit_price_sdg * item.quantity)} جنيه`
      ),
      "",
      `الإجمالي: ${money(total)} جنيه`,
      orderNotes ? `ملاحظات: ${orderNotes}` : "",
      "",
      "يرجى تأكيد الطلب. سأرسل صورة إشعار التحويل عبر واتساب بعد الدفع."
    ].filter(Boolean).join("\n");

    cart = [];
    saveCart();
    renderCart();

    $("customerName").value = "";
    $("customerPhone").value = "";
    $("customerAddress").value = "";
    $("orderNotes").value = "";

    closeCart();

    toast("تم حفظ طلبك بنجاح");

    const whatsappUrl =
      `https://wa.me/${WHATSAPP_SUDAN}?text=${encodeURIComponent(message)}`;

    window.location.href = whatsappUrl;

  } catch (error) {
    console.error("Checkout error:", error);
    toast(error.message || "تعذر إتمام الطلب، حاول مرة أخرى");

  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "تأكيد الطلب عبر واتساب";
    }
  }
}

/* =========================================
   طلب قطعة غير متوفرة
========================================= */

function openRequestPart() {
  const modal = $("requestPartModal");
  if (!modal) return;

  modal.classList.add("show");
  modal.style.display = "flex";

  syncModalBodyClass();
}

function closeRequestPart() {
  const modal = $("requestPartModal");
  if (!modal) return;

  modal.classList.remove("show");
  modal.style.display = "none";

  syncModalBodyClass();
}

function setupRequestPart() {
  $("requestPartOpen")?.addEventListener(
    "click",
    openRequestPart
  );

  $("requestPartClose")?.addEventListener(
    "click",
    closeRequestPart
  );

  $("requestPartForm")?.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();

      const make = $("requestCarMake")?.value.trim();
      const model = $("requestCarModel")?.value.trim();
      const year = $("requestModelYear")?.value.trim();
      const part = $("requestPartName")?.value.trim();
      const name = $("requestCustomerName")?.value.trim();
      const phone = $("requestCustomerPhone")?.value.trim();

      if (!make || !model || !year || !part) {
        toast("يرجى إكمال بيانات السيارة والقطعة");
        return;
      }

      const message = [
        "السلام عليكم، أريد طلب قطعة غير متوفرة في متجر MONKEY",
        "",
        `شركة السيارة: ${make}`,
        `الموديل: ${model}`,
        `سنة الصنع: ${year}`,
        `القطعة المطلوبة: ${part}`,
        name ? `الاسم: ${name}` : "",
        phone ? `رقم الهاتف: ${phone}` : "",
        "",
        "سأرفق صورة القطعة داخل محادثة واتساب."
      ].filter(Boolean).join("\n");

      const url =
        `https://wa.me/${WHATSAPP_SUDAN}?text=${encodeURIComponent(message)}`;

      window.open(url, "_blank", "noopener,noreferrer");

      closeRequestPart();
      $("requestPartForm").reset();
    }
  );
}

/* =========================================
   التنقل السفلي
========================================= */

function setupBottomNavigation() {
  const nav = $("bottomNav");
  if (!nav) return;

  nav.addEventListener("click", (event) => {
    const button = event.target.closest("[data-nav]");
    if (!button) return;

    const destination = button.dataset.nav;

    nav.querySelectorAll("button").forEach((item) => {
      item.classList.toggle("active", item === button);
    });

    if (destination === "home") {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }

    if (destination === "cart") {
      openCart();
    }

    if (destination === "bank") {
      $("bank")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }

    if (destination === "contact") {
      $("about")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  });
}

/* =========================================
   إغلاق النوافذ والأزرار
========================================= */

function setupModalActions() {
  $("cartClose")?.addEventListener("click", closeCart);
  $("detailsClose")?.addEventListener("click", closeDetails);
  $("imageModalClose")?.addEventListener("click", closeImage);

  $("imagePrev")?.addEventListener("click", previousImage);
  $("imageNext")?.addEventListener("click", nextImage);

  $("copyBankAccount")?.addEventListener(
    "click",
    copyBankAccount
  );

  $("checkoutBtn")?.addEventListener(
    "click",
    checkout
  );

  ["cartModal", "detailsModal", "requestPartModal"].forEach((id) => {
    const modal = $(id);

    modal?.addEventListener("click", (event) => {
      if (event.target !== modal) return;

      if (id === "cartModal") closeCart();
      if (id === "detailsModal") closeDetails();
      if (id === "requestPartModal") closeRequestPart();
    });
  });

  $("imageModal")?.addEventListener("click", (event) => {
    if (event.target === $("imageModal")) {
      closeImage();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeCart();
      closeDetails();
      closeImage();
      closeRequestPart();
    }

    if ($("imageModal")?.classList.contains("show")) {
      if (event.key === "ArrowRight") previousImage();
      if (event.key === "ArrowLeft") nextImage();
    }
  });
}

/* =========================================
   تكبير الصور باللمس
========================================= */

function setupImageZoom() {
  const image = $("imageModalImg");
  const viewer = $("imageModal");

  if (!image || !viewer) return;

  let startDistance = 0;
  let currentScale = 1;

  function distance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;

    return Math.sqrt(dx * dx + dy * dy);
  }

  viewer.addEventListener("touchstart", (event) => {
    if (event.touches.length === 2) {
      startDistance = distance(event.touches);
    }
  }, { passive: true });

  viewer.addEventListener("touchmove", (event) => {
    if (event.touches.length === 2 && startDistance > 0) {
      const newDistance = distance(event.touches);

      currentScale *= newDistance / startDistance;

      currentScale = Math.max(
        1,
        Math.min(currentScale, 4)
      );

      image.style.transform = `scale(${currentScale})`;
      startDistance = newDistance;
    }
  }, { passive: true });

  viewer.addEventListener("touchend", () => {
    if (!viewer.classList.contains("show")) {
      currentScale = 1;
    }

    if (image.style.transform === "scale(1)") {
      currentScale = 1;
    }

    startDistance = 0;
  });
}

/* =========================================
   تحميل المنتجات
========================================= */

async function loadProducts() {
  const grid = $("productGrid");

  if (grid) {
    grid.innerHTML = "جاري تحميل المنتجات...";
  }

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("available", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    products = data || [];

    makeFilters();
    render();

  } catch (error) {
    console.error("Products loading error:", error);

    if (grid) {
      grid.innerHTML = `
        <div class="empty-products">
          تعذر تحميل المنتجات حالياً. يرجى المحاولة لاحقاً.
        </div>
      `;
    }
  }
}

/* =========================================
   تشغيل التطبيق
========================================= */

function setupFilters() {
  $("search")?.addEventListener("input", render);

  $("carMakeFilter")?.addEventListener("change", () => {
    makeModels();
    render();
  });

  $("carModelFilter")?.addEventListener("change", render);
  $("conditionFilter")?.addEventListener("change", render);
}

async function initMonkeyApp() {
  setupFilters();
  setupProductActions();
  setupCartActions();
  setupRequestPart();
  setupBottomNavigation();
  setupModalActions();
  setupImageZoom();

  updateCartBadge();
  renderCart();

  await Promise.all([
    loadProducts(),
    loadBankSettings()
  ]);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMonkeyApp);
} else {
  initMonkeyApp();
}
