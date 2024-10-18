function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
}

document.querySelectorAll('[id^="Details-"] summary').forEach((summary) => {
  summary.setAttribute("role", "button");
  summary.setAttribute(
    "aria-expanded",
    summary.parentNode.hasAttribute("open")
  );

  if (summary.nextElementSibling.getAttribute("id")) {
    summary.setAttribute("aria-controls", summary.nextElementSibling.id);
  }

  summary.addEventListener("click", (event) => {
    event.currentTarget.setAttribute(
      "aria-expanded",
      !event.currentTarget.closest("details").hasAttribute("open")
    );
  });

  if (summary.closest("header-drawer, menu-drawer")) return;
  summary.parentElement.addEventListener("keyup", onKeyUpEscape);
});

const trapFocusHandlers = {};

function trapFocus(container, elementToFocus = container) {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (event) => {
    if (
      event.target !== container &&
      event.target !== last &&
      event.target !== first
    )
      return;

    document.addEventListener("keydown", trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function () {
    document.removeEventListener("keydown", trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = function (event) {
    if (event.code.toUpperCase() !== "TAB") return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }

    //  On the first focusable element and tab backward, focus the last element.
    if (
      (event.target === container || event.target === first) &&
      event.shiftKey
    ) {
      event.preventDefault();
      last.focus();
    }
  };

  document.addEventListener("focusout", trapFocusHandlers.focusout);
  document.addEventListener("focusin", trapFocusHandlers.focusin);

  elementToFocus.focus();

  if (
    elementToFocus.tagName === "INPUT" &&
    ["search", "text", "email", "url"].includes(elementToFocus.type) &&
    elementToFocus.value
  ) {
    elementToFocus.setSelectionRange(0, elementToFocus.value.length);
  }
}

// Here run the querySelector to figure out if the browser supports :focus-visible or not and run code based on it.
try {
  document.querySelector(":focus-visible");
} catch (e) {
  focusVisiblePolyfill();
}

function focusVisiblePolyfill() {
  const navKeys = [
    "ARROWUP",
    "ARROWDOWN",
    "ARROWLEFT",
    "ARROWRIGHT",
    "TAB",
    "ENTER",
    "SPACE",
    "ESCAPE",
    "HOME",
    "END",
    "PAGEUP",
    "PAGEDOWN",
  ];
  let currentFocusedElement = null;
  let mouseClick = null;

  window.addEventListener("keydown", (event) => {
    if (navKeys.includes(event.code.toUpperCase())) {
      mouseClick = false;
    }
  });

  window.addEventListener("mousedown", (event) => {
    mouseClick = true;
  });

  window.addEventListener(
    "focus",
    () => {
      if (currentFocusedElement)
        currentFocusedElement.classList.remove("focused");

      if (mouseClick) return;

      currentFocusedElement = document.activeElement;
      currentFocusedElement.classList.add("focused");
    },
    true
  );
}

function pauseAllMedia() {
  document.querySelectorAll(".js-youtube").forEach((video) => {
    video.contentWindow.postMessage(
      '{"event":"command","func":"' + "pauseVideo" + '","args":""}',
      "*"
    );
  });
  document.querySelectorAll(".js-vimeo").forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', "*");
  });
  document.querySelectorAll("video").forEach((video) => video.pause());
  document.querySelectorAll("product-model").forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener("focusin", trapFocusHandlers.focusin);
  document.removeEventListener("focusout", trapFocusHandlers.focusout);
  document.removeEventListener("keydown", trapFocusHandlers.keydown);

  if (elementToFocus) elementToFocus.focus();
}

function onKeyUpEscape(event) {
  if (event.code.toUpperCase() !== "ESCAPE") return;

  const openDetailsElement = event.target.closest("details[open]");
  if (!openDetailsElement) return;

  const summaryElement = openDetailsElement.querySelector("summary");
  openDetailsElement.removeAttribute("open");
  summaryElement.setAttribute("aria-expanded", false);
  summaryElement.focus();
}

class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector("input");
    this.changeEvent = new Event("change", { bubbles: true });

    this.input.addEventListener("change", this.onInputChange.bind(this));
    this.querySelectorAll("button").forEach((button) =>
      button.addEventListener("click", this.onButtonClick.bind(this))
    );
  }

  quantityUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.validateQtyRules();
    this.quantityUpdateUnsubscriber = subscribe(
      PUB_SUB_EVENTS.quantityUpdate,
      this.validateQtyRules.bind(this)
    );
  }

  disconnectedCallback() {
    if (this.quantityUpdateUnsubscriber) {
      this.quantityUpdateUnsubscriber();
    }
  }

  onInputChange(event) {
    this.validateQtyRules();
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    event.target.name === "plus" ? this.input.stepUp() : this.input.stepDown();
    if (previousValue !== this.input.value)
      this.input.dispatchEvent(this.changeEvent);
  }

  validateQtyRules() {
    const value = parseInt(this.input.value);
    if (this.input.min) {
      const min = parseInt(this.input.min);
      const buttonMinus = this.querySelector(".quantity__button[name='minus']");
      buttonMinus.classList.toggle("disabled", value <= min);
    }
    if (this.input.max) {
      const max = parseInt(this.input.max);
      const buttonPlus = this.querySelector(".quantity__button[name='plus']");
      buttonPlus.classList.toggle("disabled", value >= max);
    }
  }
}

customElements.define("quantity-input", QuantityInput);

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function fetchConfig(type = "json") {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: `application/${type}`,
    },
  };
}

/*
 * Shopify Common JS
 *
 */
if (typeof window.Shopify == "undefined") {
  window.Shopify = {};
}

Shopify.bind = function (fn, scope) {
  return function () {
    return fn.apply(scope, arguments);
  };
};

Shopify.setSelectorByValue = function (selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};

Shopify.addListener = function (target, eventName, callback) {
  target.addEventListener
    ? target.addEventListener(eventName, callback, false)
    : target.attachEvent("on" + eventName, callback);
};

