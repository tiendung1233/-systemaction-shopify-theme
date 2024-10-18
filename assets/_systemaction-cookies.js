addEventListener('load', () => {
    if(document.querySelector('#tinycookie-wrapper')) {
        let iconElem = document.createElement("div"),
            title = document.querySelector('.tinycookie-title');

        iconElem.classList.add('tinycookie-close-btn');

        title.appendChild(iconElem);

        iconElem.onclick = function() {
            document.querySelector('.tinycookie-main-buttons .tinycookie-button.tinycookie-accept-all').click();
        }
    }
})