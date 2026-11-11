
const SUPABASE_URL = "https://imuasdnaomubnlxcjvci.supabase.co";
const SUPABASE_KEY = "sb_publishable_nvxMo7OEi917ycwbfBcf9w_I3NBsNDa";

const $ = id => document.getElementById(id);

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/\s+/g, " ");
}

// شركات السيارات وموديلاتها
// فورد مستبعدة حسب طلبك
const CAR_CATALOG = [
  {name:"Toyota", ar:"تويوتا", models:["Corolla","Camry","Yaris","Hilux","Land Cruiser","Prado","RAV4","Fortuner","Avalon","C-HR","Rush","Avanza","Hiace","Tundra","Highlander","Crown","Raize","Vitz","Echo","4Runner"]},
  {name:"Hyundai", ar:"هيونداي", models:["Accent","Elantra","Sonata","Tucson","Santa Fe","Creta","Venue","Azera","Grandeur","i10","i20","i30","Palisade","Staria","Kona","Verna","Getz","Terracan","H1","Veloster"]},
  {name:"Kia", ar:"كيا", models:["Picanto","Rio","Cerato","Forte","K3","K5","Optima","Cadenza","K8","Sportage","Sorento","Seltos","Sonet","Carnival","Soul","Mohave","Telluride","Stinger"]},
  {name:"Nissan", ar:"نيسان", models:["Sunny","Altima","Maxima","Sentra","Patrol","X-Trail","Rogue","Pathfinder","Juke","Kicks","Murano","Tiida","Versa","Navara","Datsun","Urvan","Armada","Qashqai"]},
  {name:"Mitsubishi", ar:"ميتسوبيشي", models:["Lancer","Pajero","Outlander","ASX","Attrage","Mirage","L200","Montero","Eclipse Cross","Galant","L300","Xpander"]},
  {name:"Honda", ar:"هوندا", models:["Civic","Accord","City","CR-V","HR-V","Pilot","Jazz","Fit","Odyssey","BR-V","Amaze","Crosstour"]},
  {name:"Mazda", ar:"مازدا", models:["Mazda 2","Mazda 3","Mazda 6","CX-3","CX-5","CX-9","CX-30","CX-60","BT-50","323","626"]},
  {name:"Suzuki", ar:"سوزوكي", models:["Swift","Ciaz","Dzire","Baleno","Vitara","Jimny","Ertiga","Alto","APV","SX4","Grand Vitara","Carry"]},
  {name:"Subaru", ar:"سوبارو", models:["Impreza","Legacy","Forester","Outback","XV","Crosstrek","WRX","BRZ"]},
  {name:"Lexus", ar:"لكزس", models:["ES","IS","LS","GS","RX","NX","LX","GX","UX","RC","CT","LC"]},
  {name:"Isuzu", ar:"ايسوزو", models:["D-Max","MU-X","NPR","NQR","Trooper","Rodeo","KB"]},
  {name:"Daihatsu", ar:"دايهاتسو", models:["Terios","Sirion","Mira","Move","Gran Max","Rocky","Charade"]},

  {name:"Mercedes-Benz", ar:"مرسيدس", models:["A-Class","B-Class","C-Class","E-Class","S-Class","CLA","CLS","GLA","GLB","GLC","GLE","GLS","G-Class","Vito","Sprinter"]},
  {name:"BMW", ar:"بي ام دبليو", models:["1 Series","2 Series","3 Series","4 Series","5 Series","6 Series","7 Series","8 Series","X1","X3","X5","X6","X7","Z4","i3","i4","iX"]},
  {name:"Audi", ar:"اودي", models:["A1","A3","A4","A5","A6","A7","A8","Q2","Q3","Q5","Q7","Q8","TT","R8"]},
  {name:"Volkswagen", ar:"فولكس واجن", models:["Golf","Polo","Passat","Jetta","Tiguan","Touareg","Teramont","T-Roc","Beetle","Caddy","Transporter"]},
  {name:"Porsche", ar:"بورش", models:["911","Cayenne","Macan","Panamera","Taycan","Boxster","Cayman"]},
  {name:"Volvo", ar:"فولفو", models:["S60","S90","XC40","XC60","XC90","V40","V60","V90"]},
  {name:"Renault", ar:"رينو", models:["Logan","Symbol","Megane","Duster","Captur","Koleos","Clio","Fluence","Sandero","Kangoo"]},
  {name:"Peugeot", ar:"بيجو", models:["206","207","208","301","308","408","508","2008","3008","5008","Partner"]},
  {name:"Skoda", ar:"سكودا", models:["Octavia","Superb","Fabia","Rapid","Kodiaq","Karoq","Kamiq"]},
  {name:"Fiat", ar:"فيات", models:["500","500X","Panda","Tipo","Doblo","Fiorino","Ducato","Punto"]},
  {name:"Jeep", ar:"جيب", models:["Wrangler","Grand Cherokee","Cherokee","Compass","Renegade","Gladiator"]},
  {name:"Dodge", ar:"دودج", models:["Charger","Challenger","Durango","Journey","Ram"]},
  {name:"Chevrolet", ar:"شفروليه", models:["Spark","Aveo","Cruze","Malibu","Impala","Captiva","Equinox","Tahoe","Suburban","Traverse","Trailblazer","Groove","Silverado","Camaro"]},
  {name:"GMC", ar:"جي ام سي", models:["Yukon","Terrain","Acadia","Sierra","Canyon","Envoy","Savana"]},
  {name:"Cadillac", ar:"كاديلاك", models:["Escalade","XT4","XT5","XT6","CT4","CT5","CTS","ATS","SRX"]},
  {name:"Chrysler", ar:"كرايسلر", models:["300","Pacifica","Voyager","Sebring"]},
  {name:"Land Rover", ar:"لاند روفر", models:["Range Rover","Range Rover Sport","Range Rover Evoque","Discovery","Discovery Sport","Defender","Freelander"]},
  {name:"Jaguar", ar:"جاكوار", models:["XE","XF","XJ","F-Pace","E-Pace","F-Type","I-Pace"]},

  // الشركات الصينية
  {name:"Changan", ar:"شانجان", models:["CS35","CS55","CS75","CS85","CS95","Eado","Alsvin","UNI-T","UNI-K","UNI-V","Hunter"]},
  {name:"Geely", ar:"جيلي", models:["Emgrand","Coolray","Azkarra","Tugella","Monjaro","Okavango","Geometry C","GX3 Pro"]},
  {name:"Chery", ar:"شيري", models:["Tiggo 2","Tiggo 3","Tiggo 4","Tiggo 7","Tiggo 8","Arrizo 5","Arrizo 6","Arrizo 8"]},
  {name:"Haval", ar:"هافال", models:["H2","H6","H9","Jolion","Dargo","F7","F7x","Big Dog"]},
  {name:"Great Wall", ar:"جريت وول", models:["Wingle 5","Wingle 7","Poer","Cannon","Voleex","Hover"]},
  {name:"Jetour", ar:"جيتور", models:["X70","X70 Plus","X90","X90 Plus","Dashing","T2","X50"]},
  {name:"BYD", ar:"بي واي دي", models:["F3","F5","Qin","Song","Tang","Han","Atto 3","Seagull","Destroyer 05","Seal"]},
  {name:"MG", ar:"ام جي", models:["MG 3","MG 5","MG 6","MG 7","ZS","HS","RX5","RX8","GT","One"]},
  {name:"JAC", ar:"جاك", models:["J4","J7","JS3","JS4","JS6","S3","S5","T6","T8","Sunray"]},
  {name:"Dongfeng", ar:"دونغ فينغ", models:["AX7","A30","S30","T5","T5 Evo","Rich","Glory 580","Shine"]},
  {name:"FAW", ar:"فاو", models:["Bestune T33","Bestune T55","Bestune T77","Bestune T99","V5","B30","X40"]},
  {name:"BAIC", ar:"بايك", models:["X25","X35","X55","X7","BJ40","BJ60","U5","D50"]},
  {name:"SAIC", ar:"سايك", models:["Maxus G10","Maxus D90","Maxus T60","Maxus V80"]},
  {name:"Hongqi", ar:"هونشي", models:["H5","H7","H9","HS5","HS7","E-HS9"]},
  {name:"Lynk & Co", ar:"لينك اند كو", models:["01","02","03","05","06","09"]},
  {name:"Zeekr", ar:"زيكر", models:["001","007","009","X","7X"]},
  {name:"Exeed", ar:"اكسيد", models:["LX","TXL","VX","RX"]},
  {name:"Omoda", ar:"اومودا", models:["C5","C7","E5"]},
  {name:"Jaecoo", ar:"جايكو", models:["J5","J7","J8"]},
  {name:"Wuling", ar:"وولينغ", models:["Hongguang","Almaz","Confero","Air EV","Binguo"]},
  {name:"Li Auto", ar:"لي اوتو", models:["L6","L7","L8","L9","Mega"]},
  {name:"NIO", ar:"نيو", models:["ES6","ES7","ES8","EC6","EC7","ET5","ET7"]},
  {name:"XPeng", ar:"اكسبينغ", models:["G3","G6","G9","P5","P7","X9"]}
];