Shopify.postLink = function (path, options) {
  options = options || {};
  var method = options["method"] || "post";
  var params = options["parameters"] || {};

  var form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);

  for (var key in params) {
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function (
  country_domid,
  province_domid,
  options
) {
  this.countryEl = document.getElementById(country_domid);
  this.provinceEl = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(
    options["hideElement"] || province_domid
  );

  Shopify.addListener(
    this.countryEl,
    "change",
    Shopify.bind(this.countryHandler, this)
  );

  this.initCountry();
  this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
  initCountry: function () {
    var value = this.countryEl.getAttribute("data-default");
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function () {
    var value = this.provinceEl.getAttribute("data-default");
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function (e) {
    var opt = this.countryEl.options[this.countryEl.selectedIndex];
    var raw = opt.getAttribute("data-provinces");
    var provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = "none";
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement("option");
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = "";
    }
  },

  clearOptions: function (selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function (selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement("option");
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  },
};

class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.mainDetailsToggle = this.querySelector("details");

    this.addEventListener("keyup", this.onKeyUp.bind(this));
    this.addEventListener("focusout", this.onFocusOut.bind(this));
    this.bindEvents();
  }

  bindEvents() {
    this.querySelectorAll("summary").forEach((summary) =>
      summary.addEventListener("click", this.onSummaryClick.bind(this))
    );
    this.querySelectorAll("button:not(.localization-selector)").forEach(
      (button) =>
        button.addEventListener("click", this.onCloseButtonClick.bind(this))
    );
  }

  onKeyUp(event) {
    if (event.code.toUpperCase() !== "ESCAPE") return;

    const openDetailsElement = event.target.closest("details[open]");
    if (!openDetailsElement) return;

    openDetailsElement === this.mainDetailsToggle
      ? this.closeMenuDrawer(
        event,
        this.mainDetailsToggle.querySelector("summary")
      )
      : this.closeSubmenu(openDetailsElement);
  }

  onSummaryClick(event) {
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.parentNode;
    const parentMenuElement = detailsElement.closest(".has-submenu");
    const isOpen = detailsElement.hasAttribute("open");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function addTrapFocus() {
      trapFocus(
        summaryElement.nextElementSibling,
        detailsElement.querySelector("button")
      );
      summaryElement.nextElementSibling.removeEventListener(
        "transitionend",
        addTrapFocus
      );
    }

    if (detailsElement === this.mainDetailsToggle) {
      if (isOpen) event.preventDefault();
      isOpen
        ? this.closeMenuDrawer(event, summaryElement)
        : this.openMenuDrawer(summaryElement);

      if (window.matchMedia("(max-width: 990px)")) {
        document.documentElement.style.setProperty(
          "--viewport-height",
          `${window.innerHeight}px`
        );
      }
    } else {
      setTimeout(() => {
        detailsElement.classList.add("menu-opening");
        summaryElement.setAttribute("aria-expanded", true);
        parentMenuElement && parentMenuElement.classList.add("submenu-open");
        !reducedMotion || reducedMotion.matches
          ? addTrapFocus()
          : summaryElement.nextElementSibling.addEventListener(
            "transitionend",
            addTrapFocus
          );
      }, 100);
    }
  }

  openMenuDrawer(summaryElement) {
    setTimeout(() => {
      this.mainDetailsToggle.classList.add("menu-opening");
    });
    summaryElement.setAttribute("aria-expanded", true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus = false) {
    if (event === undefined) return;

    this.mainDetailsToggle.classList.remove("menu-opening");
    this.mainDetailsToggle.querySelectorAll("details").forEach((details) => {
      details.removeAttribute("open");
      details.classList.remove("menu-opening");
    });
    this.mainDetailsToggle
      .querySelectorAll(".submenu-open")
      .forEach((submenu) => {
        submenu.classList.remove("submenu-open");
      });
    document.body.classList.remove(
      `overflow-hidden-${this.dataset.breakpoint}`
    );
    removeTrapFocus(elementToFocus);
    this.closeAnimation(this.mainDetailsToggle);

    if (event instanceof KeyboardEvent)
      elementToFocus?.setAttribute("aria-expanded", false);
  }

  onFocusOut() {
    setTimeout(() => {
      if (
        this.mainDetailsToggle.hasAttribute("open") &&
        !this.mainDetailsToggle.contains(document.activeElement)
      )
        this.closeMenuDrawer();
    });
  }

  onCloseButtonClick(event) {
    const detailsElement = event.currentTarget.closest("details");
    this.closeSubmenu(detailsElement);
  }

  closeSubmenu(detailsElement) {
    const parentMenuElement = detailsElement.closest(".submenu-open");
    parentMenuElement && parentMenuElement.classList.remove("submenu-open");
    detailsElement.classList.remove("menu-opening");
    detailsElement
      .querySelector("summary")
      .setAttribute("aria-expanded", false);
    removeTrapFocus(detailsElement.querySelector("summary"));
    this.closeAnimation(detailsElement);
  }

  closeAnimation(detailsElement) {
    let animationStart;

    const handleAnimation = (time) => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      if (elapsedTime < 400) {
        window.requestAnimationFrame(handleAnimation);
      } else {
        detailsElement.removeAttribute("open");
        if (detailsElement.closest("details[open]")) {
          trapFocus(
            detailsElement.closest("details[open]"),
            detailsElement.querySelector("summary")
          );
        }
      }
    };

    window.requestAnimationFrame(handleAnimation);
  }
}

customElements.define("menu-drawer", MenuDrawer);

class HeaderDrawer extends MenuDrawer {
  constructor() {
    super();
  }

  openMenuDrawer(summaryElement) {
    this.header = this.header || document.querySelector(".section-header");
    this.borderOffset =
      this.borderOffset ||
        this.closest(".header-wrapper").classList.contains(
          "header-wrapper--border-bottom"
        )
        ? 1
        : 0;
    document.documentElement.style.setProperty(
      "--header-bottom-position",
      `${parseInt(
        this.header.getBoundingClientRect().bottom - this.borderOffset
      )}px`
    );
    this.header.classList.add("menu-open");

    setTimeout(() => {
      this.mainDetailsToggle.classList.add("menu-opening");
    });

    summaryElement.setAttribute("aria-expanded", true);
    window.addEventListener("resize", this.onResize);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus) {
    if (!elementToFocus) return;
    super.closeMenuDrawer(event, elementToFocus);
    this.header.classList.remove("menu-open");
    window.removeEventListener("resize", this.onResize);
  }

  onResize = () => {
    this.header &&
      document.documentElement.style.setProperty(
        "--header-bottom-position",
        `${parseInt(
          this.header.getBoundingClientRect().bottom - this.borderOffset
        )}px`
      );
    document.documentElement.style.setProperty(
      "--viewport-height",
      `${window.innerHeight}px`
    );
  };
}

customElements.define("header-drawer", HeaderDrawer);

class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.querySelector('[id^="ModalClose-"]').addEventListener(
      "click",
      this.hide.bind(this, false)
    );
    this.addEventListener("keyup", (event) => {
      if (event.code.toUpperCase() === "ESCAPE") this.hide();
    });
    if (this.classList.contains("media-modal")) {
      this.addEventListener("pointerup", (event) => {
        if (
          event.pointerType === "mouse" &&
          !event.target.closest("deferred-media, product-model")
        )
          this.hide();
      });
    } else {
      this.addEventListener("click", (event) => {
        if (event.target === this) this.hide();
      });
    }
  }

  connectedCallback() {
    if (this.moved) return;
    this.moved = true;
    document.body.appendChild(this);
  }

  show(opener) {
    this.openedBy = opener;
    const popup = this.querySelector(".template-popup");
    document.body.classList.add("modal-open");
    this.setAttribute("open", "");
    if (popup) popup.loadContent();
    trapFocus(this, this.querySelector('[role="dialog"]'));
    window.pauseAllMedia();
  }

  hide() {
    if (!this.classList.contains("add-all-modal")) {
      document.body.classList.remove("modal-open");
    }
    document.body.dispatchEvent(new CustomEvent("modalClosed"));
    this.removeAttribute("open");
    removeTrapFocus(this.openedBy);
    window.pauseAllMedia();
  }
}
customElements.define("modal-dialog", ModalDialog);

