/* ---------- Typing effect ---------- */
const words = [
    "Gameplay Programmer",
    "Unity Developer",
    "Unreal Engine Developer",
    "C# & C++ Programmer"
];

let wordIndex = 0;
let charIndex = 0;

const typingElement = document.getElementById("typing");

function type(){
    if(!typingElement) return;

    if(charIndex < words[wordIndex].length){
        typingElement.textContent += words[wordIndex].charAt(charIndex);
        charIndex++;
        setTimeout(type, 80);
    } else {
        setTimeout(erase, 1500);
    }
}

function erase(){
    if(charIndex > 0){
        typingElement.textContent = words[wordIndex].substring(0, charIndex - 1);
        charIndex--;
        setTimeout(erase, 40);
    } else {
        wordIndex = (wordIndex + 1) % words.length;
        setTimeout(type, 300);
    }
}

type();

/* ---------- Scroll state: ember -> forest ---------- */
/* Writes --p (0..1) on <html>. CSS uses it to crossfade the background,
   drift the accent colour and grow the progress bar. The particle field
   reads scrollP directly. */
const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

let scrollP = 0;
let ticking = false;

const progressBar = document.createElement("div");
progressBar.className = "scroll-progress";
progressBar.setAttribute("aria-hidden", "true");
document.body.prepend(progressBar);

function updateScroll(){
    const max = Math.max(1, root.scrollHeight - window.innerHeight);
    scrollP = Math.min(1, Math.max(0, window.scrollY / max));
    root.style.setProperty("--p", scrollP.toFixed(4));
    root.style.setProperty("--pp", (scrollP * 100).toFixed(2) + "%");
    root.style.setProperty("--ip", ((1 - scrollP) * 100).toFixed(2) + "%");
    root.style.setProperty("--scroll-position", window.scrollY);
    ticking = false;
}

window.addEventListener("scroll", () => {
    if(!ticking){
        ticking = true;
        window.requestAnimationFrame(updateScroll);
    }
}, { passive: true });
window.addEventListener("resize", updateScroll);
updateScroll();

/* ---------- Ember + firefly field ---------- */
/* Near the top of the page the particles are embers that rise.
   Further down they turn into fireflies that wander.
   They are curious about the cursor from a distance, shy up close,
   parallax with scroll, and a click throws a burst of sparks. */
