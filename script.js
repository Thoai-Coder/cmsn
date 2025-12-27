const subTitle = document.getElementById("subTitle");
const hint = document.getElementById("hint");

const btnNext = document.getElementById("btnNext");
const flameWrap = document.getElementById("flameWrap");

// 6 scenes
const scenes = [
  { id: "scene1Cake" },

  // Scene 2: gom lại (type nhiều dòng)
  { id: "scene2", typeIds: ["s2Title", "s2Date", "s2Age", "s2Note"], buttonText: "Tiếp tục ➜" },

  // Scene 3: typewriter với hiệu ứng đẹp
  { id: "scene3", typeIds: ["s3Text"], buttonText: "Tiếp tục ➜" },

  { id: "scene4" }, // hộp quà 
  { id: "scene5" }, // nhận/không nhận

  // Scene 6: cảm ơn (typewriter)
  { id: "scene6", typeIds: ["s6Title", "s6Line"] },
].map(s => ({ ...s, el: document.getElementById(s.id) }));

const giftBox = document.getElementById("giftBox");
const btnAccept = document.getElementById("btnAccept");
const btnDecline = document.getElementById("btnDecline");
const choiceNote = document.getElementById("choiceNote");

let currentIndex = 0;
let busy = false;

btnNext.addEventListener("click", async () => {
  if (busy) return;

  // Scene 1 -> Scene 2
  if (currentIndex === 0) {
    busy = true;
    btnNext.disabled = true;

    if (flameWrap) flameWrap.style.display = "none";
    if (hint) hint.textContent = "🎈 Phù… nến đã tắt!";
    confettiBoom(55);
    if (subTitle) subTitle.textContent = "Giờ bắt đầu câu chuyện nè ✨";

    await sleep(650);
    busy = false;        // mở khóa để goTo chạy
    await goTo(1);
    return;
  }

  // Scene 2-3: bấm để sang scene tiếp theo
  if (currentIndex >= 1 && currentIndex <= 2) {
    await goTo(currentIndex + 1);
    return;
  }
});

// Scene 4: click hộp quà -> Scene 5
giftBox?.addEventListener("click", () => {
  if (busy) return;
  goTo(4);
});
giftBox?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    giftBox.click();
  }
});

// Scene 5: nhận -> Scene 6
btnAccept?.addEventListener("click", async () => {
  if (busy) return;
  choiceNote.textContent = "";
  confettiBoom(70);
  await goTo(5);
});

// Scene 5: không nhận -> đổi vị trí 2 nút -> tự động nhận
btnDecline?.addEventListener("click", async () => {
  if (busy) return;
  busy = true;
  
  // Đổi vị trí 2 nút với animation
  const btnRow = document.querySelector('.btn-row');
  if (btnRow && btnAccept && btnDecline) {
    // Thêm class để trigger animation
    btnAccept.classList.add('swap-left');    // Nhận di chuyển sang phải
    btnDecline.classList.add('swap-right');  // Không nhận di chuyển sang trái
    
    await sleep(800);
    
    // Swap vị trí trong DOM sau khi animation xong
    if (btnAccept.nextElementSibling === btnDecline) {
      btnRow.insertBefore(btnDecline, btnAccept);
    } else {
      btnRow.insertBefore(btnAccept, btnDecline);
    }
    
    // Remove class animation
    btnAccept.classList.remove('swap-left');
    btnDecline.classList.remove('swap-right');
    
    await sleep(200);
    
    // Tự động click nút "Nhận"
    choiceNote.textContent = "Hehe, bắt buộc phải nhận thôi! 😄";
    await sleep(800);
    
    busy = false;
    btnAccept.click();
  } else {
    busy = false;
  }
});

async function goTo(nextIndex) {
  if (busy) return;
  if (nextIndex < 0 || nextIndex >= scenes.length) return;
  if (nextIndex === currentIndex) return;

  busy = true;

  const from = scenes[currentIndex].el;
  const to = scenes[nextIndex].el;

  // tránh warning aria-hidden khi đang focus
  if (!from || !to) { busy = false; return; }
  if (from.contains(document.activeElement)) document.activeElement.blur();
  // inert chưa được hỗ trợ ở mọi trình duyệt → guard
  if ("inert" in from) from.inert = true;
  if ("inert" in to) to.inert = false;

  // 1) ẩn scene trước
  from.classList.remove("show");
  from.classList.add("hidden");
  from.setAttribute("aria-hidden", "true");

  // 2) đợi để thấy hiệu ứng biến mất
  await sleep(420);

  // 3) hiện scene sau (từ từ)
  to.classList.remove("hidden");
  to.classList.add("show");
  to.setAttribute("aria-hidden", "false");

  // 4) logic khi vào scene
  await onEnter(nextIndex);

  currentIndex = nextIndex;
  busy = false;
}

