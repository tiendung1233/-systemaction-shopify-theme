class FacetFiltersForm extends HTMLElement {
  constructor() {
    super();
    this.onActiveFilterClick = this.onActiveFilterClick.bind(this);

    this.debouncedOnSubmit = debounce((event) => {
      if(event.target.name == 'sort_by'){
      this.onSubmitHandler(event);
      } 
    }, 500);
    this.querySelectorAll('.facets-apply').forEach((element) => {
      element.addEventListener('click', this.onSubmitHandler.bind(this));
    });
    const facetForm = this.querySelector('form');
    facetForm.addEventListener('input', this.debouncedOnSubmit.bind(this));

    const facetWrapper = this.querySelector('#FacetsWrapperDesktop');
    if (facetWrapper) facetWrapper.addEventListener('keyup', onKeyUpEscape);
  }

  static setListeners() {
    const onHistoryChange = (event) => {
      const searchParams = event.state ? event.state.searchParams : FacetFiltersForm.searchParamsInitial;
      if (searchParams === FacetFiltersForm.searchParamsPrev) return;
      FacetFiltersForm.renderPage(searchParams, null, false);
    };
    window.addEventListener('popstate', onHistoryChange);
  }

  static toggleActiveFacets(disable = true) {
    document.querySelectorAll('.js-facet-remove').forEach((element) => {
      element.classList.toggle('disabled', disable);
    });
  }

  static renderPage(searchParams, event, updateURLHash = true) {
    FacetFiltersForm.searchParamsPrev = searchParams;
    const sections = FacetFiltersForm.getSections();
    const countContainer = document.getElementById('ProductCount');
    const countContainerDesktop = document.getElementById('ProductCountDesktop');
    document.getElementById('ProductGridContainer').querySelector('.collection').classList.add('loading');
    if (countContainer) {
      countContainer.classList.add('loading');
    }
    if (countContainerDesktop) {
      countContainerDesktop.classList.add('loading');
    }

    sections.forEach((section) => {
      const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
      const filterDataUrl = (element) => element.url === url;

      FacetFiltersForm.filterData.some(filterDataUrl)
        ? FacetFiltersForm.renderSectionFromCache(filterDataUrl, event)
        : FacetFiltersForm.renderSectionFromFetch(url, event);
    });


    if (updateURLHash) FacetFiltersForm.updateURLHash(searchParams);
  }

  static renderSectionFromFetch(url, event) {
    fetch(url)
      .then((response) => response.text())
      .then((responseText) => {
        const html = responseText;
        FacetFiltersForm.filterData = [...FacetFiltersForm.filterData, { html, url }];
        FacetFiltersForm.renderFilters(html, event);
        FacetFiltersForm.renderProductGridContainer(html);
        // FacetFiltersForm.renderProductCount(html);
        if (typeof initializeScrollAnimationTrigger === 'function') initializeScrollAnimationTrigger(html.innerHTML);
      });
  }

  static renderSectionFromCache(filterDataUrl, event) {
    const html = FacetFiltersForm.filterData.find(filterDataUrl).html;
    FacetFiltersForm.renderFilters(html, event);
    FacetFiltersForm.renderProductGridContainer(html);
    // FacetFiltersForm.renderProductCount(html);
    if (typeof initializeScrollAnimationTrigger === 'function') initializeScrollAnimationTrigger(html.innerHTML);
  }

  static renderProductGridContainer(html) {
    document.getElementById('ProductGridContainer').innerHTML = new DOMParser()
      .parseFromString(html, 'text/html')
      .getElementById('ProductGridContainer').innerHTML;

    document
      .getElementById('ProductGridContainer')
      .querySelectorAll('.scroll-trigger')
      .forEach((element) => {
        element.classList.add('scroll-trigger--cancel');
      });
      document.dispatchEvent(new CustomEvent('ajaxinate:loaded'));
      new Ajaxinate({
        container: '#product-grid',
        pagination: '#AjaxinatePagination',
        offset: 0,
        method: 'click',
        callback: function(e) {
          // Callback function
          window.history.pushState(null,'',  e.URL);
          document.dispatchEvent(new CustomEvent('ajaxinate:loaded', { detail: e }));
        }
      });
  }

  static renderProductCount(html) {
    const count = new DOMParser().parseFromString(html, 'text/html').getElementById('ProductCount').innerHTML;
    const container = document.getElementById('ProductCount');
    const containerDesktop = document.getElementById('ProductCountDesktop');
    container.innerHTML = count;
    container.classList.remove('loading');
    if (containerDesktop) {
      containerDesktop.innerHTML = count;
      containerDesktop.classList.remove('loading');
    }
  }

  static renderFilters(html, event) {
    const parsedHTML = new DOMParser().parseFromString(html, 'text/html');

    const facetDetailsElements = parsedHTML.querySelectorAll(
      '#FacetFiltersForm .js-filter, #FacetFiltersFormMobile .js-filter, #FacetFiltersPillsForm .js-filter'
    );
    const matchesIndex = (element) => {
      const jsFilter = event ? event.target.closest('.js-filter') : undefined;
      return jsFilter ? element.dataset.index === jsFilter.dataset.index : false;
    };
    const facetsToRender = Array.from(facetDetailsElements).filter((element) => !matchesIndex(element));
    const countsToRender = Array.from(facetDetailsElements).find(matchesIndex);
    facetsToRender.forEach((element) => {
      document.querySelector(`.js-filter[data-index="${element.dataset.index}"]`).innerHTML = element.innerHTML;
    });

    FacetFiltersForm.renderActiveFacets(parsedHTML);
    FacetFiltersForm.renderAdditionalElements(parsedHTML);

    if (countsToRender) FacetFiltersForm.renderCounts(countsToRender, event.target.closest('.js-filter'));
    publish('facets:change');

  }

  static renderActiveFacets(html) {
    const activeFacetElementSelectors = ['.active-facets-mobile', '.active-facets-desktop'];

    activeFacetElementSelectors.forEach((selector) => {
      const activeFacetsElement = html.querySelector(selector);
      if (!activeFacetsElement) return;
      document.querySelector(selector).innerHTML = activeFacetsElement.innerHTML;
    });

    FacetFiltersForm.toggleActiveFacets(false);
  }

  static renderAdditionalElements(html) {
    const mobileElementSelectors = ['.mobile-facets__open', '.mobile-facets__count', '.sorting'];

    mobileElementSelectors.forEach((selector) => {
      if (!html.querySelector(selector)) return;
      document.querySelector(selector).innerHTML = html.querySelector(selector).innerHTML;
    });

    document.getElementById('FacetFiltersFormMobile').closest('facets-drawer').bindEvents();
  }

  static renderCounts(source, target) {
    const targetElement = target.querySelector('.facets__selected');
    const sourceElement = source.querySelector('.facets__selected');

    const targetElementAccessibility = target.querySelector('.facets__summary');
    const sourceElementAccessibility = source.querySelector('.facets__summary');

    if (sourceElement && targetElement) {
      target.querySelector('.facets__selected').outerHTML = source.querySelector('.facets__selected').outerHTML;
    }

    if (targetElementAccessibility && sourceElementAccessibility) {
      target.querySelector('.facets__summary').outerHTML = source.querySelector('.facets__summary').outerHTML;
    }
  }

  static updateURLHash(searchParams) {
    history.pushState({ searchParams }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
  }

  static getSections() {
    return [
      {
        section: document.getElementById('product-grid').dataset.id,
      },
    ];
  }

  createSearchParams(form) {
    const formData = new FormData(form);
    return new URLSearchParams(formData).toString();
  }

  onSubmitForm(searchParams, event) {
    FacetFiltersForm.renderPage(searchParams, event);
  }

  onSubmitHandler(event) {
    event.preventDefault();
    if(event.target.type === 'button'){
    let button = event.target
      if(button.classList.contains('desktop-facets__apply')){
        document.querySelector('facet-open')?.click()
      }
      if(button.classList.contains('mobile-facets__apply')){
        button.closest('.mobile-facets__wrapper').querySelector('summary').click()
      }
      
    }
    const sortFilterForms = document.querySelectorAll('facet-filters-form form');
    if (event.srcElement.className == 'mobile-facets__checkbox') {
      const searchParams = this.createSearchParams(event.target.closest('form'));
      this.onSubmitForm(searchParams, event);
    } else {
      const forms = [];
      const isMobile = event.target.closest('form').id === 'FacetFiltersFormMobile';

      sortFilterForms.forEach((form) => {
        if (!isMobile) {
          if (form.id === 'FacetSortForm' || form.id === 'FacetFiltersForm' || form.id === 'FacetSortDrawerForm') {
            const noJsElements = document.querySelectorAll('.no-js-list');
            noJsElements.forEach((el) => el.remove());
            forms.push(this.createSearchParams(form));
          }
        } else if (form.id === 'FacetFiltersFormMobile') {
          forms.push(this.createSearchParams(form));
        }
      });
      this.onSubmitForm(forms.join('&'), event);
    }
  }

  onActiveFilterClick(event) {
    event.preventDefault();
    FacetFiltersForm.toggleActiveFacets();
    const url =
      event.currentTarget.href.indexOf('?') == -1
        ? ''
        : event.currentTarget.href.slice(event.currentTarget.href.indexOf('?') + 1);
    FacetFiltersForm.renderPage(url);
  }
}

FacetFiltersForm.filterData = [];
FacetFiltersForm.searchParamsInitial = window.location.search.slice(1);
FacetFiltersForm.searchParamsPrev = window.location.search.slice(1);
customElements.define('facet-filters-form', FacetFiltersForm);
FacetFiltersForm.setListeners();

class PriceRange extends HTMLElement {
  constructor() {
    super();
    this.querySelectorAll('input').forEach((element) =>
      element.addEventListener('change', this.onRangeChange.bind(this))
    );
    this.setMinAndMaxValues();
  }

  onRangeChange(event) {
    this.adjustToValidValues(event.currentTarget);
    this.setMinAndMaxValues();
  }

  setMinAndMaxValues() {
    const inputs = this.querySelectorAll('input');
    const minInput = inputs[0];
    const maxInput = inputs[1];
    if (maxInput.value) minInput.setAttribute('max', maxInput.value);
    if (minInput.value) maxInput.setAttribute('min', minInput.value);
    if (minInput.value === '') maxInput.setAttribute('min', 0);
    if (maxInput.value === '') minInput.setAttribute('max', maxInput.getAttribute('max'));
  }

  adjustToValidValues(input) {
    const value = Number(input.value);
    const min = Number(input.getAttribute('min'));
    const max = Number(input.getAttribute('max'));

    if (value < min) input.value = min;
    if (value > max) input.value = max;
  }
}

customElements.define('price-range', PriceRange);

class FacetRemove extends HTMLElement {
  constructor() {
    super();
    const facetLink = this.querySelector('a');
    facetLink.setAttribute('role', 'button');
    facetLink.addEventListener('click', this.closeFilter.bind(this));
    facetLink.addEventListener('keyup', (event) => {
      event.preventDefault();
      if (event.code.toUpperCase() === 'SPACE') this.closeFilter(event);
    });
  }

  closeFilter(event) {
    event.preventDefault();
    console.log(this.querySelector('a').getAttribute('href'));
    const form = this.closest('facet-filters-form') || document.querySelector('facet-filters-form');
    form.onActiveFilterClick(event);
    if(this.classList.contains('desktop-facets__clear-wrapper')){
      document.querySelector('facet-open').click();
    }
    if(this.classList.contains('mobile-facets__clear-wrapper')){
      this.closest('.mobile-facets__wrapper').querySelector('summary').click()
    }
    
  }
}

customElements.define('facet-remove', FacetRemove);

class FacetOpen extends HTMLElement {
    constructor() {
        super();
        this.addEventListener('click', this.openFilter.bind(this));
    }
  
    openFilter(event) {
        event.preventDefault();
        const form = document.getElementById('FacetsWrapperDesktop');
        form.classList.toggle('active');
        event.currentTarget.classList.toggle('active');
        const sort = document.querySelector('.facet-filters__sort')
        if(sort) form.classList.contains('active') ? sort.removeAttribute('open') : sort.removeAttribute('open');
    }
}
  
customElements.define('facet-open', FacetOpen);

class FacetsDrawer extends MenuDrawer{
  constructor() {
    super();
    this.querySelectorAll('.menu-drawer__close').forEach((element) => { 
      element.addEventListener('click', this.triggerCloseMenu.bind(this));
    })
    this.querySelectorAll('.mobile-facets__overlay').forEach((element) => { 
      element.addEventListener('click', this.triggerCloseMenu.bind(this));
    })
     
  }
  openMenuDrawer(summaryElement) {
    super.openMenuDrawer(summaryElement);
    document.querySelector('body').classList.add('facets-show');
  }
  closeMenuDrawer(event, elementToFocus) {
    console.log(event);
    super.closeMenuDrawer(event, elementToFocus);
    setTimeout(() => {
    document.querySelector('body').classList.remove('facets-show');
    }, 300)
  }
  onFocusOut(){

  }

  triggerCloseMenu(event, elementToFocus = false) {
    this.querySelector('.mobile-facets__open-wrapper').click();
    setTimeout(() => {
    document.querySelector('body').classList.remove('facets-show');
    }, 300)
  }
   
}
customElements.define('facets-drawer', FacetsDrawer);

class FacetSort extends HTMLElement {
  constructor() {
    super();
    this.querySelector('summary').addEventListener('click', this.onSummaryClick.bind(this));
    this.querySelectorAll('.facets__sort-option').forEach((element) => {  
      element.addEventListener('click', this.onSortChange.bind(this));
    } );
  }
  onSummaryClick(event) { 
    const details = event.target.closest('details');
    const form = document.getElementById('FacetsWrapperDesktop');
    if(!details.hasAttribute('open') && form.classList.contains('active')){
      document.querySelector('facet-open').click();
    }

  }
  onSortChange(event) {
      this.querySelectorAll('.facets__sort-option').forEach((element) => {
          element.classList.remove('selected');
      })
      event.currentTarget.classList.add('selected');
      let select = document.querySelector('facet-filters-form select[name="sort_by"]')
      select.value = event.currentTarget.dataset.value;
      select.dispatchEvent(new Event('input', {
        bubbles: true,
        cancelable: true
    }));
      const details = event.target.closest('details');
      details.removeAttribute('open');
  }
}
customElements.define('facet-sort', FacetSort);

class FacetDesktop extends HTMLElement {
  constructor() {
    super();
    this.querySelector('.desktop-facets__close').addEventListener('click', () =>{
      this.querySelector('facet-open').click();
    } )
    subscribe('facets:change', ()=>{
      console.log('facets:change')
      let form = this.querySelector('#FacetFiltersForm')
      let breadcrumbs = document.querySelector('.gigi-breadcrumbs')
      if(this.querySelectorAll('.active-facets facet-remove').length > 1){
        form.classList.add('filter-active')
        breadcrumbs.classList.add('filter-active')
      }else{
        form.classList.remove('filter-active')
        breadcrumbs.classList.remove('filter-active')
      }
     
      
    })
  }

 
} 
customElements.define('facet-filters-desktop', FacetDesktop);

class FacetLayouts extends HTMLElement {
  constructor() {
    super();
    this.querySelectorAll('.layout-switch__item').forEach((element) => {
      element.addEventListener('click', this.changeLayout.bind(this));
    })
    if(!this.closest('.layout-switch-placeholder')){
    window.addEventListener('resize', this.cloneLayout.bind(this)); 
    this.cloneLayout();
    }
   
  }
  
  cloneLayout() {
    if(window.movedLayout) return
    window.movedLayout = true;
    document.querySelectorAll('.layout-switch-placeholder').forEach((element) => {  
      element.innerHTML = '';
      element.appendChild(this.cloneNode(true));  
    })
  }
  changeLayout(e) {
    let layout = e.currentTarget

    let unSelectedLayout = []
    this.querySelectorAll('.layout-switch__item').forEach((element) => {
      if(element != layout){
        unSelectedLayout.push(`product-grid--${element.dataset.layout}`)
      }
    });
    document.querySelectorAll(`.layout-switch__item`).forEach((element) => {
      element.classList.remove('selected');
    })
    document.querySelectorAll(`.layout-switch__item[data-layout="${layout.dataset.layout}"]`).forEach((element) => {
      element.classList.add('selected');
    })
    console.log(document.querySelectorAll(this.dataset.container))  
    document.querySelectorAll(this.dataset.container).forEach((element) => {
      element.classList.remove([...unSelectedLayout])
      element.classList.add(`product-grid--${layout.dataset.layout}`);
    })
  }
 
}
customElements.define('facet-layouts', FacetLayouts);

class FacetReset extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('click', this.resetFilters.bind(this));
  }

  resetFilters(event) {
    event.preventDefault();
    document.querySelectorAll('facet-filters-form form').forEach((form) => {
      form.reset();
    })
  }
}

customElements.define('facet-reset', FacetReset);