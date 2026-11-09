
const SUPABASE_URL = "https://imuasdnaomubnlxcjvci.supabase.co";
const SUPABASE_KEY = "sb_publishable_nvxMo7OEi917ycwbfBcf9w_I3NBsNDa";

const $ = id => document.getElementById(id);

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[char]);
}

// معرض الصور المكبرة
function createGallery() {
  if ($("imageGallery")) return;

  document.body.insertAdjacentHTML("beforeend", `
    <div id="imageGallery" style="
      display:none; position:fixed; inset:0; z-index:99999;
      background:#080808; color:white; align-items:center;
      justify-content:center; flex-direction:column;
      padding:12px; box-sizing:border-box;">

      <button id="galleryClose" style="
        position:absolute; top:15px; right:15px; z-index:5;
        background:#ff9d24; color:#111; border:0;
        border-radius:50%; width:42px; height:42px;
        font-size:25px;">×</button>

      <div id="galleryCounter" style="
        margin:55px 0 12px; color:#ffae42;">1 / 1</div>

      <div id="galleryStage" style="
        width:100%; height:65vh; overflow:hidden;
        display:flex; align-items:center; justify-content:center;
        touch-action:none; position:relative;">

        <img id="galleryImage" style="
          max-width:100%; max-height:100%;
          object-fit:contain; transform-origin:center;
          user-select:none; -webkit-user-drag:none;">
      </div>

      <div style="display:flex; align-items:center; gap:18px; margin:12px;">
        <button id="galleryPrev" style="font-size:25px;">❮</button>
        <button id="galleryNext" style="font-size:25px;">❯</button>
      </div>

      <div id="galleryThumbs" style="
        display:flex; gap:8px; overflow-x:auto;
        max-width:100%; padding:8px;"></div>

      <div style="color:#aaa; font-size:12px; margin-top:8px;">
        كبّر بإصبعين واسحب للتنقل بين الصور
      </div>
    </div>
  `);

  $("galleryClose").onclick = closeGallery;
  $("imageGallery").addEventListener("click", e => {
    if (e.target.id === "imageGallery") closeGallery();
  });

  $("galleryPrev").onclick = () => showGalleryImage(galleryIndex - 1);
  $("galleryNext").onclick = () => showGalleryImage(galleryIndex + 1);
}

let galleryImages = [];
let galleryIndex = 0;
let zoom = 1, moveX = 0, moveY = 0;
let startX = 0, startY = 0;
let startDistance = 0, startZoom = 1;
let startMoveX = 0, startMoveY = 0;
let touchStartX = 0;

function openGallery(images, index = 0) {
  galleryImages = images;
  galleryIndex = index;
  createGallery();
  $("imageGallery").style.display = "flex";
  document.body.style.overflow = "hidden";
  showGalleryImage(index);
}

function closeGallery() {
  $("imageGallery").style.display = "none";
  document.body.style.overflow = "";
  resetZoom();
}

function resetZoom() {
  zoom = 1;
  moveX = 0;
  moveY = 0;
  updateZoom();
}

function updateZoom() {
  $("galleryImage").style.transform =
    `translate(${moveX}px, ${moveY}px) scale(${zoom})`;
}

function showGalleryImage(index) {
  if (index < 0 || index >= galleryImages.length) return;

  galleryIndex = index;
  resetZoom();

  $("galleryImage").src = galleryImages[index];
  $("galleryCounter").textContent =
    `${index + 1} / ${galleryImages.length}`;

  $("galleryThumbs").innerHTML = galleryImages.map((url, i) => `
    <img src="${escapeHTML(url)}"
      data-index="${i}"
      style="width:55px;height:55px;object-fit:cover;
      border:2px solid ${i === index ? "#ffae42" : "#555"};
      border-radius:6px; flex-shrink:0;">
  `).join("");

  $("galleryThumbs").querySelectorAll("img").forEach(img => {
    img.onclick = () => showGalleryImage(Number(img.dataset.index));
  });

  $("galleryPrev").style.visibility = index === 0 ? "hidden" : "visible";
  $("galleryNext").style.visibility =
    index === galleryImages.length - 1 ? "hidden" : "visible";
}

