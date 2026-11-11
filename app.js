
const SUPABASE_URL = "https://imuasdnaomubnlxcjvci.supabase.co";
const SUPABASE_KEY = "sb_publishable_nvxMo7OEi917ycwbfBcf9w_I3NBsNDa";

const $ = id => document.getElementById(id);

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[char]);
}

// ======================================
// شركات السيارات وموديلاتها
// الصيغة: الاسم بالعربية | الاسم بالإنجليزية
// ======================================

const CAR_CATALOG = {
  "تويوتا|Toyota": [
    "كورولا|Corolla", "كامري|Camry", "يارس|Yaris",
    "هايلكس|Hilux", "لاندكروزر|Land Cruiser",
    "راف فور|RAV4", "برادو|Prado", "فورتشنر|Fortuner",
    "أفانزا|Avanza", "إنوفا|Innova", "كراون|Crown",
    "أوربان كروزر|Urban Cruiser", "رايز|Raize",
    "سوبرا|Supra", "سي إتش آر|C-HR"
  ],

  "هيونداي|Hyundai": [
    "أكسنت|Accent", "إلنترا|Elantra", "سوناتا|Sonata",
    "توسان|Tucson", "سانتافي|Santa Fe",
    "أفانتي|Avante", "i10", "i20", "i30",
    "كريتا|Creta", "باليسيد|Palisade",
    "كونا|Kona", "ستاريا|Staria"
  ],

  "كيا|Kia": [
    "ريو|Rio", "سيراتو|Cerato", "أوبتيما|Optima",
    "K5", "سبورتاج|Sportage", "سورينتو|Sorento",
    "بيكانتو|Picanto", "كارينز|Carens",
    "سيلتوس|Seltos", "تيلورايد|Telluride",
    "موهافي|Mohave", "كرنفال|Carnival"
  ],

  "نيسان|Nissan": [
    "صني|Sunny", "ألتيما|Altima", "ماكسيما|Maxima",
    "باترول|Patrol", "إكس تريل|X-Trail",
    "نافارا|Navara", "قشقاي|Qashqai",
    "كيكس|Kicks", "جوك|Juke", "ميكرا|Micra",
    "أرمادا|Armada", "تيدا|Tiida"
  ],

  "ميتسوبيشي|Mitsubishi": [
    "لانسر|Lancer", "باجيرو|Pajero", "L200",
    "أوتلاندر|Outlander", "ASX", "أتراج|Attrage",
    "إكليبس|Eclipse", "إكسباندر|Xpander",
    "مونتيرو|Montero"
  ],

  "هوندا|Honda": [
    "سيفيك|Civic", "أكورد|Accord", "CR-V",
    "HR-V", "بايلوت|Pilot", "سيتي|City",
    "جاز|Jazz", "أوديسي|Odyssey"
  ],

  "مازدا|Mazda": [
    "مازدا 2|Mazda 2", "مازدا 3|Mazda 3",
    "مازدا 6|Mazda 6", "CX-3", "CX-5",
    "CX-9", "CX-30", "BT-50"
  ],

  "سوزوكي|Suzuki": [
    "سويفت|Swift", "ديزاير|Dzire",
    "فيتارا|Vitara", "جيمني|Jimny",
    "بالينو|Baleno", "سياز|Ciaz",
    "إرتيجا|Ertiga", "ألتو|Alto"
  ],

  "سوبارو|Subaru": [
    "إمبريزا|Impreza", "فورستر|Forester",
    "أوتباك|Outback", "ليغاسي|Legacy",
    "كروستريك|Crosstrek", "WRX"
  ],

  "لكزس|Lexus": [
    "ES", "IS", "LS", "GS", "RX",
    "NX", "GX", "LX", "UX", "LC"
  ],

  "إيسوزو|Isuzu": [
    "دي ماكس|D-Max", "MU-X", "تروبر|Trooper",
    "NPR", "NQR"
  ],

  "دايهاتسو|Daihatsu": [
    "تيريوس|Terios", "جران ماكس|Gran Max",
    "ميرا|Mira", "سيريون|Sirion",
    "شاريد|Charade"
  ],

  "مرسيدس بنز|Mercedes-Benz": [
    "الفئة A|A-Class", "الفئة C|C-Class",
    "الفئة E|E-Class", "الفئة S|S-Class",
    "GLA", "GLC", "GLE", "GLS", "G-Class",
    "سبرينتر|Sprinter", "فيتو|Vito"
  ],

  "BMW": [
    "الفئة 1|1 Series", "الفئة 3|3 Series",
    "الفئة 5|5 Series", "الفئة 7|7 Series",
    "X1", "X3", "X5", "X6", "X7", "Z4"
  ],

  "أودي|Audi": [
    "A1", "A3", "A4", "A5", "A6", "A7",
    "A8", "Q3", "Q5", "Q7", "Q8", "e-tron"
  ],

  "فولكس فاجن|Volkswagen": [
    "جولف|Golf", "باسات|Passat", "جيتا|Jetta",
    "تيغوان|Tiguan", "طوارق|Touareg",
    "بولو|Polo", "تيرامونت|Teramont",
    "أطلس|Atlas"
  ],

  "بورش|Porsche": [
    "كايين|Cayenne", "ماكان|Macan",
    "باناميرا|Panamera", "911",
    "تايكان|Taycan"
  ],

  "فولفو|Volvo": [
    "XC40", "XC60", "XC90", "S60", "S90",
    "V60", "V90"
  ],

  "رينو|Renault": [
    "لوجان|Logan", "ميجان|Megane",
    "داستر|Duster", "كوليوس|Koleos",
    "كابتشر|Captur", "سانديرو|Sandero",
    "كادجار|Kadjar"
  ],

  "بيجو|Peugeot": [
    "208", "301", "308", "408", "508",
    "2008", "3008", "5008", "بارتنر|Partner"
  ],

  "سكودا|Skoda": [
    "أوكتافيا|Octavia", "سوبيرب|Superb",
    "كودياك|Kodiaq", "كاروك|Karoq",
    "كاميك|Kamiq", "فابيا|Fabia"
  ],

  "فيات|Fiat": [
    "500", "تيبو|Tipo", "باندا|Panda",
    "دوبلو|Doblo", "فيات 500X|500X"
  ],

  "جيب|Jeep": [
    "رانجلر|Wrangler", "جراند شيروكي|Grand Cherokee",
    "شيروكي|Cherokee", "كومباس|Compass",
    "ريكون|Recon", "رينيجيد|Renegade"
  ],

  "دودج|Dodge": [
    "تشارجر|Charger", "تشالنجر|Challenger",
    "دورانجو|Durango", "كارافان|Caravan"
  ],

  "شيفروليه|Chevrolet": [
    "كروز|Cruze", "ماليبو|Malibu", "تاهو|Tahoe",
    "سوبربان|Suburban", "كابتيفا|Captiva",
    "أفيو|Aveo", "سيلفرادو|Silverado",
    "ترافرس|Traverse", "إكوينوكس|Equinox",
    "سبارك|Spark", "جروف|Groove"
  ],

  "GMC": [
    "يوكون|Yukon", "أكاديا|Acadia",
    "تيرين|Terrain", "سييرا|Sierra",
    "كانين|Canyon", "سافانا|Savana"
  ],

  "كاديلاك|Cadillac": [
    "إسكاليد|Escalade", "XT4", "XT5",
    "XT6", "CT4", "CT5", "CT6"
  ],

  "كرايسلر|Chrysler": [
    "300", "باسيفيكا|Pacifica",
    "فوياجر|Voyager"
  ],

  "لاند روفر|Land Rover": [
    "رينج روفر|Range Rover",
    "ديفندر|Defender", "ديسكفري|Discovery",
    "إيفوك|Evoque", "ديسكفري سبورت|Discovery Sport"
  ],

  "جاكوار|Jaguar": [
    "XE", "XF", "XJ", "F-Pace",
    "E-Pace", "F-Type"
  ],

  // الشركات الصينية

  "شانجان|Changan": [
    "CS35", "CS55", "CS75", "CS85", "CS95",
    "إيدو|Eado", "ألسفن|Alsvin",
    "هنتر|Hunter", "يوني تي|UNI-T",
    "يوني كي|UNI-K", "يوني في|UNI-V"
  ],

  "جيلي|Geely": [
    "إمجراند|Emgrand", "كولراي|Coolray",
    "أوكافانغو|Okavango", "أزكارا|Azkarra",
    "مونجارو|Monjaro", "سيتي راي|Cityray",
    "بريفيس|Preface", "بينراي|Binray"
  ],

  "شيري|Chery": [
    "أريزو 5|Arrizo 5", "أريزو 6|Arrizo 6",
    "تيجو 2|Tiggo 2", "تيجو 4|Tiggo 4",
    "تيجو 7|Tiggo 7", "تيجو 8|Tiggo 8",
    "تيجو 9|Tiggo 9", "أومودا 5|Omoda 5"
  ],

  "هافال|Haval": [
    "H6", "H9", "جوليان|Jolion",
    "دارجو|Dargo", "جوليان برو|Jolion Pro",
    "H2", "H4", "H5"
  ],

  "جريت وول|Great Wall": [
    "وينجل|Wingle", "بوير|Poer",
    "تانك 300|Tank 300", "تانك 500|Tank 500",
    "كافو|Cannon"
  ],

  "جيتور|Jetour": [
    "X70", "X70 Plus", "X90",
    "X90 Plus", "داشينغ|Dashing",
    "T2", "شانهاي|Shanhai"
  ],

  "BYD": [
    "F3", "سونغ|Song", "كين|Qin",
    "هان|Han", "تانغ|Tang", "يوان|Yuan",
    "دولفين|Dolphin", "سيل|Seal",
    "أتو 3|Atto 3", "سيليون|Sealion"
  ],

  "MG": [
    "MG 3", "MG 5", "MG 6", "MG 7",
    "MG ZS", "MG HS", "MG RX5",
    "MG RX8", "MG One", "MG GT"
  ],

  "جاك|JAC": [
    "J4", "J7", "JS2", "JS3", "JS4",
    "JS6", "S3", "S4", "T8", "T9"
  ],

  "دونغ فينغ|Dongfeng": [
    "AX7", "AX4", "فورثينغ|Forthing",
    "إيولوس|Aeolus", "نانوبوكس|Nano Box"
  ],

  "فاو|FAW": [
    "بستون T77|Bestune T77",
    "بستون T99|Bestune T99",
    "بستون B70|Bestune B70",
    "V5", "X40", "X80"
  ],

  "بايك|BAIC": [
    "X35", "X55", "X7", "BJ40",
    "BJ60", "EU5", "U5"
  ],

  "سايك|SAIC": [
    "رووي|Roewe", "ماكسوس|Maxus",
    "داتشانغ|Dachang", "دي 90|D90"
  ],

  "هونشي|Hongqi": [
    "H5", "H6", "H9", "HS3",
    "HS5", "HS7", "E-HS9"
  ],

  "لينك آند كو|Lynk & Co": [
    "01", "02", "03", "05",
    "06", "08", "09"
  ],

  "زيكر|Zeekr": [
    "001", "007", "009", "X", "7X"
  ],

  "إكسيد|Exeed": [
    "TXL", "VX", "LX", "RX",
    "ستيرّا|Sterra"
  ],

  "أومودا|Omoda": [
    "C5", "C7", "E5"
  ],

  "جايكو|Jaecoo": [
    "J5", "J7", "J8"
  ],

  "وولينغ|Wuling": [
    "مينيفان|Mini EV", "إيريف|Air EV",
    "ألفاز|Almaz", "كونفيرو|Confero",
    "كورتيز|Cortez"
  ],

  "لي أوتو|Li Auto": [
    "L6", "L7", "L8", "L9", "ميجا|Mega"
  ],

  "نيو|NIO": [
    "ES6", "ES8", "EC6", "ET5",
    "ET7", "EL6", "EL7"
  ],

  "إكس بنغ|XPeng": [
    "G3", "G6", "G9", "P5", "P7",
    "X9", "MONA M03"
  ]
};