(function(){
    if(reduceMotion) return;

    const canvas = document.createElement("canvas");
    canvas.className = "fx-canvas";
    canvas.setAttribute("aria-hidden", "true");
    document.body.prepend(canvas);
    const ctx = canvas.getContext("2d");
    if(!ctx) return;

    function makeSprite(core, halo, outer){
        const s = 64;
        const c = document.createElement("canvas");
        c.width = c.height = s;
        const g = c.getContext("2d");
        const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
        grad.addColorStop(0, core);
        grad.addColorStop(.25, halo);
        grad.addColorStop(.6, outer);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = grad;
        g.fillRect(0, 0, s, s);
        return c;
    }

    /* palette-only colours: #cdd480 core, #b89e42 / #854a16 for embers,
       #7bb34a / #208621 for fireflies */
    const emberSprite = makeSprite("rgba(205,212,128,1)", "rgba(184,158,66,.55)", "rgba(133,74,22,.18)");
    const flySprite   = makeSprite("rgba(205,212,128,1)", "rgba(123,179,74,.55)", "rgba(32,134,33,.18)");

    const rand = (a, b) => a + Math.random() * (b - a);
    let W = 0, H = 0;
    let flies = [];
    let sparks = [];
    let mx = -9999, my = -9999;
    let lastY = window.scrollY;

    function makeFly(){
        return {
            x: rand(0, W), y: rand(0, H),
            vx: rand(-.2, .2), vy: rand(-.2, .2),
            r: rand(.8, 2.2),
            depth: rand(.3, 1),
            phase: rand(0, 6.28),
            rate: rand(.6, 1.6)
        };
    }

    function resize(){
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const target = Math.round(Math.min(70, Math.max(22, (W * H) / 26000)));
        while(flies.length < target) flies.push(makeFly());
        flies.length = target;
    }

    function burst(x, y){
        for(let i = 0; i < 16; i++){
            const a = rand(0, Math.PI * 2);
            const s = rand(.8, 3.2);
            sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: rand(.8, 1.8), life: 1 });
        }
        if(sparks.length > 160) sparks.splice(0, sparks.length - 160);
    }

    function frame(now){
        const t = now / 1000;
        const sy = window.scrollY;
        const dScroll = sy - lastY;
        lastY = sy;

        const emberA = 1 - scrollP;
        const flyA = scrollP;

        ctx.clearRect(0, 0, W, H);
        ctx.globalCompositeOperation = "lighter";

        for(const f of flies){
            f.vx += (Math.random() - .5) * .03;
            f.vy += (Math.random() - .5) * .03 - emberA * .004; /* embers drift up */

            const dx = mx - f.x, dy = my - f.y, d2 = dx * dx + dy * dy;
            if(d2 < 220 * 220){
                const d = Math.sqrt(d2) || 1;
                const k = (d > 80 ? .02 : -.06) * (1 - d / 220);
                f.vx += (dx / d) * k;
                f.vy += (dy / d) * k;
            }

            f.vx *= .985;
            f.vy *= .985;
            const sp = Math.hypot(f.vx, f.vy);
            if(sp > .7){ f.vx *= .7 / sp; f.vy *= .7 / sp; }

            f.x += f.vx;
            f.y += f.vy - dScroll * .3 * f.depth;

            if(f.x < -20) f.x = W + 20; else if(f.x > W + 20) f.x = -20;
            if(f.y < -20) f.y = H + 20; else if(f.y > H + 20) f.y = -20;

            const tw = .5 + .5 * Math.sin(t * f.rate * 2 + f.phase);
            const alpha = .35 + .65 * tw;
            const size = f.r * 9 * (.8 + .4 * tw);

            if(emberA > .02){
                ctx.globalAlpha = alpha * emberA * .9;
                ctx.drawImage(emberSprite, f.x - size / 2, f.y - size / 2, size, size);
            }
            if(flyA > .02){
                ctx.globalAlpha = alpha * flyA * .9;
                ctx.drawImage(flySprite, f.x - size / 2, f.y - size / 2, size, size);
            }
        }

        const sparkSprite = scrollP > .5 ? flySprite : emberSprite;
        for(let i = sparks.length - 1; i >= 0; i--){
            const s = sparks[i];
            s.life -= .02;
            if(s.life <= 0){ sparks.splice(i, 1); continue; }
            s.vx *= .98;
            s.vy = s.vy * .98 - .012;
            s.x += s.vx;
            s.y += s.vy;
            const size = s.r * 10 * s.life + 2;
            ctx.globalAlpha = s.life;
            ctx.drawImage(sparkSprite, s.x - size / 2, s.y - size / 2, size, size);
        }

        ctx.globalAlpha = 1;
        window.requestAnimationFrame(frame);
    }

    window.addEventListener("pointermove", (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    window.addEventListener("pointerup", (e) => { if(e.pointerType !== "mouse"){ mx = my = -9999; } });
    window.addEventListener("pointerdown", (e) => burst(e.clientX, e.clientY));
    document.addEventListener("mouseleave", () => { mx = my = -9999; });
    window.addEventListener("resize", resize);

    resize();
    window.requestAnimationFrame(frame);
})();

/* ---------- Cursor ring, card spotlight, project tilt, magnetic buttons ---------- */
const SPOT_SELECTOR = ".card, .project, .video-card";

