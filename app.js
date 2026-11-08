
const SUPABASE_URL = "https://imuasdnaomubnlxcjvci.supabase.co";

const SUPABASE_KEY = "sb_publishable_nvxMo7OEi917ycwbfBcf9w_I3NBsNDa";

async function loadProducts() {
  const container = document.getElementById("products");

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

    container.innerHTML = products.map(product => `
      <div class="product">
        ${
          product.image_urls && product.image_urls.length
          ? `<img src="${product.image_urls[0]}"
               alt="صورة المنتج"
               style="width:100%;height:130px;object-fit:contain">`
          : `<div class="placeholder">🔧</div>`
        }
        <h3>${escapeHTML(product.name)}</h3>
        <p>${product.condition === "new" ? "جديد" : "مستعمل"}</p>
        <p>${escapeHTML(product.description || "")}</p>
        <strong style="color:#ffae42">
          ${Number(product.price_sdg).toLocaleString("ar")} جنيه سوداني
        </strong>
        <p>
          <a href="https://wa.me/249912189332?text=${encodeURIComponent(
            "أرغب في طلب: " + product.name
          )}">اطلب عبر واتساب</a>
        </p>
      </div>
    `).join("");

  } catch (error) {
    container.innerHTML = `
      <div class="empty">
        تعذر تحميل المنتجات حالياً. حاول مرة أخرى لاحقاً.
      </div>`;
    console.error(error);
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

document.addEventListener("DOMContentLoaded", loadProducts);
