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

/* ---------- Parallax background via scroll position ---------- */
let ticking = false;

window.addEventListener("scroll", () => {
    if(!ticking){
        window.requestAnimationFrame(() => {
            document.documentElement.style.setProperty("--scroll-position", window.scrollY);
            ticking = false;
        });
        ticking = true;
    }
});

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
                if(wrap) ytPlayers.set(wrap, e.target);
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