// ======================================
// أدوات مطابقة أسماء الشركات والموديلات
// ======================================

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ");
}

function aliases(value) {
  return String(value ?? "")
    .split("|")
    .map(normalizeText)
    .filter(Boolean);
}

function matchesChoice(value, choice) {
  const actual = normalizeText(value);
  return !!actual && aliases(choice).includes(actual);
}

const carMakes = Object.keys(CAR_CATALOG);

let selectedMake = "";
let selectedModel = "";
let allProducts = [];

// ======================================
// إضافة واجهة اختيار السيارات تلقائياً
// ======================================

function createCarBrowser() {
  if ($("carBrowser")) return;

  const search = $("search");
  if (!search) return;

  const style = document.createElement("style");

  style.textContent = `
    #carBrowser {
      width: 92%;
      max-width: 850px;
      margin: 20px auto 0;
      text-align: right;
      direction: rtl;
    }

    #carBrowser .car-label {
      color: #ffae42;
      font-size: 15px;
      font-weight: bold;
      margin: 14px 0 10px;
    }

    #carBrowser .car-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      max-height: 190px;
      overflow-y: auto;
      padding: 3px 2px 10px;
    }

    #carBrowser .car-chip {
      background: #222;
      color: #eee;
      border: 1px solid #555;
      border-radius: 20px;
      padding: 9px 13px;
      font-size: 13px;
      cursor: pointer;
    }

    #carBrowser .car-chip.active {
      background: #ff8500;
      color: #111;
      border-color: #ff8500;
      font-weight: bold;
    }

    #carBrowser .car-hint {
      color: #aaa;
      font-size: 12px;
      margin-top: 8px;
      line-height: 1.8;
    }

    #carBrowser .car-reset {
      color: #ffae42;
      background: transparent;
      border: 1px solid #ff8500;
      border-radius: 18px;
      padding: 7px 12px;
      margin: 8px 0;
      cursor: pointer;
    }

    @media(max-width:480px) {
      #carBrowser .car-chips {
        max-height: 160px;
      }
    }
  `;

  document.head.appendChild(style);

  const browser = document.createElement("div");
  browser.id = "carBrowser";

  browser.innerHTML = `
    <div class="car-label">🚘 اختر شركة السيارة</div>
    <div id="carMakes" class="car-chips"></div>

    <div id="carModelsWrap" hidden>
      <div class="car-label">🚗 اختر موديل السيارة</div>
      <div id="carModels" class="car-chips"></div>
    </div>

    <div id="carSelection"></div>

    <div class="car-hint">
      يمكنك البحث باسم القطعة أو رقمها، أو اختيار شركة السيارة وموديلها.
    </div>
  `;

  search.insertAdjacentElement("afterend", browser);

  renderCarMakes();

  search.addEventListener("input", filterProducts);
}

