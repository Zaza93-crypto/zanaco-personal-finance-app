(() => {
  "use strict";

  function addLogoutControl() {
    if (document.getElementById("allMoneyLogoutButton")) return;

    const button = document.createElement("button");
    button.id = "allMoneyLogoutButton";
    button.type = "button";
    button.textContent = "Log out";
    button.setAttribute("aria-label", "Log out of your All Money account");
    button.style.cssText = [
      "position:fixed",
      "top:14px",
      "right:14px",
      "z-index:99999",
      "padding:10px 15px",
      "border:1px solid #e4def5",
      "border-radius:12px",
      "background:#ffffff",
      "color:#5d4fc4",
      "font:700 14px/1.2 system-ui,-apple-system,Segoe UI,sans-serif",
      "box-shadow:0 5px 18px rgba(50,35,100,.16)",
      "cursor:pointer"
    ].join(";");

    button.addEventListener("click", async () => {
      if (button.disabled) return;
      button.disabled = true;
      button.textContent = "Signing out…";
      try {
        const response = await fetch("/api/logout", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Accept": "application/json" }
        });
        if (!response.ok) throw new Error("Sign-out request failed.");
        // Clear common client-side session hints only; server cookie is cleared by /api/logout.
        try { sessionStorage.removeItem("allmoney_user"); } catch (_) {}
        window.location.replace("/login.html?logged_out=1");
      } catch (_) {
        button.disabled = false;
        button.textContent = "Log out";
        alert("Could not sign out. Check your connection and try again.");
      }
    });

    document.body.appendChild(button);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addLogoutControl, { once: true });
  } else {
    addLogoutControl();
  }
})();
