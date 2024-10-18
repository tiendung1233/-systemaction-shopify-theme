class GalleryCollection extends HTMLElement {
  constructor() {
    super()
  }

  init() {
    let numberProductDisplay = this.getAttribute('number_product_display')
    const itemLoadMore = this.getAttribute('item_load_more')
    for (let index = 0; index < numberProductDisplay; index++) {
      this.querySelector(`.product-item-${index + 1}`).style.display = 'block'
    }
    const btnLoadMore = this.querySelector('.load_more')
    console.log('numberProductDisplay', numberProductDisplay);
    if (btnLoadMore) {
      btnLoadMore.addEventListener("click", (event) => {
        event.preventDefault();
        numberProductDisplay = Number(numberProductDisplay) + Number(itemLoadMore)
        console.log('numberProductDisplay', numberProductDisplay);
        for (let index = 1; index < numberProductDisplay; index++) {
          const item = this.querySelector(`.product-item-${index + 1}`)
          if (item) {
            item.style.display = 'block'
          }
        }
      });
    }

  }

  connectedCallback() {
    this.init()
  }
}

customElements.define('gallery-collection', GalleryCollection)