class StickyVariantSelector {
  constructor() {
    this.init();
  }

  /**
    * Initializes the event listeners and setups up the initial state when the document is ready.
    */
  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.addToCartButton = document.querySelector('.product-form-mobile__submit');
      this.variantIdInput = document.querySelector('.product-variant-id.sticky-mobile');
      this.selectElement = document.querySelector('.product-form__variant-picker');
      this.sizeOptions = document.querySelector('.sticky-size-options');
      this.selectTrigger = document.querySelector('.sticky-select__trigger');
      this.stickyOption = document.querySelectorAll('.sticky-option');
      this.variantColor = document.querySelectorAll('.variant-option--color');
      this.body = document.body;
      this.stickyForm = document.querySelector('.main-product-sticky-form');
      this.footer = document.querySelector('.footer');
      this.setupEventListeners();
      this.setupClickOutsideListeners();
      this.setupScrollListener();
      this.updateSizesBasedOnColor();
    });
  }

  /**
    * Sets up event listeners for the variant select element and its options.
    */
  setupEventListeners() {
    if (this.selectElement) {
      this.selectElement.addEventListener('click', () => {
        this.selectElement.classList.toggle('active');
        this.sizeOptions.classList.toggle('active');
        this.body.classList.toggle('select-sizes-active');
      });
    }

    if (this.stickyOption) {
      this.stickyOption.forEach(option => {
        option.addEventListener('click', () => this.handleOptionClick(option));
      });
    }

    // Add event listener for color options
    if (this.variantColor) {
      this.variantColor.forEach(option => {
        option.addEventListener('click', () => {
          this.updateSizesBasedOnColor();
        });
      });
    }
  }

  /**
    * Handles click events on each variant option.
    * @param {HTMLElement} option - The option element that was clicked.
    */
  handleOptionClick(option) {
    if (!option.classList.contains('selected')) {
      const stickyTitle = option.querySelector('.sticky-title');
      if (option.classList.contains('sold-out')) {
        this.selectTrigger.textContent = `${stickyTitle.textContent} - ${option.getAttribute('description')}`;
      } else {
        this.selectTrigger.textContent = stickyTitle.textContent;
      }
      this.updateButtonState(option);
      this.closeDropdowns();
    }
  }

  /**
    * Updates the state of the add-to-cart button based on the selected option.
    * @param {HTMLElement} option - The option element that determines the new state of the button.
    */
  updateButtonState(option) {
    this.addToCartButton.classList.remove('not-active');
    if (option.classList.contains('sold-out')) {
      this.addToCartButton.querySelector('span').innerText = option.getAttribute('title');
      this.addToCartButton.disabled = true;
      this.selectElement.classList.add('sold-out');
    } else {
      this.variantIdInput.value = option.getAttribute('value');
      this.addToCartButton.querySelector('span').innerText = option.getAttribute('title');
      this.addToCartButton.disabled = false;
      this.addToCartButton.value = option.getAttribute('value');
      this.selectElement.classList.remove('sold-out');
    }
  }

  /**
    * Sets up click outside event listeners for specified elements.
    */
  setupClickOutsideListeners() {
    document.addEventListener('click', (event) => {
      if (!this.selectElement.contains(event.target) && !this.sizeOptions.contains(event.target)) {
        this.closeDropdowns();
      }
    });
  }

  /**
    * Sets up a scroll event listener to hide the sticky form when it overlaps the footer.
    */
  setupScrollListener() {
    let debounceTimer;
    window.addEventListener('scroll', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (this.stickyForm && this.footer) {
          const stickyRect = this.stickyForm.getBoundingClientRect();
          const footerRect = this.footer.getBoundingClientRect();

          // Use classList with a capital L
          if (stickyRect.bottom >= footerRect.top) {
            this.stickyForm.classList.add('hide');
          } else {
            this.stickyForm.classList.remove('hide');
          }
        }
      }, 100);
    });
  }

  /**
    * Closes dropdown elements by removing 'active' class if they are open.
    */
  closeDropdowns() {
    if (this.selectElement.classList.contains('active')) {
      this.selectElement.classList.remove('active');
      this.sizeOptions.classList.remove('active');
      this.body.classList.remove('select-sizes-active');
    }
  }

  /**
    * Updates the sizes based on the selected color variant.
    */
  updateSizesBasedOnColor() {
    // Get the value of the selected color variant
    const selectedColorVariantId = document.querySelector('.variant-option--color:checked').value;

    // Loop through the variants in the stickybar and check the color
    if (selectedColorVariantId && this.variantColor) {
      this.stickyOption.forEach(stickyVariant => {
        const variantColorId = stickyVariant.getAttribute('color_id');
        if (variantColorId !== selectedColorVariantId) {
          stickyVariant.classList.add('disable');
        } else {
          stickyVariant.classList.remove('disable');
        }
      });
    }
  }
}

new StickyVariantSelector();