function renderCarMakes() {
  const container = $("carMakes");
  if (!container) return;

  const options = ["كل الشركات", ...carMakes];

  container.innerHTML = options.map((make, index) => {
    const active = index === 0
      ? !selectedMake
      : selectedMake === make;

    const label = index === 0
      ? "كل الشركات"
      : make.split("|")[0];

    return `
      <button type="button"
        class="car-chip ${active ? "active" : ""}"
        data-make="${index === 0 ? "" : escapeHTML(make)}">
        ${escapeHTML(label)}
      </button>
    `;
  }).join("");

  container.querySelectorAll("[data-make]").forEach(button => {
    button.addEventListener("click", () => {
      selectedMake = button.dataset.make;
      selectedModel = "";

      renderCarMakes();
      renderCarModels();
      filterProducts();
    });
  });
}

function renderCarModels() {
  const wrap = $("carModelsWrap");
  const container = $("carModels");

  if (!wrap || !container) return;

  if (!selectedMake) {
    wrap.hidden = true;
    return;
  }

  wrap.hidden = false;

  const models = CAR_CATALOG[selectedMake] || [];
  const options = ["كل الموديلات", ...models];

  container.innerHTML = options.map((model, index) => {
    const active = index === 0
      ? !selectedModel
      : selectedModel === model;

    const label = index === 0
      ? "كل الموديلات"
      : model.split("|")[0];

    return `
      <button type="button"
        class="car-chip ${active ? "active" : ""}"
        data-model="${index === 0 ? "" : escapeHTML(model)}">
        ${escapeHTML(label)}
      </button>
    `;
  }).join("");

  container.querySelectorAll("[data-model]").forEach(button => {
    button.addEventListener("click", () => {
      selectedModel = button.dataset.model;

      renderCarModels();
      filterProducts();
    });
  });
}

