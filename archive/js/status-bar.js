class StatusBar {
  constructor() {
    this.statusbar = document.querySelector(".status-bar");
    this.statusmessage = document.querySelector(".status-message");
    this.statuscopy = document.querySelector(".copy-status");
    this.statuscopy.addEventListener("click", () => this.copyStatus());
  }
  showStatus(message, isWarning, showCopy) {
    this.statuscopy.style.display = showCopy ? "inline-block" : "none";
    this.statusbar.className = isWarning ? "status-bar-warning" : "status-bar";
    this.statusmessage.innerHTML = message;
    this.statusbar.style.display = "block";
  }
  hideStatus() {
    this.statusbar.style.display = "none";
  }
  copyStatus() {
    clipboard.writeText(this.statusmessage.innerText);
    this.showStatus(
      'Copied to your clipboard! Please post this in our discord server in the #side-quest-general channel - <span class="link link-white" data-url="https://discord.gg/r38T5rR">https://discord.gg/r38T5rR</span> - Thanks!'
    );
    let link = this.statusmessage.querySelector(".link");
    link.addEventListener("click", () =>
      this.openExternalLink(link.dataset.url)
    );
  }
}