document.addEventListener("pointermove", (e) => {
    const el = e.target.closest ? e.target.closest(SPOT_SELECTOR) : null;
    if(!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", (e.clientX - r.left) + "px");
    el.style.setProperty("--my", (e.clientY - r.top) + "px");

    if(finePointer && !reduceMotion && el.classList.contains("project")){
        const nx = (e.clientX - r.left) / r.width - .5;
        const ny = (e.clientY - r.top) / r.height - .5;
        el.style.setProperty("--ry", (nx * 6).toFixed(2) + "deg");
        el.style.setProperty("--rx", (-ny * 6).toFixed(2) + "deg");
    }
}, { passive: true });

document.addEventListener("pointerout", (e) => {
    const el = e.target.closest ? e.target.closest(SPOT_SELECTOR) : null;
    if(!el || el.contains(e.relatedTarget)) return;
    el.style.setProperty("--mx", "-999px");
    el.style.setProperty("--my", "-999px");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
});

if(finePointer && !reduceMotion){
    /* cursor ring that trails the pointer and swells over links */
    const ring = document.createElement("div");
    ring.className = "cursor-ring";
    ring.setAttribute("aria-hidden", "true");
    document.body.appendChild(ring);

    let tx = -100, ty = -100, cx = -100, cy = -100;

    window.addEventListener("pointermove", (e) => {
        tx = e.clientX;
        ty = e.clientY;
        ring.classList.add("is-on");
        ring.classList.toggle("is-link", !!(e.target.closest && e.target.closest("a, button, .project[data-link]")));
    }, { passive: true });

    document.addEventListener("mouseleave", () => ring.classList.remove("is-on"));

    (function loop(){
        cx += (tx - cx) * .18;
        cy += (ty - cy) * .18;
        ring.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
        window.requestAnimationFrame(loop);
    })();

    /* magnetic buttons */
    document.querySelectorAll(".btn").forEach(btn => {
        btn.addEventListener("pointermove", (e) => {
            const r = btn.getBoundingClientRect();
            btn.style.setProperty("--tx", ((e.clientX - (r.left + r.width / 2)) * .18).toFixed(1) + "px");
            btn.style.setProperty("--ty", ((e.clientY - (r.top + r.height / 2)) * .28).toFixed(1) + "px");
        });
        btn.addEventListener("pointerleave", () => {
            btn.style.removeProperty("--tx");
            btn.style.removeProperty("--ty");
        });
    });
}

/* ---------- Mobile nav toggle ---------- */
const navToggle = document.getElementById("navToggle");
const navList = document.getElementById("navList");

if(navToggle && navList){
    navToggle.addEventListener("click", () => {
        const isOpen = navList.classList.toggle("open");
        navToggle.setAttribute("aria-expanded", isOpen);
    });

    navList.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            navList.classList.remove("open");
            navToggle.setAttribute("aria-expanded", "false");
        });
    });
}

/* ---------- Scroll reveal ---------- */
const revealEls = document.querySelectorAll(".reveal");

if("IntersectionObserver" in window && revealEls.length){
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting){
                entry.target.classList.add("is-visible");
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });

    revealEls.forEach(el => revealObserver.observe(el));
} else {
    revealEls.forEach(el => el.classList.add("is-visible"));
}

/* ---------- Active nav link on scroll ---------- */
const navLinks = document.querySelectorAll("nav a[data-nav]");
const sections = Array.from(navLinks)
    .map(link => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

if("IntersectionObserver" in window && sections.length){
    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const id = "#" + entry.target.id;
            const link = document.querySelector(`nav a[href="${id}"]`);
            if(!link) return;

            if(entry.isIntersecting){
                navLinks.forEach(l => l.classList.remove("active"));
                link.classList.add("active");
            }
        });
    }, { threshold: 0, rootMargin: "-45% 0px -50% 0px" });

    sections.forEach(section => navObserver.observe(section));
}

/* ---------- Footer year ---------- */
const yearEl = document.getElementById("year");
if(yearEl){
    yearEl.textContent = new Date().getFullYear();
}

/* ---------- Clickable project cards ---------- */
document.querySelectorAll(".project[data-link]").forEach(card => {
    card.addEventListener("click", (e) => {
        if(e.target.closest("a")) return; // let inner links/buttons behave normally
        window.location.href = card.dataset.link;
    });
});

/* ---------- YouTube-backed development footage players ---------- */
/* Videos are embedded via the YouTube IFrame API instead of <video> tags.
   They autoplay muted + loop, stay inline (no click-through to YouTube),
   and the existing mute-toggle button controls them the same way it
   controlled the old <video> elements. */

/* play footage only while it is on screen (saves CPU and bandwidth) */
const ytVisObserver = ("IntersectionObserver" in window) ? new IntersectionObserver((entries) => {
    entries.forEach(en => {
        const p = ytPlayers.get(en.target);
        if(!p) return;
        if(en.isIntersecting) p.playVideo(); else p.pauseVideo();
    });
}, { threshold: .25 }) : null;

