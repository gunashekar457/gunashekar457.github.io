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
    }, { threshold: 0.4 });

    sections.forEach(section => navObserver.observe(section));
}

/* ---------- Footer year ---------- */
const yearEl = document.getElementById("year");
if(yearEl){
    yearEl.textContent = new Date().getFullYear();
}