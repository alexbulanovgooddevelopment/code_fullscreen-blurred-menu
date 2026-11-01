document.addEventListener("DOMContentLoaded", async () => {
  await document.fonts.ready;

  gsap.registerPlugin(SplitText);

  const menu = document.querySelector(".menu");
  const menuBg = document.querySelector(".menu-bg");
  const menuItems = document.querySelectorAll(".menu-item");
  const menuToggle = document.querySelector(".menu-toggle");

  if (!menu || !menuBg || !menuToggle || !menuItems.length) return;

  menuToggle.setAttribute("aria-expanded", "false");

  const items = [...menuItems].map((item) => {
    const index = item.querySelector(".item-index");
    const label = item.querySelector(".item-label");
    const divider = item.querySelector(".item-divider");

    const chars = new SplitText(label, { type: "chars", mask: "chars" }).chars;
    const [firstChar, ...trailingChars] = chars;

    // Переносим все буквы, кроме первой, в отдельную обёртку,
    // ширину которой будем анимировать
    const trailingCharBox = document.createElement("span");
    trailingCharBox.className = "item-body";
    trailingChars.forEach((char) => {
      trailingCharBox.appendChild(char.parentElement); // переносим маску вместе с буквой
    });
    label.after(trailingCharBox);

    const indexWord = new SplitText(index, { type: "words", mask: "words" })
      .words;

    // Начальные состояния
    gsap.set([indexWord, firstChar], { yPercent: 100 });
    gsap.set(trailingChars, { xPercent: 125 });
    gsap.set(trailingCharBox, { width: 0 });
    if (divider) gsap.set(divider, { scaleY: 0 });

    return { indexWord, firstChar, trailingChars, trailingCharBox, divider };
  });

  function flickerTextTo(elem, text) {
    elem.flickerSplit?.revert();
    elem.textContent = text;
    elem.flickerSplit = new SplitText(elem, { type: "chars" });

    gsap.fromTo(
      elem.flickerSplit.chars,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.05,
        ease: "power2.inOut",
        stagger: { amount: 0.3, from: "random" },
      },
    );
  }

  const tl = gsap.timeline({
    paused: true,
    defaults: { ease: "power3.out" },
    // Снимаем класс только после завершения анимации закрытия
    onReverseComplete: () => {
      menu.classList.remove("is-open");
      menu.inert = true;
    },
  });

  tl.to(menuBg, { opacity: 1, duration: 0.75 }, 0);

  items.forEach(
    ({ indexWord, firstChar, trailingChars, trailingCharBox, divider }, i) => {
      const startTime = 0.075 * i;

      tl.to([indexWord, firstChar], { yPercent: 0, duration: 0.75 }, startTime);

      if (divider) {
        tl.to(divider, { scaleY: 1, duration: 1 }, startTime + 0.05);
      }

      tl.to(
        trailingCharBox,
        {
          width: "auto", // GSAP сам посчитает итоговую ширину
          duration: 1,
          ease: "power4.inOut",
        },
        startTime + 0.25,
      ).to(
        trailingChars,
        { xPercent: 0, duration: 0.75, stagger: 0.05 },
        startTime + 0.5,
      );
    },
  );

  let isOpen = false;

  menuToggle.addEventListener("click", () => {
    isOpen = !isOpen;
    menuToggle.setAttribute("aria-expanded", String(isOpen));

    if (isOpen) {
      menu.inert = false;
      menu.classList.add("is-open");
      tl.timeScale(1).play();
    } else {
      tl.timeScale(1.6).reverse(); // закрытие быстрее открытия
    }

    flickerTextTo(menuToggle, isOpen ? "close" : "menu");
  });
});