class ModalOpener extends HTMLElement {
  constructor() {
    super();

    const button = this.querySelector("button");
    const link = this.querySelector("a");
    const image = this.querySelector(".shop_the_look--item_image");
    if (button) {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const modal = document.querySelector(this.getAttribute("data-modal"));
        if (modal) modal.show(button);
      });
    }
    if (link) {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const modal = document.querySelector(this.getAttribute("data-modal"));
        if (modal) modal.show(link);
      });
    }
    if (image) {
      image.addEventListener("click", (e) => {
        e.preventDefault();
        const modal = document.querySelector(this.getAttribute("data-modal"));
        if (modal) modal.show(image);
      });
    }
  }
}

customElements.define("modal-opener", ModalOpener);

class CustomMobileSlider extends HTMLElement {
  constructor() {
    super();

    const itemClicks = document.querySelectorAll("custom-slider .shop_the_look--item_main_image");
    const itemParents = document.querySelector(".shop_the_look--body");
    const features = document.querySelectorAll(".mobile-feature-image .rocket-system-home-stl__wrapper__item__content__modal");

    itemClicks.forEach(function (itemClick) {
      itemClick.addEventListener("click", (e) => {
        itemClicks.forEach(function (item) {
          item.classList.remove("activeClick");
        });

        itemClick.classList.add("activeClick");
        itemParents.classList.add("activeClick");

        features.forEach(function (feature) {
          if (feature.getAttribute("id") === itemClick.getAttribute("id")) {
            feature.style.display = 'block';
          } else {
            feature.style.display = 'none';
          }
        });
      });
    });
  }
}

customElements.define("custom-slider", CustomMobileSlider);

class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    const poster = this.querySelector('[id^="Deferred-Poster-"]');
    this.autoPlay = this.dataset.autoplay;
    this.autoPlay ? this.loadContent() : poster?.addEventListener("click", this.loadContent.bind(this));
  }

  loadContent(focus = true) {
    if (!this.getAttribute("loaded")) {
      const content = document.createElement("div");
      content.appendChild(
        this.querySelector("template").content.firstElementChild.cloneNode(true)
      );

      this.setAttribute("loaded", true);
      const deferredElement = this.appendChild(
        content.querySelector("video, model-viewer, iframe")
      );
      if (focus) deferredElement.focus();
      if (
        deferredElement.nodeName == "VIDEO" &&
        deferredElement.getAttribute("autoplay")
      ) {
        // force autoplay for safari
        deferredElement.play();
      }
    }
  }
}

customElements.define("deferred-media", DeferredMedia);

class SliderComponent extends HTMLElement {
  constructor() {
    super();
    this.slider = this.querySelector('[id^="Slider-"]');
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.enableSliderLooping = false;
    this.currentPageElement = this.querySelector(".slider-counter--current");
    this.processPageElement = this.querySelector(".product__media-process");
    this.pageTotalElement = this.querySelector(".slider-counter--total");
    this.prevButton = this.querySelector('button[name="previous"]');
    this.nextButton = this.querySelector('button[name="next"]');

    if (!this.slider || !this.nextButton) return;

    this.initPages();
    const resizeObserver = new ResizeObserver((entries) => this.initPages());
    resizeObserver.observe(this.slider);

    this.slider.addEventListener("scroll", this.update.bind(this));
    this.prevButton.addEventListener("click", this.onButtonClick.bind(this));
    this.nextButton.addEventListener("click", this.onButtonClick.bind(this));
  }

  initPages() {
    this.sliderItemsToShow = Array.from(this.sliderItems).filter(
      (element) => element.clientWidth > 0
    );
    if (this.sliderItemsToShow.length < 2) return;
    this.sliderItemOffset =
      this.sliderItemsToShow[1].offsetLeft -
      this.sliderItemsToShow[0].offsetLeft;
    this.slidesPerPage = Math.floor(
      (this.slider.clientWidth - this.sliderItemsToShow[0].offsetLeft) /
      this.sliderItemOffset
    );
    this.totalPages = this.sliderItemsToShow.length - this.slidesPerPage + 1;
    this.update();
  }

  resetPages() {
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.initPages();
  }

  update() {
    // Temporarily prevents unneeded updates resulting from variant changes
    // This should be refactored as part of https://github.com/Shopify/dawn/issues/2057
    if (!this.slider || !this.nextButton) return;

    const previousPage = this.currentPage;
    this.currentPage =
      Math.round(this.slider.scrollLeft / this.sliderItemOffset) + 1;

    if (this.currentPageElement && this.pageTotalElement) {
      this.currentPageElement.textContent = this.currentPage;
      this.pageTotalElement.textContent = this.totalPages;
    }

    if (this.processPageElement) {
      this.processPageElement.setAttribute("style", `--width: ${parseInt(100 * this.currentPage / this.totalPages)}%`)
    }

    if (this.currentPage != previousPage) {
      this.dispatchEvent(
        new CustomEvent("slideChanged", {
          detail: {
            currentPage: this.currentPage,
            currentElement: this.sliderItemsToShow[this.currentPage - 1],
          },
        })
      );
    }

    if (this.enableSliderLooping) return;

    if (
      this.isSlideVisible(this.sliderItemsToShow[0]) &&
      this.slider.scrollLeft === 0
    ) {
      this.prevButton.setAttribute("disabled", "disabled");
    } else {
      this.prevButton.removeAttribute("disabled");
    }

    if (
      this.isSlideVisible(
        this.sliderItemsToShow[this.sliderItemsToShow.length - 1]
      )
    ) {
      this.nextButton.setAttribute("disabled", "disabled");
    } else {
      this.nextButton.removeAttribute("disabled");
    }
  }

