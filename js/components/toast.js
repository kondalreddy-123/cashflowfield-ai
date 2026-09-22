/**
 * CashFlowShield AI - Toast Notification System
 * Lightweight, non-intrusive interactive alerts for user actions and simulations.
 */

export class ToastManager {
  constructor() {
    let container = document.getElementById("globalToastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "globalToastContainer";
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    this.container = container;
  }

  /**
   * Show a toast alert.
   * @param {String} message
   * @param {String} type - "success" | "warning" | "error" | "info"
   * @param {Number} duration - in milliseconds
   */
  show(message, type = "info", duration = 3500) {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let iconClass = "fa-circle-info";
    if (type === "success") iconClass = "fa-circle-check";
    else if (type === "warning") iconClass = "fa-triangle-exclamation";
    else if (type === "error") iconClass = "fa-circle-xmark";

    toast.innerHTML = `
      <i class="fa-solid ${iconClass}" style="font-size:1.1rem;"></i>
      <div style="flex:1;">${message}</div>
    `;

    this.container.appendChild(toast);

    // Trigger animation in next frame
    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        if (toast.parentElement) {
          toast.parentElement.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  success(msg) { this.show(msg, "success"); }
  warning(msg) { this.show(msg, "warning"); }
  error(msg) { this.show(msg, "error"); }
  info(msg) { this.show(msg, "info"); }
}
