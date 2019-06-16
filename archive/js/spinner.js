class Spinner {
    constructor() {
        this.spinner_drag = document.querySelector('.spinner-drag');
        this.spinner_background = document.querySelector('.spinner-background');
        this.spinner_loading_message = document.querySelector(
            '.spinner-loading-message'
        );
        this.spinner = document.querySelector('.spinner');
    }
    setMessage(message) {
        this.spinner_loading_message.innerHTML = message;
    }
    showDrag() {
        this.spinner_drag.style.display = 'block';
        this.spinner_background.style.display = 'block';
        this.spinner.style.display = 'none';
    }
    hideDrag() {
        this.spinner_drag.style.display = 'none';
        this.spinner_background.style.display = 'none';
        this.spinner.style.display = 'none';
    }
    showLoader() {
        this.spinner.style.display = 'block';
        this.spinner_background.style.display = 'block';
    }
    hideLoader() {
        this.spinner.style.display = 'none';
        this.spinner_background.style.display = 'none';
    }
}