  isSlideVisible(element, offset = 0) {
    const lastVisibleSlide =
      this.slider.clientWidth + this.slider.scrollLeft - offset;
    return (
      element.offsetLeft + element.clientWidth <= lastVisibleSlide &&
      element.offsetLeft >= this.slider.scrollLeft
    );
  }

  onButtonClick(event) {
    event.preventDefault();
    const step = event.currentTarget.dataset.step || 1;
    this.slideScrollPosition =
      event.currentTarget.name === "next"
        ? this.slider.scrollLeft + step * this.sliderItemOffset
        : this.slider.scrollLeft - step * this.sliderItemOffset;
    this.slider.scrollTo({
      left: this.slideScrollPosition,
    });
  }
}

customElements.define("slider-component", SliderComponent);

class SlideshowComponent extends SliderComponent {
  constructor() {
    super();
    this.sliderControlWrapper = this.querySelector(".slider-buttons");
    this.enableSliderLooping = true;

    if (!this.sliderControlWrapper) return;

    this.sliderFirstItemNode = this.slider.querySelector(".slideshow__slide");
    if (this.sliderItemsToShow.length > 0) this.currentPage = 1;

    this.sliderControlLinksArray = Array.from(
      this.sliderControlWrapper.querySelectorAll(".slider-counter__link")
    );
    this.sliderControlLinksArray.forEach((link) =>
      link.addEventListener("click", this.linkToSlide.bind(this))
    );
    this.slider.addEventListener("scroll", this.setSlideVisibility.bind(this));
    this.setSlideVisibility();

    if (this.querySelector(".announcement-bar-slider")) {
      this.announcementBarArrowButtonWasClicked = false;

      this.desktopLayout = window.matchMedia("(min-width: 750px)");
      this.reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );

      [this.reducedMotion, this.desktopLayout].forEach((mediaQuery) => {
        mediaQuery.addEventListener("change", () => {
          if (this.slider.getAttribute("data-autoplay") === "true")
            this.setAutoPlay();
        });
      });

      [this.prevButton, this.nextButton].forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            this.announcementBarArrowButtonWasClicked = true;
          },
          { once: true }
        );
      });
    }

    if (this.slider.getAttribute("data-autoplay") === "true")
      this.setAutoPlay();
  }

  setAutoPlay() {
    this.autoplaySpeed = this.slider.dataset.speed * 1000;
    this.addEventListener("mouseover", this.focusInHandling.bind(this));
    this.addEventListener("mouseleave", this.focusOutHandling.bind(this));
    this.addEventListener("focusin", this.focusInHandling.bind(this));
    this.addEventListener("focusout", this.focusOutHandling.bind(this));

    if (this.querySelector(".slideshow__autoplay")) {
      this.sliderAutoplayButton = this.querySelector(".slideshow__autoplay");
      this.sliderAutoplayButton.addEventListener(
        "click",
        this.autoPlayToggle.bind(this)
      );
      this.autoplayButtonIsSetToPlay = true;
      this.play();
    } else {
      this.reducedMotion.matches ||
        this.announcementBarArrowButtonWasClicked ||
        !this.desktopLayout.matches
        ? this.pause()
        : this.play();
    }
  }

  onButtonClick(event) {
    super.onButtonClick(event);
    const isFirstSlide = this.currentPage === 1;
    const isLastSlide = this.currentPage === this.sliderItemsToShow.length;

    if (!isFirstSlide && !isLastSlide) return;

    if (isFirstSlide && event.currentTarget.name === "previous") {
      this.slideScrollPosition =
        this.slider.scrollLeft +
        this.sliderFirstItemNode.clientWidth * this.sliderItemsToShow.length;
    } else if (isLastSlide && event.currentTarget.name === "next") {
      this.slideScrollPosition = 0;
    }
    this.slider.scrollTo({
      left: this.slideScrollPosition,
    });
  }

  update() {
    super.update();
    this.sliderControlButtons = this.querySelectorAll(".slider-counter__link");
    this.prevButton.removeAttribute("disabled");

    if (!this.sliderControlButtons.length) return;

    this.sliderControlButtons.forEach((link) => {
      link.classList.remove("slider-counter__link--active");
      link.removeAttribute("aria-current");
    });
    this.sliderControlButtons[this.currentPage - 1].classList.add(
      "slider-counter__link--active"
    );
    this.sliderControlButtons[this.currentPage - 1].setAttribute(
      "aria-current",
      true
    );
  }

  autoPlayToggle() {
    this.togglePlayButtonState(this.autoplayButtonIsSetToPlay);
    this.autoplayButtonIsSetToPlay ? this.pause() : this.play();
    this.autoplayButtonIsSetToPlay = !this.autoplayButtonIsSetToPlay;
  }

  focusOutHandling(event) {
    if (this.sliderAutoplayButton) {
      const focusedOnAutoplayButton =
        event.target === this.sliderAutoplayButton ||
        this.sliderAutoplayButton.contains(event.target);
      if (!this.autoplayButtonIsSetToPlay || focusedOnAutoplayButton) return;
      this.play();
    } else if (
      !this.reducedMotion.matches &&
      !this.announcementBarArrowButtonWasClicked &&
      this.desktopLayout.matches
    ) {
      this.play();
    }
  }

  focusInHandling(event) {
    if (this.sliderAutoplayButton) {
      const focusedOnAutoplayButton =
        event.target === this.sliderAutoplayButton ||
        this.sliderAutoplayButton.contains(event.target);
      if (focusedOnAutoplayButton && this.autoplayButtonIsSetToPlay) {
        this.play();
      } else if (this.autoplayButtonIsSetToPlay) {
        this.pause();
      }
    } else if (
      this.querySelector(".announcement-bar-slider").contains(event.target)
    ) {
      this.pause();
    }
  }

  play() {
    this.slider.setAttribute("aria-live", "off");
    clearInterval(this.autoplay);
    this.autoplay = setInterval(
      this.autoRotateSlides.bind(this),
      this.autoplaySpeed
    );
  }

  pause() {
    this.slider.setAttribute("aria-live", "polite");
    clearInterval(this.autoplay);
  }

  togglePlayButtonState(pauseAutoplay) {
    if (pauseAutoplay) {
      this.sliderAutoplayButton.classList.add("slideshow__autoplay--paused");
      this.sliderAutoplayButton.setAttribute(
        "aria-label",
        window.accessibilityStrings.playSlideshow
      );
    } else {
      this.sliderAutoplayButton.classList.remove("slideshow__autoplay--paused");
      this.sliderAutoplayButton.setAttribute(
        "aria-label",
        window.accessibilityStrings.pauseSlideshow
      );
    }
  }

  autoRotateSlides() {
    const slideScrollPosition =
      this.currentPage === this.sliderItems.length
        ? 0
        : this.slider.scrollLeft +
        this.slider.querySelector(".slideshow__slide").clientWidth;
    this.slider.scrollTo({
      left: slideScrollPosition,
    });
  }

  setSlideVisibility() {
    this.sliderItemsToShow.forEach((item, index) => {
      const linkElements = item.querySelectorAll("a");
      if (index === this.currentPage - 1) {
        if (linkElements.length)
          linkElements.forEach((button) => {
            button.removeAttribute("tabindex");
          });
        item.setAttribute("aria-hidden", "false");
        item.removeAttribute("tabindex");
      } else {
        if (linkElements.length)
          linkElements.forEach((button) => {
            button.setAttribute("tabindex", "-1");
          });
        item.setAttribute("aria-hidden", "true");
        item.setAttribute("tabindex", "-1");
      }
    });
  }

  linkToSlide(event) {
    event.preventDefault();
    const slideScrollPosition =
      this.slider.scrollLeft +
      this.sliderFirstItemNode.clientWidth *
      (this.sliderControlLinksArray.indexOf(event.currentTarget) +
        1 -
        this.currentPage);
    this.slider.scrollTo({
      left: slideScrollPosition,
    });
  }
}