let allProducts = [];
let selectedMake = "";
let selectedModel = "";
let galleryImages = [];
let galleryIndex = 0;
let zoom = 1;
let moveX = 0;
let moveY = 0;
let startX = 0;
let startY = 0;
let startMoveX = 0;
let startMoveY = 0;
let startDistance = 0;
let startZoom = 1;
let touchStartX = 0;

function matchesChoice(value, choice) {
  if (!choice) return true;
  if (!value) return false;

  const normalizedValue = normalizeText(value);
  const normalizedChoices = [
    choice.name,
    choice.ar,
    ...(choice.aliases || [])
  ].map(normalizeText);

  return normalizedChoices.includes(normalizedValue);
}

// إنشاء قائمة شركات السيارات والموديلات
function createCarBrowser() {
  if ($("carBrowser")) return;

  const search = $("search");
  if (!search) {
    console.error("لم يتم العثور على عنصر البحث id=search");
    return;
  }

  const browser = document.createElement("div");
  browser.id = "carBrowser";
  browser.style.cssText = `
    background:#181818;
    border:1px solid #ff9d24;
    border-radius:12px;
    padding:14px;
    margin:12px 0 20px;
    color:white;
  `;

  browser.innerHTML = `
    <div style="color:#ffae42;font-weight:bold;margin-bottom:10px;">
      🚘 اختر شركة السيارة
    </div>

    <select id="carMakeSelect" style="
      width:100%;padding:12px;margin-bottom:10px;
      border:1px solid #ff9d24;border-radius:8px;
      background:#222;color:white;font-size:15px;">
      <option value="">جميع شركات السيارات</option>
      ${CAR_CATALOG.map((car, index) => `
        <option value="${index}">
          ${escapeHTML(car.name)} - ${escapeHTML(car.ar)}
        </option>
      `).join("")}
    </select>

    <select id="carModelSelect" disabled style="
      width:100%;padding:12px;
      border:1px solid #555;border-radius:8px;
      background:#222;color:white;font-size:15px;">
      <option value="">اختر الموديل بعد اختيار الشركة</option>
    </select>

    <button id="clearCarFilter" type="button" style="
      width:100%;padding:10px;margin-top:10px;
      border:0;border-radius:8px;
      background:#ff9d24;color:#111;font-weight:bold;">
      عرض جميع السيارات
    </button>
  `;

  search.insertAdjacentElement("afterend", browser);

  $("carMakeSelect").addEventListener("change", event => {
    const value = event.target.value;
    selectedMake = value === "" ? "" : CAR_CATALOG[Number(value)].name;
    selectedModel = "";

    const modelSelect = $("carModelSelect");
    modelSelect.innerHTML = "";

    if (value === "") {
      modelSelect.disabled = true;
      modelSelect.innerHTML = `<option value="">اختر الشركة أولاً</option>`;
    } else {
      const car = CAR_CATALOG[Number(value)];
      modelSelect.disabled = false;
      modelSelect.innerHTML = `
        <option value="">جميع موديلات ${escapeHTML(car.ar)}</option>
        ${car.models.map(model => `
          <option value="${escapeHTML(model)}">${escapeHTML(model)}</option>
        `).join("")}
      `;
    }

    renderProducts();
  });

  $("carModelSelect").addEventListener("change", event => {
    selectedModel = event.target.value;
    renderProducts();
  });

  $("clearCarFilter").addEventListener("click", () => {
    selectedMake = "";
    selectedModel = "";
    $("carMakeSelect").value = "";
    $("carModelSelect").innerHTML =
      `<option value="">اختر الشركة أولاً</option>`;
    $("carModelSelect").disabled = true;
    renderProducts();
  });

  search.addEventListener("input", renderProducts);
}

