/* ==========================================================================
   MoveMitra — GSAP ScrollTrigger animations + Lenis smooth scroll
   Drop-in file. Loaded AFTER GSAP / ScrollTrigger / Lenis CDN scripts and
   AFTER js/script.js. Does not touch existing markup or CSS — only animates
   elements that already exist via their current class names, and adds a
   few small decorative elements purely via JS (no CSS file edits needed).
   ========================================================================== */

(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---------------------------------------------------------------------
     1. SMOOTH SCROLL (Lenis)
     --------------------------------------------------------------------- */
  var lenis = null;

  if (window.Lenis && !prefersReducedMotion) {
    lenis = new Lenis({
      duration: 0.35,
      easing: function (t) {
        return Math.min(1, 1.001 - Math.pow(2, -10 * t));
      },
      smoothWheel: true,
      wheelMultiplier: 1.6,
      touchMultiplier: 2,
    });

    function raf(time) {
      lenis.raf(time * 1000);
    }
    if (window.gsap) {
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
    } else {
      requestAnimationFrame(function loop(t) {
        lenis.raf(t);
        requestAnimationFrame(loop);
      });
    }

    lenis.on("scroll", function () {
      if (window.ScrollTrigger) ScrollTrigger.update();
    });

    document.querySelectorAll('a[href*="#"]').forEach(function (link) {
      var href = link.getAttribute("href");
      if (!href || href === "#") return;

      var linkPage = href.split("#")[0];
      var currentPage = window.location.pathname.split("/").pop();
      var targetsThisPage =
        linkPage === "" || linkPage === currentPage || linkPage === "./" + currentPage;

      if (!targetsThisPage) return;

      var id = href.split("#")[1];
      var target = document.getElementById(id);
      if (!target) return;

      link.addEventListener("click", function (e) {
        e.preventDefault();
        lenis.scrollTo(target, { offset: -90, duration: 1.2 });
      });
    });
  }

  if (!window.gsap || !window.ScrollTrigger || prefersReducedMotion) return;

  gsap.registerPlugin(ScrollTrigger);

  var mm = gsap.matchMedia();
  var isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------------------------------------------------------------------
     Small helper: split an element's text into per-character <span>s
     without disturbing any nested tags (e.g. the <span class="accent">
     inside the hero h1). Free, no paid SplitText plugin needed.
     --------------------------------------------------------------------- */
  function splitChars(el) {
    function walk(node) {
      if (node.nodeType === 3) {
        var frag = document.createDocumentFragment();
        node.textContent.split("").forEach(function (ch) {
          if (ch === " ") {
            // Keep real spaces as plain text so the browser can still
            // wrap lines normally between words.
            frag.appendChild(document.createTextNode(" "));
            return;
          }
          var span = document.createElement("span");
          span.className = "gsap-char";
          span.style.display = "inline-block";
          span.style.willChange = "transform, opacity";
          span.textContent = ch;
          frag.appendChild(span);
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1) {
        Array.prototype.slice.call(node.childNodes).forEach(walk);
      }
    }
    Array.prototype.slice.call(el.childNodes).forEach(walk);
    return el.querySelectorAll(".gsap-char");
  }

  /* Count-up animation for a "4,500+" / "120+" / "4.8/5" style string */
  function animateCounter(el, delay) {
    var text = el.textContent.trim();
    var match = text.match(/^([\d,.]+)(.*)$/);
    if (!match) return;
    var numStr = match[1];
    var suffix = match[2];
    var isDecimal = numStr.indexOf(".") > -1;
    var target = parseFloat(numStr.replace(/,/g, ""));
    var obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 1.6,
      delay: delay || 0,
      ease: "power2.out",
      onUpdate: function () {
        var display = isDecimal
          ? obj.val.toFixed(1)
          : Math.round(obj.val).toLocaleString("en-IN");
        el.textContent = display + suffix;
      },
    });
  }

  mm.add(
    {
      isDesktop: "(min-width: 900px)",
      isMobile: "(max-width: 899px)",
    },
    function (context) {
      var isDesktop = context.conditions.isDesktop;

      /* ---- Helper: fade + rise reveal for a list of selectors ---- */
      function revealEach(selector, opts) {
        var els = gsap.utils.toArray(selector);
        if (!els.length) return;
        opts = opts || {};
        els.forEach(function (el, i) {
          gsap.fromTo(
            el,
            { autoAlpha: 0, y: opts.y || 40 },
            {
              autoAlpha: 1,
              y: 0,
              duration: opts.duration || 0.8,
              ease: "power3.out",
              delay: (opts.stagger || 0) * (i % (opts.staggerLimit || 1)),
              scrollTrigger: {
                trigger: el,
                start: opts.start || "top 85%",
                toggleActions: "play none none reverse",
              },
            }
          );
        });
      }

      /* ---- Helper: stagger-reveal a group as one trigger (grids) ---- */
      function revealGroup(groupSelector, itemSelector, opts) {
        var groups = gsap.utils.toArray(groupSelector);
        opts = opts || {};
        groups.forEach(function (group) {
          var items = group.querySelectorAll(itemSelector);
          if (!items.length) return;
          gsap.fromTo(
            items,
            { autoAlpha: 0, y: opts.y || 36 },
            {
              autoAlpha: 1,
              y: 0,
              duration: opts.duration || 0.7,
              ease: "power3.out",
              stagger: opts.stagger || 0.12,
              scrollTrigger: {
                trigger: group,
                start: opts.start || "top 82%",
                toggleActions: "play none none reverse",
              },
            }
          );
        });
      }

      /* ---- Helper: letter-by-letter heading reveal on scroll ---- */
      function splitReveal(selector, opts) {
        opts = opts || {};
        gsap.utils.toArray(selector).forEach(function (el) {
          var chars = splitChars(el);
          if (!chars.length) return;
          gsap.fromTo(
            chars,
            { autoAlpha: 0, y: opts.y || 22, rotateX: -40 },
            {
              autoAlpha: 1,
              y: 0,
              rotateX: 0,
              duration: 0.5,
              ease: "power3.out",
              stagger: 0.018,
              scrollTrigger: opts.immediate
                ? undefined
                : {
                    trigger: el,
                    start: "top 85%",
                    toggleActions: "play none none reverse",
                  },
            }
          );
        });
      }

      /* ============ HEADER LOGO — tiny hover pop ============ */
      var brand = document.querySelector(".brand");
      if (brand && isDesktop && isFinePointer) {
        brand.addEventListener("mouseenter", function () {
          gsap.to(brand.querySelector("img"), { rotate: -8, scale: 1.08, duration: 0.35, ease: "back.out(3)" });
        });
        brand.addEventListener("mouseleave", function () {
          gsap.to(brand.querySelector("img"), { rotate: 0, scale: 1, duration: 0.35, ease: "power2.out" });
        });
      }

      /* ============ HERO (index.html) ============ */
      var hero = document.querySelector(".hero");
      if (hero) {
        /* -- Ambient glow + orbiting transport-icon parallax field
              (added purely via JS — no CSS file edits needed) -- */
        hero.style.position = hero.style.position || "relative";
        hero.style.overflow = "hidden";
        var heroGrid = hero.querySelector(".hero-grid");
        if (heroGrid) {
          heroGrid.style.position = "relative";
          heroGrid.style.zIndex = "1";
        }

        var blobA = document.createElement("div");
        var blobB = document.createElement("div");
        [blobA, blobB].forEach(function (b) {
          b.setAttribute("aria-hidden", "true");
          b.style.position = "absolute";
          b.style.borderRadius = "50%";
          b.style.pointerEvents = "none";
          b.style.zIndex = "0";
          b.style.filter = "blur(6px)";
        });
        blobA.style.width = "420px";
        blobA.style.height = "420px";
        blobA.style.top = "-160px";
        blobA.style.left = "-120px";
        blobA.style.background =
          "radial-gradient(circle, rgba(29,79,163,0.16), rgba(29,79,163,0) 70%)";
        blobB.style.width = "360px";
        blobB.style.height = "360px";
        blobB.style.bottom = "-140px";
        blobB.style.right = "-100px";
        blobB.style.background =
          "radial-gradient(circle, rgba(46,158,68,0.16), rgba(46,158,68,0) 70%)";
        hero.insertBefore(blobA, hero.firstChild);
        hero.insertBefore(blobB, hero.firstChild);

        gsap.to(blobA, {
          yPercent: 35,
          xPercent: 8,
          ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 1 },
        });
        gsap.to(blobB, {
          yPercent: -25,
          xPercent: -6,
          ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 1 },
        });

        /* -- Orbit field: transport icons instead of stars, in 3 depth layers.
              Each layer slowly rotates around the hero's centre (true orbit
              motion) while every icon counter-rotates to stay upright, plus
              a gentle idle float. Layers also react to scroll depth and,
              on desktop, to the mouse — classic "space hero" parallax, just
              with trucks/boxes/bikes instead of stars. -- */
        function rand(min, max) {
          return min + Math.random() * (max - min);
        }

        var ORBIT_ICONS = [
          // truck
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M1 3h13v13H1z"/><path d="M14 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18" r="1.8"/><circle cx="16.5" cy="18" r="1.8"/></svg>',
          // parcel / box
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>',
          // bike
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="5.5" cy="17.5" r="3.4"/><circle cx="18.5" cy="17.5" r="3.4"/><path d="M15 6a1 1 0 100-2 1 1 0 000 2z"/><path d="M12 17.5V14l-3-3 4-3 2 3h3"/></svg>',
          // location pin
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
          // parcel with arrow
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M3 8l2-5h14l2 5"/><path d="M9 13l3 3 3-3"/><path d="M12 16v-5"/></svg>',
        ];
        var ORBIT_COLORS = ["#1d4fa3", "#2e9e44", "#45b85a", "#0e2c63"];

        var orbitField = document.createElement("div");
        orbitField.setAttribute("aria-hidden", "true");
        Object.assign(orbitField.style, {
          position: "absolute",
          inset: "0",
          zIndex: "0",
          pointerEvents: "none",
          overflow: "hidden",
        });
        hero.insertBefore(orbitField, hero.firstChild);

        var LAYER_CONFIG = [
          { count: 6, size: [14, 20], opacity: [0.1, 0.18], orbitDuration: 150, mouseStrength: 6, scrollY: -12 },
          { count: 6, size: [20, 28], opacity: [0.18, 0.28], orbitDuration: 110, mouseStrength: 14, scrollY: -26 },
          { count: 5, size: [26, 38], opacity: [0.3, 0.45], orbitDuration: 80, mouseStrength: 24, scrollY: -42 },
        ];

        var mouseLayers = [];

        LAYER_CONFIG.forEach(function (cfg, layerIndex) {
          // outer: scroll-depth parallax
          var scrollLayer = document.createElement("div");
          Object.assign(scrollLayer.style, { position: "absolute", inset: "-10% ", width: "120%", height: "120%" });
          orbitField.appendChild(scrollLayer);

          // middle: mouse parallax
          var mouseLayer = document.createElement("div");
          Object.assign(mouseLayer.style, { position: "absolute", inset: "0", width: "100%", height: "100%" });
          scrollLayer.appendChild(mouseLayer);
          mouseLayers.push({ el: mouseLayer, strength: cfg.mouseStrength });

          // inner: the slowly-rotating "orbit" ring that carries the icons
          var orbitRing = document.createElement("div");
          Object.assign(orbitRing.style, {
            position: "absolute",
            inset: "0",
            width: "100%",
            height: "100%",
            transformOrigin: "50% 50%",
          });
          mouseLayer.appendChild(orbitRing);

          gsap.to(orbitRing, {
            rotate: 360,
            duration: cfg.orbitDuration,
            repeat: -1,
            ease: "none",
          });

          gsap.to(scrollLayer, {
            yPercent: cfg.scrollY,
            ease: "none",
            scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 1 },
          });

          for (var i = 0; i < cfg.count; i++) {
            var icon = document.createElement("div");
            var svgMarkup = ORBIT_ICONS[Math.floor(Math.random() * ORBIT_ICONS.length)];
            var size = rand(cfg.size[0], cfg.size[1]);
            var opacity = rand(cfg.opacity[0], cfg.opacity[1]);
            var color = ORBIT_COLORS[Math.floor(Math.random() * ORBIT_COLORS.length)];

            icon.innerHTML = svgMarkup;
            Object.assign(icon.style, {
              position: "absolute",
              left: rand(2, 94) + "%",
              top: rand(4, 90) + "%",
              width: size + "px",
              height: size + "px",
              color: color,
              opacity: String(opacity),
              transformOrigin: "50% 50%",
            });
            orbitRing.appendChild(icon);

            // counter-rotate so the icon itself stays upright while its
            // position travels around the orbit ring
            gsap.to(icon, { rotate: -360, duration: LAYER_CONFIG[layerIndex].orbitDuration, repeat: -1, ease: "none" });

            // gentle idle float, independent of the orbit/rotation tweens
            gsap.to(icon, {
              y: "+=" + rand(8, 16),
              duration: rand(2.5, 5),
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
              delay: rand(0, 2),
            });
          }
        });

        /* Mouse parallax across the three layers (desktop, fine pointer only) */
        if (isDesktop && isFinePointer) {
          var quickSetters = mouseLayers.map(function (layer) {
            return {
              x: gsap.quickTo(layer.el, "x", { duration: 0.6, ease: "power3.out" }),
              y: gsap.quickTo(layer.el, "y", { duration: 0.6, ease: "power3.out" }),
              strength: layer.strength,
            };
          });
          hero.addEventListener("mousemove", function (e) {
            var rect = hero.getBoundingClientRect();
            var nx = (e.clientX - rect.left) / rect.width - 0.5;
            var ny = (e.clientY - rect.top) / rect.height - 0.5;
            quickSetters.forEach(function (qs) {
              qs.x(nx * qs.strength);
              qs.y(ny * qs.strength);
            });
          });
          hero.addEventListener("mouseleave", function () {
            quickSetters.forEach(function (qs) {
              qs.x(0);
              qs.y(0);
            });
          });
        }

        /* -- Parallax depth: hero-art moves slower than hero text as page scrolls -- */
        if (isDesktop) {
          gsap.to(".hero-art", {
            yPercent: -12,
            ease: "none",
            scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 1 },
          });
          gsap.to(".hero > .container > div:first-child", {
            yPercent: 8,
            ease: "none",
            scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 1 },
          });
        }

        /* -- Entrance timeline -- */
        var heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
        heroTl.fromTo(".hero .eyebrow", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.6 });

        var heroH1 = document.querySelector(".hero h1");
        if (heroH1) {
          var heroChars = splitChars(heroH1);
          heroTl.fromTo(
            heroChars,
            { autoAlpha: 0, y: 26, rotateX: -50 },
            { autoAlpha: 1, y: 0, rotateX: 0, duration: 0.5, stagger: 0.012 },
            "-=0.3"
          );
        }

        heroTl
          .fromTo(".hero .lead", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.6 }, "-=0.25")
          .fromTo(".hero .hero-actions", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5 }, "-=0.35")
          .fromTo(
            ".hero-stats > div",
            { autoAlpha: 0, y: 16 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.5,
              stagger: 0.1,
              onStart: function () {
                document.querySelectorAll(".hero-stats > div > strong").forEach(function (el, i) {
                  animateCounter(el, i * 0.1);
                });
              },
            },
            "-=0.3"
          )
          .fromTo(
            ".hero-art",
            { autoAlpha: 0, scale: 0.92, x: 30 },
            { autoAlpha: 1, scale: 1, x: 0, duration: 0.9 },
            "-=0.9"
          );

        gsap.to(".hero-art svg", { y: -10, duration: 2.6, ease: "sine.inOut", repeat: -1, yoyo: true });

        /* -- Truck illustration "draws itself" on load -- */
        var heroSvg = document.querySelector(".hero-art svg");
        if (heroSvg) {
          var dashed = heroSvg.querySelectorAll("path[stroke-dasharray], line[stroke-dasharray]");
          dashed.forEach(function (p) {
            var len = p.getTotalLength ? p.getTotalLength() : 120;
            gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
          });
          var pins = heroSvg.querySelectorAll("g > circle");
          var truckGroup = heroSvg.querySelector('g[transform*="150,150"], g[transform*="150, 150"]');

          var drawTl = gsap.timeline({ delay: 1.0 });
          drawTl
            .to(dashed, { strokeDashoffset: 0, duration: 1, ease: "power2.out", stagger: 0.15 }, 0)
            .fromTo(
              pins,
              { scale: 0, transformOrigin: "center" },
              { scale: 1, duration: 0.45, ease: "back.out(3)", stagger: 0.15 },
              0.1
            );
          if (truckGroup) {
            drawTl.fromTo(
              truckGroup,
              { x: "-=40", autoAlpha: 0.001 },
              { x: "+=40", autoAlpha: 1, duration: 0.7, ease: "power3.out" },
              0.15
            );
          }
        }
      }

      /* ============ PAGE HEADER (about/services/contact) ============ */
      if (document.querySelector(".page-header")) {
        var pageTl = gsap.timeline({ defaults: { ease: "power3.out" } });
        pageTl.fromTo(".page-header .eyebrow", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5 });

        var pageH1 = document.querySelector(".page-header h1");
        if (pageH1) {
          var pageChars = splitChars(pageH1);
          pageTl.fromTo(
            pageChars,
            { autoAlpha: 0, y: 22, rotateX: -40 },
            { autoAlpha: 1, y: 0, rotateX: 0, duration: 0.45, stagger: 0.01 },
            "-=0.25"
          );
        }
        pageTl
          .fromTo(".page-header p", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5 }, "-=0.2")
          .fromTo(".page-header .breadcrumb", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, "-=0.25");
      }

      /* ============ SECTION HEADS — letter-reveal h2 + fade eyebrow/p ============ */
      revealEach(".section-head .eyebrow", { y: 20 });
      revealEach(".section-head > p", { y: 20 });
      splitReveal(".section-head h2", {});

      /* ============ TRUST STRIP ============ */
      revealGroup(".trust-strip .container", "ul li", { y: 16, stagger: 0.08 });

      /* ============ CARD GRIDS ============ */
      revealGroup(".cards-grid", ".card", { y: 40, stagger: 0.12 });
      revealGroup(".cards-grid", ".testimonial-card", { y: 40, stagger: 0.12 });

      /* ============ HOW IT WORKS steps ============ */
      revealGroup(".steps", ".step", { y: 34, stagger: 0.1 });

      /* ============ SERVICES PAGE — service blocks + pinned visuals ============ */
      gsap.utils.toArray(".service-block").forEach(function (block) {
        var text = block.querySelector(".service-text");
        var visual = block.querySelector(".service-visual");
        var tl = gsap.timeline({
          scrollTrigger: { trigger: block, start: "top 78%", toggleActions: "play none none reverse" },
        });
        if (text) tl.fromTo(text, { autoAlpha: 0, x: -40 }, { autoAlpha: 1, x: 0, duration: 0.8, ease: "power3.out" });
        if (visual)
          tl.fromTo(
            visual,
            { autoAlpha: 0, x: 40, scale: 0.94 },
            { autoAlpha: 1, x: 0, scale: 1, duration: 0.8, ease: "power3.out" },
            "<0.1"
          );
      });

      /* ============ ABOUT PAGE — timeline ============ */
      revealEach(".timeline-item", { y: 30, stagger: 0.15, staggerLimit: 4 });

      /* ============ ABOUT PAGE — values grid ============ */
      revealGroup(".value-grid", ".value-item", { y: 34, stagger: 0.1 });

      /* ============ ABOUT PAGE — office cards ============ */
      revealGroup(".office-grid", ".office-card", { y: 36, stagger: 0.15 });

      /* ============ ABOUT / CONTACT — map frame ============ */
      revealEach(".map-frame", { y: 30 });

      /* ============ CONTACT PAGE — info card + form card ============ */
      if (document.querySelector(".contact-wrap")) {
        gsap
          .timeline({ scrollTrigger: { trigger: ".contact-wrap", start: "top 78%", toggleActions: "play none none reverse" } })
          .fromTo(".contact-info-card", { autoAlpha: 0, x: -36 }, { autoAlpha: 1, x: 0, duration: 0.75, ease: "power3.out" })
          .fromTo(".form-card", { autoAlpha: 0, x: 36 }, { autoAlpha: 1, x: 0, duration: 0.75, ease: "power3.out" }, "<0.1");

        gsap.fromTo(
          ".contact-info-row",
          { autoAlpha: 0, y: 14 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: { trigger: ".contact-info-card", start: "top 75%", toggleActions: "play none none reverse" },
          }
        );
      }

      /* ============ CTA BAND ============ */
      revealEach(".cta-band", { y: 36 });

      /* ============ FOOTER columns ============ */
      revealGroup(".footer-grid", ".footer-col", { y: 24, stagger: 0.1, start: "top 92%" });

      /* ============ MAGNETIC + HOVER-SCALE BUTTONS (desktop, fine pointer only) ============ */
      if (isDesktop && isFinePointer) {
        gsap.utils.toArray(".btn, .nav-call").forEach(function (btn) {
          var strength = btn.classList.contains("btn") ? 0.35 : 0.2;
          btn.style.display = btn.style.display || "inline-flex";
          btn.addEventListener("mousemove", function (e) {
            var rect = btn.getBoundingClientRect();
            var x = e.clientX - rect.left - rect.width / 2;
            var y = e.clientY - rect.top - rect.height / 2;
            gsap.to(btn, { x: x * strength, y: y * strength, scale: 1.05, duration: 0.3, ease: "power2.out" });
          });
          btn.addEventListener("mouseleave", function () {
            gsap.to(btn, { x: 0, y: 0, scale: 1, duration: 0.5, ease: "elastic.out(1, 0.4)" });
          });
        });
      }

      /* Refresh once everything (fonts/images/pins) is settled */
      window.addEventListener("load", function () {
        ScrollTrigger.refresh();
      });

      return function cleanup() {
        // gsap.matchMedia handles teardown of tweens/triggers automatically
      };
    }
  );
})();