customElements.define("slideshow-component", SlideshowComponent);

class VariantSelects extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("change", this.onVariantChange);
  }

  onVariantChange() {
    this.updateOptions();
    this.updateMasterId();
    this.toggleAddButton(true, "", false);
    this.updatePickupAvailability();
    this.removeErrorMessage();
    this.updateVariantStatuses();

    if (!this.currentVariant) {
      this.toggleAddButton(true, "", true);
      this.setUnavailable();
    } else {
      this.updateMedia();
      this.updateURL();
      this.updateVariantInput();
      this.renderProductInfo();
      this.updateShareUrl();
    }
  }

  updateOptions() {
    this.options = Array.from(
      this.querySelectorAll("select"),
      (select) => select.value
    );
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options
        .map((option, index) => {
          return this.options[index] === option;
        })
        .includes(false);
    });
  }

  updateMedia() {
    if (!this.currentVariant) return;
    if (!this.currentVariant.featured_media) return;

    const mediaGalleries = document.querySelectorAll(
      `[id^="MediaGallery-${this.dataset.section}"]`
    );
    mediaGalleries.forEach((mediaGallery) =>
      mediaGallery.setActiveMedia(
        `${this.dataset.section}-${this.currentVariant.featured_media.id}`,
        true
      )
    );

    const modalContent = document.querySelector(
      `#ProductModal-${this.dataset.section} .product-media-modal__content`
    );
    if (!modalContent) return;
    const newMediaModal = modalContent.querySelector(
      `[data-media-id="${this.currentVariant.featured_media.id}"]`
    );
    modalContent.prepend(newMediaModal);
  }

  updateURL() {
    if (!this.currentVariant || this.dataset.updateUrl === "false") return;
    window.history.replaceState(
      {},
      "",
      `${this.dataset.url}?variant=${this.currentVariant.id}`
    );
  }

  updateShareUrl() {
    const shareButton = document.getElementById(
      `Share-${this.dataset.section}`
    );
    if (!shareButton || !shareButton.updateUrl) return;
    shareButton.updateUrl(
      `${window.shopUrl}${this.dataset.url}?variant=${this.currentVariant.id}`
    );
  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(
      `#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`
    );
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  updateVariantStatuses() {
    let labelColor = this.querySelector("legend.form__label");
    console.log(labelColor)
    const selectedOptionOneVariants = this.variantData.filter(
      (variant) => this.querySelector(":checked").value === variant.option1
    );
    const inputWrappers = [...this.querySelectorAll(".product-form__input")];
    inputWrappers.forEach((option, index) => {
      if (index === 0) return;
      const optionInputs = [
        ...option.querySelectorAll('input[type="radio"], option'),
      ];
      const previousOptionSelected =
        inputWrappers[index - 1].querySelector(":checked").value;
      const availableOptionInputsValue = selectedOptionOneVariants
        .filter(
          (variant) =>
            variant.available &&
            variant[`option${index}`] === previousOptionSelected
        )
        .map((variantOption) => variantOption[`option${index + 1}`]);
      this.setInputAvailability(optionInputs, availableOptionInputsValue);
    });
  }

  setInputAvailability(listOfOptions, listOfAvailableOptions) {
    listOfOptions.forEach((input) => {
      if (listOfAvailableOptions.includes(input.getAttribute("value"))) {
        input.innerText = input.getAttribute("value");
      } else {
        input.innerText = window.variantStrings.unavailable_with_option.replace(
          "[value]",
          input.getAttribute("value")
        );
      }
    });
  }

  updatePickupAvailability() {
    const pickUpAvailability = document.querySelector("pickup-availability");
    if (!pickUpAvailability) return;

    if (this.currentVariant && this.currentVariant.available) {
      pickUpAvailability.fetchAvailability(this.currentVariant.id);
    } else {
      pickUpAvailability.removeAttribute("available");
      pickUpAvailability.innerHTML = "";
    }
  }

  removeErrorMessage() {
    const section = this.closest("section");
    if (!section) return;

    const productForm = section.querySelector("product-form");
    if (productForm) productForm.handleErrorMessage();
  }

  renderProductInfo() {
    const requestedVariantId = this.currentVariant.id;
    const sectionId = this.dataset.originalSection
      ? this.dataset.originalSection
      : this.dataset.section;

    fetch(
      `${this.dataset.url}?variant=${requestedVariantId}&section_id=${this.dataset.originalSection
        ? this.dataset.originalSection
        : this.dataset.section
      }`
    )
      .then((response) => response.text())
      .then((responseText) => {
        // prevent unnecessary ui changes from abandoned selections
        if (this.currentVariant.id !== requestedVariantId) return;

        const html = new DOMParser().parseFromString(responseText, "text/html");
        const destination = document.getElementById(
          `price-${this.dataset.section}`
        );
        const source = html.getElementById(
          `price-${this.dataset.originalSection
            ? this.dataset.originalSection
            : this.dataset.section
          }`
        );
        const skuSource = html.getElementById(
          `Sku-${this.dataset.originalSection
            ? this.dataset.originalSection
            : this.dataset.section
          }`
        );
        const skuDestination = document.getElementById(
          `Sku-${this.dataset.section}`
        );
        const inventorySource = html.getElementById(
          `Inventory-${this.dataset.originalSection
            ? this.dataset.originalSection
            : this.dataset.section
          }`
        );
        const inventoryDestination = document.getElementById(
          `Inventory-${this.dataset.section}`
        );

        if (source && destination) destination.innerHTML = source.innerHTML;
        if (inventorySource && inventoryDestination)
          inventoryDestination.innerHTML = inventorySource.innerHTML;
        if (skuSource && skuDestination) {
          skuDestination.innerHTML = skuSource.innerHTML;
          skuDestination.classList.toggle(
            "visibility-hidden",
            skuSource.classList.contains("visibility-hidden")
          );
        }

        const price = document.getElementById(`price-${this.dataset.section}`);

        if (price) price.classList.remove("visibility-hidden");

        if (inventoryDestination)
          inventoryDestination.classList.toggle(
            "visibility-hidden",
            inventorySource.innerText === ""
          );

        const addButtonUpdated = html.getElementById(
          `ProductSubmitButton-${sectionId}`
        );
        this.toggleAddButton(
          addButtonUpdated ? addButtonUpdated.hasAttribute("disabled") : true,
          window.variantStrings.soldOut
        );

        publish(PUB_SUB_EVENTS.variantChange, {
          data: {
            sectionId,
            html,
            variant: this.currentVariant,
          },
        });
      });
  }

  toggleAddButton(disable = true, text, modifyClass = true) {
    const productForm = document.getElementById(
      `product-form-${this.dataset.section}`
    );
    if (!productForm) return;
    const addButton = productForm.querySelector('[name="add"]');
    const addButtonText = productForm.querySelector('[name="add"] > span');
    if (!addButton) return;

    if (disable) {
      addButton.setAttribute("disabled", "disabled");
      if (text) addButtonText.textContent = text;
    } else {
      addButton.removeAttribute("disabled");
      addButtonText.textContent = window.variantStrings.addToCart;
    }

    if (!modifyClass) return;
  }

  setUnavailable() {
    const button = document.getElementById(
      `product-form-${this.dataset.section}`
    );
    const addButton = button.querySelector('[name="add"]');
    const addButtonText = button.querySelector('[name="add"] > span');
    const price = document.getElementById(`price-${this.dataset.section}`);
    const inventory = document.getElementById(
      `Inventory-${this.dataset.section}`
    );
    const sku = document.getElementById(`Sku-${this.dataset.section}`);

    if (!addButton) return;
    addButtonText.textContent = window.variantStrings.unavailable;
    if (price) price.classList.add("visibility-hidden");
    if (inventory) inventory.classList.add("visibility-hidden");
    if (sku) sku.classList.add("visibility-hidden");
  }

  getVariantData() {
    this.variantData =
      this.variantData ||
      JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }
}