async function onEnter(i) {
  // mặc định: hiện nút chính
  btnNext.style.display = "block";
  btnNext.disabled = false;

  // đảm bảo ảnh có hiệu ứng load mượt
  initImages();

  // Scene 1 reset
  if (i === 0) {
    btnNext.textContent = "Thổi nến 🎈";
    if (hint) hint.textContent = "";
    if (subTitle) subTitle.textContent = "Nhấn “Thổi nến 🎈” để bắt đầu";
    if (flameWrap) flameWrap.style.display = "";
    return;
  }

  // Scene 4: hộp quà - ẩn nút chính
  if (i === 3) {
    btnNext.style.display = "none";
    if (hint) hint.textContent = "Chạm hộp quà để mở nhé 👇";
    return;
  }

  // Scene 5: lựa chọn - ẩn nút chính
  if (i === 4) {
    btnNext.style.display = "none";
    if (hint) hint.textContent = "Bạn có muốn nhận món quà không?";
    choiceNote.textContent = "";
    return;
  }

  // Scene 6: kết thúc (typewriter)
  if (i === 5) {
    btnNext.style.display = "none";
    if (hint) hint.textContent = "Kết thúc 💖";
    await typeScene(i);
    return;
  }

  // Scene 2-3: typewriter + có nút tiếp tục
  btnNext.textContent = scenes[i].buttonText ?? "Tiếp tục ➜";
  if (hint) hint.textContent = "";
  await typeScene(i);
}

async function typeScene(i) {
  const ids = scenes[i]?.typeIds;
  if (!ids || ids.length === 0) return;

  // Scene 6 không có nút, còn lại thì khóa nút trong lúc gõ
  const lockBtn = (i !== 5);
  if (lockBtn) btnNext.disabled = true;

  // speed (ms/ký tự), gap (nghỉ giữa các dòng)
  await typeSequence(ids, 42, 110);

  if (lockBtn) btnNext.disabled = false;
}

async function typeSequence(ids, speed = 55, gap = 120) {
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;

    // reset state
    el.classList.remove("is-typed", "is-typing", "cursor");
    el.textContent = "";

    await sleep(gap);
    await typeText(el, el.dataset.text ?? "", speed);
  }
}

function typeText(el, text, speed = 60) {
  return new Promise(resolve => {
    const chars = Array.from(text ?? "");
    let i = 0;

    // reset state
    el.classList.remove("is-typed");
    el.classList.add("cursor", "is-typing");
    el.textContent = "";

    const timer = setInterval(() => {
      el.textContent += chars[i] ?? "";
      i++;

      if (i >= chars.length) {
        clearInterval(timer);
        el.classList.remove("cursor", "is-typing");
        el.classList.add("is-typed");
        resolve();
      }
    }, speed);
  });
}

function sleep(ms){
  return new Promise(r => setTimeout(r, ms));
}

function confettiBoom(count = 30){
  for(let i=0;i<count;i++){
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.left = (Math.random() * 100) + "vw";
    c.style.background = `hsl(${Math.random()*360}, 90%, 60%)`;
    c.style.animationDuration = (2.1 + Math.random()*1.2) + "s";
    c.style.transform = `rotate(${Math.random()*360}deg)`;
    document.body.appendChild(c);
    setTimeout(()=> c.remove(), 3500);
  }
}

function initImages() {
  const imgs = Array.from(document.querySelectorAll("img.avatar"));
  imgs.forEach(img => {
    try { img.decoding = "async"; } catch (e) {}

    const markLoaded = () => img.classList.add("is-loaded");

    if (img.complete && img.naturalWidth > 0) {
      markLoaded();
    } else {
      img.addEventListener("load", markLoaded, { once: true });
      img.addEventListener("error", markLoaded, { once: true });
    }
  });
}

function preloadImages() {
  const srcs = [...new Set(Array.from(document.images)
    .map(i => i.getAttribute("src"))
    .filter(Boolean))];

  srcs.forEach(src => {
    const im = new Image();
    im.src = src;
  });
}

// Khi load trang
preloadImages();
initImages();
onEnter(0);