// معرض الصور
function createGallery() {
  if ($("imageGallery")) return;

  document.body.insertAdjacentHTML("beforeend", `
    <div id="imageGallery" style="
      display:none;position:fixed;inset:0;z-index:99999;
      background:#080808;color:white;
      align-items:center;justify-content:center;
      flex-direction:column;padding:12px;box-sizing:border-box;">

      <button id="galleryClose" style="
        position:absolute;top:15px;right:15px;
        background:#ff9d24;color:#111;border:0;
        border-radius:50%;width:42px;height:42px;
        font-size:25px;">×</button>

      <div id="galleryCounter" style="margin:55px 0 12px;color:#ffae42;">
        1 / 1
      </div>

      <div id="galleryStage" style="
        width:100%;height:65vh;overflow:hidden;
        display:flex;align-items:center;justify-content:center;
        touch-action:none;position:relative;">

        <img id="galleryImage" style="
          max-width:100%;max-height:100%;
          object-fit:contain;transform-origin:center;
          user-select:none;-webkit-user-drag:none;">
      </div>

      <div style="display:flex;align-items:center;gap:18px;margin:12px;">
        <button id="galleryPrev" style="font-size:25px;">❮</button>
        <button id="galleryNext" style="font-size:25px;">❯</button>
      </div>

      <div id="galleryThumbs" style="
        display:flex;gap:8px;overflow-x:auto;
        max-width:100%;padding:8px;"></div>

      <div style="color:#aaa;font-size:12px;margin-top:8px;">
        كبّر بإصبعين واسحب للتنقل بين الصور
      </div>
    </div>
  `);

  $("galleryClose").onclick = closeGallery;
  $("imageGallery").addEventListener("click", event => {
    if (event.target.id === "imageGallery") closeGallery();
  });

  $("galleryPrev").onclick = () => showGalleryImage(galleryIndex - 1);
  $("galleryNext").onclick = () => showGalleryImage(galleryIndex + 1);

  const stage = $("galleryStage");

  stage.addEventListener("touchstart", event => {
    if (event.touches.length === 2) {
      startDistance = touchDistance(event.touches);
      startZoom = zoom;
    } else if (event.touches.length === 1) {
      touchStartX = event.touches[0].clientX;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      startMoveX = moveX;
      startMoveY = moveY;
    }
  }, {passive:true});

  stage.addEventListener("touchmove", event => {
    if (event.touches.length === 2) {
      event.preventDefault();
      const distance = touchDistance(event.touches);
      zoom = Math.min(4, Math.max(1, startZoom * distance / startDistance));
      updateZoom();
    } else if (event.touches.length === 1 && zoom > 1) {
      event.preventDefault();
      moveX = startMoveX + event.touches[0].clientX - startX;
      moveY = startMoveY + event.touches[0].clientY - startY;
      updateZoom();
    }
  }, {passive:false});

  stage.addEventListener("touchend", event => {
    if (zoom <= 1 && event.changedTouches.length === 1) {
      const difference = event.changedTouches[0].clientX - touchStartX;
      if (Math.abs(difference) > 70) {
        showGalleryImage(galleryIndex + (difference < 0 ? 1 : -1));
      }
    }
  });
}

