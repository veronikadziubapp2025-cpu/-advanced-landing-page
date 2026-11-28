document.addEventListener("DOMContentLoaded", () => {
  for (const menu of document.querySelectorAll("header details")) {
    const summary = menu.querySelector("summary");
    if (!(summary instanceof HTMLElement)) continue;

    menu.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !menu.open) return;
      event.preventDefault();
      menu.open = false;
      summary.focus();
    });

    menu.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest("nav a")) return;
      menu.open = false;
    });
  }

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const videoButton = event.target.closest("[data-load-youtube]");
    if (videoButton instanceof HTMLButtonElement) {
      const frame = document.createElement("iframe");
      frame.src = "https://www.youtube-nocookie.com/embed/Xr1AwIcasWs?autoplay=1&rel=0";
      frame.title = "Відео про NeighborCraft";
      frame.className = "h-full w-full border-0";
      frame.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share";
      frame.allowFullscreen = true;
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      videoButton.replaceWith(frame);
      return;
    }

    const mapButton = event.target.closest("[data-load-map]");
    if (mapButton instanceof HTMLButtonElement) {
      const src = mapButton.dataset.mapSrc;
      if (!src) {
        console.error("Не задано адресу інтерактивної мапи.");
        return;
      }

      const frame = document.createElement("iframe");
      frame.src = src;
      frame.title = "Пункти передачі інструментів NeighborCraft у Львові";
      frame.className = "h-full w-full border-0";
      frame.loading = "lazy";
      frame.allowFullscreen = true;
      frame.referrerPolicy = "no-referrer-when-downgrade";
      mapButton.parentElement.replaceChildren(frame);
    }
  });

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        if (entry.target.id === "reviews") {
          if (typeof window.Swiper !== "function") {
            console.error("Swiper не завантажився; слайдер відгуків недоступний.");
          } else {
            new window.Swiper(".reviews-swiper", {
              loop: true,
              spaceBetween: 24,
              grabCursor: true,
              autoplay: {
                delay: 3000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              },
              pagination: {
                el: ".swiper-pagination",
                clickable: true,
              },
              navigation: {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
              },
              breakpoints: {
                320: { slidesPerView: 1 },
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              },
            });
          }
        } else if (entry.target.id === "gallery") {
          if (typeof window.Fancybox?.bind !== "function") {
            console.error("Fancybox не завантажився; галерея недоступна.");
          } else {
            window.Fancybox.bind("[data-fancybox='neighbor-gallery']", {
              Carousel: { Transition: "fade" },
              Images: { Panzoom: { maxScale: 3 } },
            });
          }
        }

        currentObserver.unobserve(entry.target);
      }
    },
    { rootMargin: "200px" },
  );

  for (const id of ["reviews", "gallery"]) {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  }

  const typedText = document.getElementById("typed-text");
  if (!(typedText instanceof HTMLElement)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    typedText.textContent = "перфоратор Bosch за 5 хв пішки.";
    return;
  }
  if (typeof window.Typed !== "function") {
    console.error("Typed.js не завантажився; анімований текст недоступний.");
    return;
  }

  new window.Typed("#typed-text", {
    strings: [
      "перфоратор Bosch за 5 хв пішки.",
      "лазерний нівелір з гарантією Escrow.",
      "мийку Kärcher на вихідні.",
    ],
    typeSpeed: 95,
    backSpeed: 55,
    backDelay: 2200,
    loop: true,
  });
});