// التكبير والتصغير والسحب بالإصبع
function touchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

document.addEventListener("touchstart", e => {
  if (!$("imageGallery") ||
      $("imageGallery").style.display === "none") return;

  if (e.touches.length === 2) {
    startDistance = touchDistance(e.touches);
    startZoom = zoom;
  } else if (e.touches.length === 1) {
    touchStartX = e.touches[0].clientX;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startMoveX = moveX;
    startMoveY = moveY;
  }
}, { passive: true });

document.addEventListener("touchmove", e => {
  if (!$("imageGallery") ||
      $("imageGallery").style.display === "none") return;

  if (e.touches.length === 2) {
    e.preventDefault();
    const distance = touchDistance(e.touches);
    zoom = Math.min(4, Math.max(1,
      startZoom * distance / startDistance));
    updateZoom();
  } else if (e.touches.length === 1 && zoom > 1) {
    e.preventDefault();
    moveX = startMoveX + e.touches[0].clientX - startX;
    moveY = startMoveY + e.touches[0].clientY - startY;
    updateZoom();
  }
}, { passive: false });

document.addEventListener("touchend", e => {
  if (!$("imageGallery") ||
      $("imageGallery").style.display === "none") return;

  if (zoom <= 1 && e.changedTouches.length === 1) {
    const difference = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(difference) > 70) {
      showGalleryImage(galleryIndex + (difference < 0 ? 1 : -1));
    }
  }
});

document.addEventListener("keydown", e => {
  if (!$("imageGallery") ||
      $("imageGallery").style.display === "none") return;

  if (e.key === "Escape") closeGallery();
  if (e.key === "ArrowRight") showGalleryImage(galleryIndex - 1);
  if (e.key === "ArrowLeft") showGalleryImage(galleryIndex + 1);
});

async function loadProducts() {
  const container = $("products");

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=id,name,description,condition,price_sdg,image_urls,available&available=eq.true&order=created_at.desc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    if (!response.ok) throw new Error("Database error");

    const products = await response.json();

    if (!products.length) {
      container.innerHTML = `
        <div class="empty">
          🔧 لا توجد منتجات حالياً<br>
          ستتم إضافة المنتجات قريباً.
        </div>`;
      return;
    }

    container.innerHTML = products.map(product => {
      const images = Array.isArray(product.image_urls)
        ? product.image_urls.filter(url =>
            typeof url === "string" && /^https?:\/\//i.test(url))
        : [];

      const imageList = JSON.stringify(images)
        .replace(/&/g, "&amp;")
        .replace(/'/g, "&#39;");

      return `
        <div class="product">
          <div style="position:relative; cursor:zoom-in;"
               class="product-photo"
               data-images='${imageList}'>

            ${images.length ? `
              <img src="${escapeHTML(images[0])}"
                alt="${escapeHTML(product.name)}"
                style="width:100%;height:180px;object-fit:contain;">
              ${images.length > 1 ? `
                <span style="
                  position:absolute;bottom:8px;right:8px;
                  background:#111;color:white;padding:4px 9px;
                  border-radius:15px;font-size:12px;">
                  1 / ${images.length} صور
                </span>` : ""}
            ` : `
              <div class="placeholder">🔧</div>
            `}
          </div>

          <h3>${escapeHTML(product.name)}</h3>
          <p>${product.condition === "new" ? "جديد" : "مستعمل"}</p>
          <p>${escapeHTML(product.description || "")}</p>

          <strong style="color:#ffae42">
            ${Number(product.price_sdg).toLocaleString("ar")}
            جنيه سوداني
          </strong>

          <p>
            <a href="https://wa.me/249912189332?text=${encodeURIComponent(
              "أرغب في طلب: " + product.name
            )}">اطلب عبر واتساب</a>
          </p>
        </div>
      `;
    }).join("");

    container.querySelectorAll(".product-photo").forEach(photo => {
      photo.onclick = () => {
        const images = JSON.parse(photo.dataset.images);
        if (images.length) openGallery(images);
      };
    });

  } catch (error) {
    container.innerHTML = `
      <div class="empty">
        تعذر تحميل المنتجات حالياً. حاول مرة أخرى لاحقاً.
      </div>`;
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", loadProducts);