function openGallery(images, index = 0) {
  galleryImages = images;
  galleryIndex = index;
  createGallery();
  $("imageGallery").style.display = "flex";
  document.body.style.overflow = "hidden";
  showGalleryImage(index);
}

function closeGallery() {
  if (!$("imageGallery")) return;
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
  if (!$("galleryImage")) return;
  $("galleryImage").style.transform =
    `translate(${moveX}px,${moveY}px) scale(${zoom})`;
}

function touchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
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
      style="
        width:55px;height:55px;object-fit:cover;
        border:2px solid ${i === index ? "#ffae42" : "#555"};
        border-radius:6px;flex-shrink:0;">
  `).join("");

  $("galleryThumbs").querySelectorAll("img").forEach(img => {
    img.onclick = () => showGalleryImage(Number(img.dataset.index));
  });

  $("galleryPrev").style.visibility = index === 0 ? "hidden" : "visible";
  $("galleryNext").style.visibility =
    index === galleryImages.length - 1 ? "hidden" : "visible";
}

document.addEventListener("keydown", event => {
  if (!$("imageGallery") || $("imageGallery").style.display === "none") return;

  if (event.key === "Escape") closeGallery();
  if (event.key === "ArrowRight") showGalleryImage(galleryIndex - 1);
  if (event.key === "ArrowLeft") showGalleryImage(galleryIndex + 1);
});

// فلترة المنتجات
function renderProducts() {
  const container = $("products");
  if (!container) return;

  const searchText = normalizeText($("search")?.value || "");

  const filtered = allProducts.filter(product => {
    const searchable = normalizeText([
      product.name,
      product.description,
      product.car_make,
      product.car_model,
      product.model_years
    ].join(" "));

    if (searchText && !searchable.includes(searchText)) return false;

    if (selectedMake) {
      const car = CAR_CATALOG.find(item => item.name === selectedMake);
      if (!matchesChoice(product.car_make, car)) return false;
    }

    if (selectedModel) {
      if (normalizeText(product.car_model) !== normalizeText(selectedModel)) {
        return false;
      }
    }

    return true;
  });

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty" style="padding:20px;text-align:center;">
        🔎 لا توجد منتجات مطابقة لاختيارك حالياً.
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(product => {
    const images = Array.isArray(product.image_urls)
      ? product.image_urls.filter(url =>
          typeof url === "string" && /^https?:\/\//i.test(url))
      : [];

    const imageData = escapeHTML(JSON.stringify(images));

    const carInfo = [
      product.car_make,
      product.car_model,
      product.model_years
    ].filter(Boolean).join(" - ");

    const whatsappText = encodeURIComponent(
      "أرغب في طلب: " + product.name +
      (carInfo ? " - السيارة: " + carInfo : "")
    );

    return `
      <div class="product">
        <div class="product-photo"
             data-images="${imageData}"
             style="position:relative;cursor:zoom-in;">

          ${images.length ? `
            <img src="${escapeHTML(images[0])}"
              alt="${escapeHTML(product.name)}"
              style="width:100%;height:180px;object-fit:contain;">

            ${images.length > 1 ? `
              <span style="
                position:absolute;bottom:8px;right:8px;
                background:#111;color:white;padding:4px 9px;
                border-radius:15px;font-size:12px;">
                ${images.length} صور
              </span>` : ""}
          ` : `
            <div class="placeholder">🔧</div>
          `}
        </div>

        <h3>${escapeHTML(product.name)}</h3>

        <p>${product.condition === "جديد" ? "جديد" : "مستعمل"}</p>

        ${carInfo ? `
          <p style="color:#ffae42;">
            🚘 ${escapeHTML(carInfo)}
          </p>` : ""}

        <p>${escapeHTML(product.description || "")}</p>

        <strong style="color:#ffae42;">
          ${Number(product.price_sdg || 0).toLocaleString("ar")}
          جنيه سوداني
        </strong>

        <p>
          <a target="_blank" rel="noopener"
             href="https://wa.me/249912189332?text=${whatsappText}">
            اطلب عبر واتساب
          </a>
        </p>
      </div>
    `;
  }).join("");

  container.querySelectorAll(".product-photo").forEach(photo => {
    photo.onclick = () => {
      const images = JSON.parse(photo.dataset.images || "[]");
      if (images.length) openGallery(images);
    };
  });
}

// تحميل المنتجات من Supabase
async function loadProducts() {
  const container = $("products");
  if (!container) return;

  container.innerHTML = `
    <div class="empty" style="padding:20px;text-align:center;">
      جاري تحميل المنتجات...
    </div>`;

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=id,name,description,condition,price_sdg,image_urls,available,car_make,car_model,model_years&available=eq.true&order=created_at.desc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    if (!response.ok) {
      throw new Error("خطأ في قاعدة البيانات: " + response.status);
    }

    allProducts = await response.json();

    createCarBrowser();
    renderProducts();

  } catch (error) {
    container.innerHTML = `
      <div class="empty" style="padding:20px;text-align:center;">
        تعذر تحميل المنتجات حاليا. حاول مرة أخرى لاحقاً.
      </div>`;
    console.error("MONKEY:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadProducts);