function filterProducts() {
  const searchText = normalizeText($("search")?.value || "");

  const filtered = allProducts.filter(product => {
    const searchable = normalizeText([
      product.name,
      product.description,
      product.car_make,
      product.car_model,
      product.model_years
    ].join(" "));

    const searchMatch =
      !searchText || searchable.includes(searchText);

    const makeMatch =
      !selectedMake ||
      matchesChoice(product.car_make, selectedMake);

    const modelMatch =
      !selectedModel ||
      matchesChoice(product.car_model, selectedModel);

    return searchMatch && makeMatch && modelMatch;
  });

  renderProducts(filtered);
}

// ======================================
// معرض الصور المكبرة
// ======================================

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

  $("galleryPrev").onclick = () =>
    showGalleryImage(galleryIndex - 1);

  $("galleryNext").onclick = () =>
    showGalleryImage(galleryIndex + 1);
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
    img.onclick = () =>
      showGalleryImage(Number(img.dataset.index));
  });

  $("galleryPrev").style.visibility =
    index === 0 ? "hidden" : "visible";

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
    const difference =
      e.changedTouches[0].clientX - touchStartX;

    if (Math.abs(difference) > 70) {
      showGalleryImage(
        galleryIndex + (difference < 0 ? 1 : -1)
      );
    }
  }
});