customElements.define("variant-selects", VariantSelects);

class VariantRadios extends VariantSelects {
  constructor() {
    super();
  }
  connectedCallback() {
    this.selector = {
      "swatches": window.productSwatches
    }
  }

  setInputAvailability(listOfOptions, listOfAvailableOptions) {
    setTimeout(() => {
      const restockRocketButtonCover = document.querySelector('.restock-rocket-button-cover')
      const btnBy = document.querySelector('.product-form__submit')
      if (restockRocketButtonCover && btnBy) {
        btnBy.style.display = 'none'
      } else {
        btnBy.style.display = 'block'
      }
    }, 1000)
    listOfOptions.forEach((input) => {
      if (listOfAvailableOptions.includes(input.getAttribute("value"))) {
        input.classList.remove("disabled");
      } else {
        input.classList.add("disabled");
      }
    });
  }

  updateOptions() {
    const fieldsets = Array.from(this.querySelectorAll("fieldset"));
    const checkedOptions = this.querySelector('input[type="radio"]:checked');
    const labelColor = this.querySelector("legend.form__label");
    this.options = fieldsets.map((fieldset) => {
      return Array.from(fieldset.querySelectorAll("input")).find(
        (radio) => radio.checked
      ).value;
    });
  }
}

customElements.define("variant-radios", VariantRadios);
class VariantPicker extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.selector = {
      "swatches": window.productSwatches,
      "objectSwatches": {}
    }
    this.inputOptions = this.querySelectorAll('.variant-option--color')
    this.parseJsonSwatches();
    this.converToColorCode();
  }

  parseJsonSwatches() {
    if (!this.selector.swatches.length) return;
    let pairs = this.selector.swatches.split(',');
    let jsonObjectSwatches = {};

    pairs.forEach(function (pair) {
      const keyValue = pair.split(':');
      const key = keyValue[0].trim();
      const value = keyValue[1].trim();
      jsonObjectSwatches[key] = value;
    });
    this.selector.objectSwatches = JSON.stringify(jsonObjectSwatches);
  }
  converToColorCode() {
    let parseSwatches = JSON.parse(this.selector.objectSwatches);
    this.inputOptions.forEach(option => {
      const optionName = option.value.toLowerCase().replace(/[^\w\s]/g, ' ');
      const regex = /[^a-z0-9]+/g;
      let optionVal = optionName.replace(regex, '');
      for (const [key, value] of Object.entries(parseSwatches)) {
        const slug = key.replace(regex, '');
        if (slug === optionVal) {
          if (!value) return;
          option.nextElementSibling.style.backgroundColor = `${value}`;
        }
      }
    })
  }
}

customElements.define("variant-picker", VariantPicker);

