/**
 * Booking Widget - Opens booking page in a modal/popup
 * Usage: Include this script with data attributes
 */
(function () {
  "use strict";

  // Get script element with configuration
  var scripts = document.getElementsByTagName("script");
  var configScript = null;
  for (var i = 0; i < scripts.length; i++) {
    if (scripts[i].src && scripts[i].src.includes("booking.js")) {
      configScript = scripts[i];
      break;
    }
  }

  if (!configScript) return;

  var userId = configScript.getAttribute("data-user-id");
  var eventSlug = configScript.getAttribute("data-event-slug");
  var locale = configScript.getAttribute("data-locale") || "de";
  var buttonText =
    configScript.getAttribute("data-button-text") || "Termin buchen";
  var containerId =
    configScript.getAttribute("data-container-id") ||
    "booking-widget-" + eventSlug;

  // Get base URL from script src
  var baseUrl = configScript.src.replace("/widget/booking.js", "");

  var bookingUrl = baseUrl + "/" + locale + "/book/" + userId + "/" + eventSlug;

  // Create modal overlay
  function createModal() {
    var overlay = document.createElement("div");
    overlay.id = "booking-modal-overlay";
    overlay.style.cssText =
      "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;";

    var modal = document.createElement("div");
    modal.style.cssText =
      "background: white; border-radius: 8px; width: 100%; max-width: 900px; max-height: 90vh; overflow: hidden; position: relative; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);";

    var closeButton = document.createElement("button");
    closeButton.innerHTML = "×";
    closeButton.style.cssText =
      "position: absolute; top: 10px; right: 10px; width: 32px; height: 32px; border: none; background: rgba(0, 0, 0, 0.1); border-radius: 50%; cursor: pointer; font-size: 24px; line-height: 1; z-index: 10000; display: flex; align-items: center; justify-content: center;";
    closeButton.onclick = function () {
      document.body.removeChild(overlay);
      document.body.style.overflow = "";
    };

    var iframe = document.createElement("iframe");
    iframe.src = bookingUrl;
    iframe.style.cssText = "width: 100%; height: 90vh; border: none;";
    iframe.setAttribute("allow", "clipboard-write");

    modal.appendChild(closeButton);
    modal.appendChild(iframe);
    overlay.appendChild(modal);

    overlay.onclick = function (e) {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
        document.body.style.overflow = "";
      }
    };

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";
  }

  // Create button
  function createButton() {
    var container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement("div");
      container.id = containerId;
      configScript.parentNode.insertBefore(container, configScript.nextSibling);
    }

    var button = document.createElement("button");
    button.textContent = buttonText;
    button.style.cssText =
      'display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; border: none; cursor: pointer; font-size: 16px; transition: background-color 0.2s;';
    button.onmouseover = function () {
      button.style.backgroundColor = "#1d4ed8";
    };
    button.onmouseout = function () {
      button.style.backgroundColor = "#2563eb";
    };
    button.onclick = function (e) {
      e.preventDefault();
      createModal();
    };

    container.innerHTML = "";
    container.appendChild(button);
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createButton);
  } else {
    createButton();
  }
})();
