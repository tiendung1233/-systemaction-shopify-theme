class DetailsModal extends HTMLElement {
  constructor() {
    super();
    this.detailsContainer = this.querySelector('details');
    this.summaryToggle = this.querySelector('summary');

    this.detailsContainer.addEventListener('keyup', (event) => event.code.toUpperCase() === 'ESCAPE' && this.close());
    this.summaryToggle.addEventListener('click', this.onSummaryClick.bind(this));

    this.summaryToggle.setAttribute('role', 'button');
  }

  isOpen() {
    return this.detailsContainer.hasAttribute('open');
  }

  onSummaryClick(event) {
    event.preventDefault();
    event.target.closest('details').hasAttribute('open') ? this.close() : this.open(event);
  }

  onBodyClick(event) {
    if (!this.contains(event.target) || event.target.classList.contains('modal-overlay')) this.close(false);
  }

  open(event) {
    this.onBodyClickEvent = this.onBodyClickEvent || this.onBodyClick.bind(this);
    event.target.closest('details').setAttribute('open', true);
    document.body.addEventListener('click', this.onBodyClickEvent);
    document.body.classList.add('overflow-hidden');
    const inputSearch = this.querySelector('.field')
    const viewportWidth = window.innerWidth;
    const desiredWidthPercentage = 20;
    let elementWidth = (viewportWidth * desiredWidthPercentage) / 100;
    let rect = this.getBoundingClientRect();

    let heightRelativeToViewport = rect.top;
    inputSearch.style.top = `${heightRelativeToViewport}px`
    if (viewportWidth > 1200) {
      inputSearch.style.width = elementWidth + 'px';
    } else if (viewportWidth > 1080) {
      inputSearch.style.width = (viewportWidth * 15) / 100 + 'px';
    }
    else {
      // inputSearch.style.width = (viewportWidth * 10) / 100 + 'px';
    }
    trapFocus(
      this.detailsContainer.querySelector('[tabindex="-1"]'),
      this.detailsContainer.querySelector('input:not([type="hidden"])')
    );
  }

  close(focusToggle = true) {
    removeTrapFocus(focusToggle ? this.summaryToggle : null);
    this.detailsContainer.removeAttribute('open');
    document.body.removeEventListener('click', this.onBodyClickEvent);
    document.body.classList.remove('overflow-hidden');
  }
}

customElements.define('details-modal', DetailsModal);