class VariantSwiper extends HTMLElement {
  constructor() {
    super();
    let optionList = this.querySelectorAll("card-variant-radios .product-form__input input[name='size']");
    this.dummySizeSelector = document.querySelector(".cart-drawer__size-selector-mb");
    this.dummyOverlay = document.querySelector(".cart-drawer__size-selector-mb .rocket-system-product-card__overlay");
    this.isPDP = this.closest("drag-product-info");
    this.isPDP = this.closest("list-dragging") ? null : this.isPDP;
    this.isAccordion = this.closest("list-dragging");
    if ((!this.isPDP && optionList.length > 4) || (this.isPDP && optionList.length > 6) || (this.isAccordion && optionList.length > 3)) {
      let selector = "#" + this.id + " card-variant-radios";
      this.nextBtn = this.querySelector(".variant-swiper-button-next");
      this.prevBtn = this.querySelector(".variant-swiper-button-prev");
      this.nextBtn.classList.remove("visually-hidden");
      this.prevBtn.classList.remove("visually-hidden");
      let slidesPerViewOption = this.isPDP ? 6 : 4;
      if (this.isAccordion) {
        slidesPerViewOption = 3;
      }
      this.swiper = new Swiper(selector, {
        slidesPerView: slidesPerViewOption,
        allowTouchMove: false,
        navigation: {
          nextEl: "#" + this.id + ' .variant-swiper-button-next',
          prevEl: "#" + this.id + ' .variant-swiper-button-prev'
        }
      })
    } else {
      this.querySelectorAll(".swiper-slide").forEach(el => {
        if (this.querySelector("fieldset.fieldset-active")) {
          this.querySelector("fieldset.fieldset-active").classList.add("swiper-inactive-mb");
        }
        this.classList.add("rocket-system-product-card_radius");
        if (optionList.length == 1 && this.querySelector("fieldset.fieldset-active")) {
          this.querySelector("fieldset.fieldset-active").classList.add("swiper-only-one-option");
        }
      });
      if (this.isPDP && optionList.length < 6) {

        let inactiveClass = (optionList.length == 5) ? "swiper-container-inactive-5" : "swiper-container-inactive-4"
        if (this.querySelector("card-variant-radios")) {
          this.querySelector("card-variant-radios").classList.add(inactiveClass)
        }
      }
    }

    // add close popup event if dummy selector
    if (this.closest(".cart-drawer__size-selector-mb")) {
      this.querySelector(".rocket-system-product-card__size-close").addEventListener("click", () => {
        this.closeModal();
      });
    }
  }

  closeModal() {
    console.log("close modal")
    document.querySelector("body").style.overflowY = "unset";
    if (this.dummyOverlay) {
      this.dummyOverlay.style.display = "none";
    }
    document.querySelectorAll("variant-swiper").forEach(el => {
      el.classList.remove("open");
    })
    if (document.querySelector(".rocket-system-product-card__overlay")) {
      document.querySelectorAll(".rocket-system-product-card__overlay").forEach((overlay) => {
        overlay.style.display = 'none';
      })
    }
  }
}

customElements.define("variant-swiper", VariantSwiper);

class CardVariantRadios extends VariantRadios {
  constructor() {
    super();
    this.isQuickAddInPdp = this.closest("product-info");
    this.isQuickAddInPdp = this.closest("list-dragging") ? null : this.isQuickAddInPdp;
    this.cartDrawer = document.querySelector("cart-drawer");
    this.addEventListener("mousedown", (event) => {
      event.stopPropagation();
    });
    this.querySelectorAll('.variant').forEach(el => {
      el.addEventListener("click", (event) => {
        let input = event.currentTarget.querySelector("input");
        console.log(input.getAttribute('disabled'));
        if (input.hasAttribute('disabled')) {
          this.showNotification();
        }
      })
    })
  }

  showNotification() {
    if (this.closest('product-card') || this.closest('.mobile-selection-wrapper')) {
      let productCard = this.closest('product-card') || this.closest('.mobile-selection-wrapper')?.cardParent;
      console.log(productCard)

      let notiButton = productCard.querySelector('.restock-rocket-button');
      if (notiButton) notiButton.click();

    }

  }
  onVariantChange(event) {
    if(this.closest("variant-swiper.rocket-product-stl")) {
        if (event.target && event.target.getAttribute("name") == "color") {
            return;
        }
        if (this.isQuickAddInPdp) {
            this.cartDrawer.setAttribute("added-open-cart", "false");
        }
        this.setDefaultColor();
        this.updateOptions();
        this.updateMasterId();
        this.updateVariantInput(true);
        this.resetSizeCheck();
        if (screen.width < 1024) {
            let productCardEl = this.closest("product-card") || this.closest("drag-product-info");
            if (productCardEl) {
                productCardEl.closeModal();
            }
        }
        this.closeInterested();
    } else {
        if (event.target && event.target.getAttribute("name") == "color") {
            return;
        }
        if (this.isQuickAddInPdp) {
            this.cartDrawer.setAttribute("added-open-cart", "false");
        }
        this.setDefaultColor();
        this.updateOptions();
        this.updateMasterId();
        this.updateVariantInput();
        this.submitCart();
        this.resetSizeCheck();
        if (screen.width < 1024) {
            let productCardEl = this.closest("product-card") || this.closest("drag-product-info");
            if (productCardEl) {
                productCardEl.closeModal();
            }
        }
        this.closeInterested();
    }
  }

  setDefaultColor() {
    let checkedInput = this.querySelector("fieldset.fieldset-color input[type=radio]:checked");
    if (!checkedInput) {
      let firstColorInput = this.querySelector("fieldset.fieldset-color input[type=radio]");
      if (firstColorInput) {
        firstColorInput.checked = true;
      }
    }
  }

  resetSizeCheck() {
    const fieldsets = this.querySelectorAll("fieldset.fieldset-active input");
    fieldsets.forEach(el => {
      el.checked = false;
    })
  }

  submitCart() {
    const addToCartBtn = this.querySelector("button[name='add']");
    addToCartBtn.click();
  }

  updateVariantInput(value) {
    const productForms = document.querySelectorAll(
      `#product-form-${this.dataset.section}-${this.dataset.product},#product-form-${this.dataset.section}-${this.dataset.product}-${this.dataset.vendor}`
    );
    productForms.forEach((productForm) => {    
        const input = productForm.querySelector('input[name="id"]');
        input.removeAttribute('checked');
    });
    productForms.forEach((productForm) => {
        const input = productForm.querySelector('input[name="id"]');
        input.value = this.currentVariant.id;
        if(value && input) {
            input.setAttribute('checked');
        }
        // this.sectionInterested.classList.remove('open','flex');
        // this.messageVariant.innerHTML = this.getSizeOption(this.currentVariant.title);
    });
  }
  closeInterested() {
    let isInterested = this.closest("product-interested");
    if (isInterested) {
      document.querySelector("cart-drawer").open();
    }
  }

}