const ytContainers = document.querySelectorAll(".yt-player");
const ytPlayers = new Map(); // .video-wrap element -> YT.Player instance
const ytPendingPlayers = [];
let ytApiRequested = false;

function loadYouTubeApi(){
    if(ytApiRequested) return;
    ytApiRequested = true;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
}

function createYtPlayer(iframeEl){
    new YT.Player(iframeEl, {
        events: {
            onReady: (e) => {
                e.target.mute();
                e.target.playVideo();
                const wrap = iframeEl.closest(".video-wrap");
                if(wrap){
                    ytPlayers.set(wrap, e.target);
                    if(ytVisObserver) ytVisObserver.observe(wrap);
                }
            }
        }
    });
}

// Called by the YouTube IFrame API script once it has loaded
window.onYouTubeIframeAPIReady = function(){
    ytPendingPlayers.forEach(createYtPlayer);
    ytPendingPlayers.length = 0;
};

if(ytContainers.length){
    loadYouTubeApi();
    ytContainers.forEach(el => ytPendingPlayers.push(el));
}

/* ---------- Video mute/unmute toggle ---------- */
const muteButtons = document.querySelectorAll(".mute-toggle");

muteButtons.forEach(btn => {
    const wrap = btn.closest(".video-wrap");
    if(!wrap) return;

    btn.addEventListener("click", () => {
        const player = ytPlayers.get(wrap);
        if(!player || typeof player.isMuted !== "function") return; // player still loading

        const wasMuted = player.isMuted();

        if(wasMuted){
            // unmuting this one — mute every other player so audio doesn't overlap
            ytPlayers.forEach((p, w) => { if(w !== wrap) p.mute(); });
            muteButtons.forEach(b => { if(b !== btn) b.classList.remove("is-unmuted"); });
            player.unMute();
        } else {
            player.mute();
        }

        btn.classList.toggle("is-unmuted", wasMuted);
        btn.setAttribute("aria-label", wasMuted ? "Mute video" : "Unmute video");
    });
});

/* ---------- Video full screen ---------- */
/* Adds a full screen button to every footage player (and double-click).
   Uses the Fullscreen API, with a fixed-position fallback for iPhones. */
(function(){
    const wraps = document.querySelectorAll(".video-wrap");
    if(!wraps.length) return;

    const ENTER = '<svg class="icon-enter" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>';
    const EXIT = '<svg class="icon-exit" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/></svg>';
    const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;
    const buttons = [];

    function isFull(wrap){ return fsElement() === wrap || wrap.classList.contains("is-pseudo-fs"); }

    function sync(){
        buttons.forEach(({ wrap, btn }) => {
            const on = isFull(wrap);
            btn.classList.toggle("is-fs", on);
            btn.setAttribute("aria-label", on ? "Exit full screen" : "Enter full screen");
        });
        const anyPseudo = document.querySelector(".video-wrap.is-pseudo-fs");
        document.body.style.overflow = anyPseudo ? "hidden" : "";
    }

    function toggle(wrap){
        if(isFull(wrap)){
            wrap.classList.remove("is-pseudo-fs");
            if(fsElement()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        } else {
            const req = wrap.requestFullscreen || wrap.webkitRequestFullscreen;
            if(req){
                const r = req.call(wrap);
                if(r && r.catch) r.catch(() => { wrap.classList.add("is-pseudo-fs"); sync(); });
            } else {
                wrap.classList.add("is-pseudo-fs");
            }
        }
        sync();
    }

    wraps.forEach(wrap => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "fs-toggle";
        btn.setAttribute("aria-label", "Enter full screen");
        btn.innerHTML = ENTER + EXIT;
        btn.addEventListener("click", () => toggle(wrap));
        wrap.appendChild(btn);
        wrap.addEventListener("dblclick", (e) => { if(!e.target.closest("button")) toggle(wrap); });
        buttons.push({ wrap, btn });
    });

    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    document.addEventListener("keydown", (e) => {
        if(e.key !== "Escape") return;
        document.querySelectorAll(".video-wrap.is-pseudo-fs").forEach(w => w.classList.remove("is-pseudo-fs"));
        sync();
    });
})();