document.addEventListener("keydown", e => {
  if (!$("imageGallery") ||
      $("imageGallery").style.display === "none") return;

  if (e.key === "Escape") closeGallery();

  if (e.key === "ArrowRight")
    showGalleryImage(galleryIndex - 1);

  if (e.key === "ArrowLeft")
    showGalleryImage(galleryIndex + 1);
});

// ======================================
// عرض المنتجات
// ======================================

function renderProducts(products) {
  const container = $("products");
  if (!container) return;

  if (!products.length) {
    container.innerHTML = `
      <div class="empty">
        🔍 لا توجد قطع غيار مطابقة لاختيارك.
        <br>
        جرّب شركة أو موديل آخر.
      </div>`;
    return;
  }

  container.innerHTML = products.map(product => {
    const images = Array.isArray(product.image_urls)
      ? product.image_urls.filter(url =>
          typeof url === "string" &&
          /^https?:\/\//i.test(url))
      : [];

    const imageList = JSON.stringify(images)
      .replace(/&/g, "&amp;")
      .replace(/'/g, "&#39;");

    const carDetails = [
      product.car_make,
      product.car_model,
      product.model_years
    ].filter(Boolean).join(" - ");

    return `
      <div class="product"
        data-make="${escapeHTML(product.car_make || "")}"
        data-model="${escapeHTML(product.car_model || "")}">

        <div style="position:relative;cursor:zoom-in;"
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

        <p>
          ${product.condition === "new" ? "جديد" : "مستعمل"}
        </p>

        <p>${escapeHTML(product.description || "")}</p>

        ${carDetails ? `
          <p style="color:#ffae42">
            🚘 ${escapeHTML(carDetails)}
          </p>
        ` : ""}

        <strong style="color:#ffae42">
          ${Number(product.price_sdg).toLocaleString("ar")}
          جنيه سوداني
        </strong>

        <p>
          <a href="https://wa.me/249912189332?text=${encodeURIComponent(
            "أرغب في طلب: " + product.name +
            (carDetails ? " - " + carDetails : "")
          )}">
            اطلب عبر واتساب
          </a>
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
}

// ======================================
// تحميل المنتجات من Supabase
// ======================================

async function loadProducts() {
  const container = $("products");

  createCarBrowser();

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
      const errorText = await response.text();
      throw new Error(errorText || "Database error");
    }

    allProducts = await response.json();

    if (!allProducts.length) {
      container.innerHTML = `
        <div class="empty">
          🔧 لا توجد منتجات حالياً
          <br>
          ستتم إضافة المنتجات قريباً.
        </div>`;
      return;
    }

    renderCarMakes();
    renderCarModels();
    filterProducts();

  } catch (error) {
    container.innerHTML = `
      <div class="empty">
        تعذر تحميل المنتجات حالياً.
        <br>
        حاول مرة أخرى لاحقاً.
      </div>`;

    console.error("MONKEY products error:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadProducts);