customElements.define("card-variant-radios", CardVariantRadios);

class STLDOT extends HTMLElement {
    constructor() {
      super();
      this.summary = this.querySelector('.rocket-stl__wrapper__dot__summary');
      this.details = this.querySelector('.rocket-stl__wrapper__dot__details');
      this.summary.addEventListener('click', this.handleClick.bind(this));
      document.addEventListener('click', event => {
        if (!this.contains(event.target) ) {
            this.style.zIndex = '1';
          this.classList.remove('active');
          this.details.classList.remove('overx');
        }
      });
    }
  
    handleClick() {
      console.log(this.checkOffscreenWidth())
      if(this.checkOffscreenWidth()) {
        this.details.classList.toggle('overx');
      }
      if(this.checkOffscreenHeight()) {
        this.details.classList.toggle('overy');
      }
      this.classList.toggle('active');
      this.style.zIndex = '2';
    }
  
    checkOffscreenWidth() {
      this.detailsPosition = this.details.getBoundingClientRect();
      this.sectionWidth = document.querySelector('.rocket-stl__wrapper').clientWidth;
      this.offsetRight = this.sectionWidth - this.summary.clientWidth - 6 - this.offsetLeft;
      console.log(this.offsetRight, this.detailsPosition.width)
  
      return this.offsetRight < this.detailsPosition.width;
    } 
    checkOffscreenHeight() {
      this.detailsPosition = this.details.getBoundingClientRect();
      this.sectionHeight = document.querySelector('.rocket-stl__wrapper').clientHeight;
      this.offsetBottom = this.sectionHeight - this.offsetTop;
  
      return this.offsetBottom < this.detailsPosition.height;
    } 
}
  
customElements.define("stl-dot", STLDOT);

class ProductCard extends HTMLElement {
  constructor() {
    super();
    this.openCartBtn = this.querySelector(".rocket-system-product-card__btn-cart");
    this.sizeSelector = this.querySelector("variant-swiper");
    let optionList = this.querySelectorAll("card-variant-radios .product-form__input input[name='size']");
    // this.overlay = this.querySelector(".rocket-system-product-card__overlay");
    this.closeCartBtn = this.querySelector(".rocket-system-product-card__size-close");

    if (this.openCartBtn) {
      this.openCartBtn.addEventListener("click", () => {
        this.wrapper.body ? this.wrapper.body.style.overflowY = "hidden" : this.wrapper.style.overflowY = "hidden";
        if (this.closest('section')) {
          this.closest('section').classList.add('choosing-size');
        }
        if (optionList.length == 1) {
          optionList.forEach(el => {
            el.click();
          })
          return;
        }
        let mobileSelection = this.wrapper.querySelector('.mobile-selection-wrapper');
        if (!mobileSelection) {
          mobileSelection = document.createElement("div");
          mobileSelection.classList.add("mobile-selection-wrapper");
          this.wrapper.body ? this.wrapper.body.appendChild(mobileSelection) : this.wrapper.appendChild(mobileSelection);
        }
        mobileSelection.innerHTML = ''
        this.mobileSizeSelector = this.sizeSelector.cloneNode(true);
        this.mobileSizeSelector.cardParent = this;
        this.mobileSizeSelector.classList.add("mobile-size-selector");
        mobileSelection.appendChild(this.mobileSizeSelector);
        mobileSelection.cardParent = this;

        this.overlay.style.display = "block";
        this.mobileSizeSelector.classList.add("open");
      });
    }

    if (this.closeCartBtn) {
      this.closeCartBtn.addEventListener("click", () => {
        this.closeModal(this.openCartBtn.getAttribute("data-product-id"));
      });
    }

    if (this.overlay) {
      this.overlay.addEventListener("click", () => {
        this.closeModal(this.openCartBtn.getAttribute("data-product-id"));
      })
    }
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (this.swiper) this.swiper.destroy();
          this.swiper = new Swiper(this.querySelector(".product-card__swiper"), {
            slidesPerView: 1,
            navigation: {
              nextEl: this.querySelector(".product-card__swiper-button-next"),
              prevEl: this.querySelector(".product-card__swiper-button-prev"),
            },
          });
          this.addEventListener("mouseenter", () => {
            if (this.swiper.activeIndex == 0 && window.innerWidth > 768) {
              this.swiper.slideTo(1);
            }
          })
          this.addEventListener("mouseleave", () => {
            if (this.swiper.activeIndex == 1 && window.innerWidth > 768) {
              this.swiper.slideTo(0);
            }
          })
          this.observer.disconnect(); // Stop observing after attribute removal
        }
      });
    });

  }
  connectedCallback() {
    if (this.closest('cart-drawer')) {
      this.wrapper = this.closest('.drawer__inner');
    } else {
      this.wrapper = document;
    }

    if (this.querySelector(".product-card__swiper")) this.observer.observe(this);

    this.overlay = this.wrapper.querySelector('.product-card-overlay');
    if (!this.overlay) {
      this.overlay = document.createElement("div");
      this.overlay.classList.add("product-card-overlay");
      this.wrapper.body ? this.wrapper.body.appendChild(this.overlay) : this.wrapper.appendChild(this.overlay);
    }
    this.overlay?.addEventListener("click", () => {
      this.closeModal(this.openCartBtn.getAttribute("data-product-id"));
    })

    // if(this.clone == true) return;
    // this.mobileSizeSelector = this.sizeSelector.cloneNode(true);
    // this.mobileSizeSelector.classList.add("mobile-size-selector");
    // document.body.appendChild(this.mobileSizeSelector);
    // this.clone = true;
  }


  closeModal(productId) {
    this.overlay.style.display = "none";
    document.querySelectorAll('.mobile-size-selector').forEach(el => {
      el.classList.remove("open");
    })
    if (this.closest('section')) {
      this.closest('section').classList.remove('choosing-size')
    }
    this.wrapper.body ? this.wrapper.body.style.overflowY = "unset" : this.wrapper.style.overflowY = "auto";
  }
}

customElements.define("product-card", ProductCard);

function restockInit() {
  if (!window._RestockRocketConfig) return;

  window._RestockRocketConfig.rendered = false
  window._RestockRocketConfig.pageType = 'collection'
  let script = document.createElement('script')
  script.src = window._RestockRocketConfig.scriptUrlCollection
  document.body.appendChild(script)
}