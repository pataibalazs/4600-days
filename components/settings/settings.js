document.addEventListener("DOMContentLoaded", function () {
  console.log("Settings page loaded at:", new Date().toISOString());

  // Elements
  const domainInput = document.getElementById("domainInput");
  const addDomainBtn = document.getElementById("addDomainBtn");
  const domainList = document.getElementById("domainList");
  const effectsModal = document.getElementById("effectsModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const modalDomainName = document.getElementById("modalDomainName");
  const saveEffectsBtn = document.getElementById("saveEffectsBtn");
  const effectCheckboxes = document.querySelectorAll(".effect-checkbox");

  // State variables
  let domains = [];
  let currentEditDomain = null;

  // Set default effect to an empty array (no effects)
  const defaultEffect = [];
  console.log("Default effect: None");

  // Load saved settings
  loadSettings();

  addDomainBtn.addEventListener("click", addDomain);
  closeModalBtn.addEventListener("click", closeModal);
  saveEffectsBtn.addEventListener("click", saveEffectsForDomain);

  function loadSettings() {
    console.log("Loading settings from storage");
    chrome.storage.local.get(["managedDomains"], function (result) {
      domains = result.managedDomains || [];
      console.log("Loaded domains:", domains);
      renderDomainList();
    });
  }

  function addDomain() {
    let domain = domainInput.value.trim().toLowerCase();

    if (!domain) {
      alert("Please enter a domain");
      return;
    }

    // Remove protocol if present
    domain = domain.replace(/^https?:\/\//, "");

    // Remove path if present
    domain = domain.split("/")[0];

    const domainRegex =
      /^[a-zA-Z0-9-]+\.(?:[a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})$/;

    if (!domainRegex.test(domain)) {
      alert("Please enter a valid domain (e.g., example.com)");
      return;
    }

    // Check if domain already exists
    if (domains.some((d) => d.name === domain)) {
      alert("This domain already exists in the list");
      return;
    }

    // Add domain to list with no effects by default
    domains.push({
      name: domain,
      effects: [], // No effects by default
    });

    // Clear input
    domainInput.value = "";

    // Render updated list
    renderDomainList();
    saveAllSettings();
  }

  domainInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      addDomain();
    }
  });

  function renderDomainList() {
    // Clear list
    domainList.innerHTML = "";

    if (domains.length === 0) {
      const emptyRow = document.createElement("tr");
      emptyRow.innerHTML = `
          <td colspan="3" class="px-6 py-4 text-center text-gray-500 italic">No domains added yet</td>
        `;
      domainList.appendChild(emptyRow);
      return;
    }

    // Add domains to list
    domains.forEach((domain) => {
      const row = document.createElement("tr");

      // Format effect names for display
      const formattedEffects =
        domain.effects && domain.effects.length > 0
          ? domain.effects.map((effect) => {
              // Replace underscores with spaces
              const withoutUnderscore = effect.replace(/_/g, " ");

              // Split words and capitalize each one
              return withoutUnderscore
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");
            })
          : [];

      row.innerHTML = `
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-medium text-gray-900">${domain.name}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-500">${
              formattedEffects.length > 0
                ? formattedEffects.join(", ")
                : "No effects"
            }</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button class="text-blue-600 hover:text-blue-900 mr-4 edit-btn" data-domain="${
              domain.name
            }">Edit</button>
            <button class="text-red-600 hover:text-red-900 delete-btn" data-domain="${
              domain.name
            }">Delete</button>
          </td>
        `;
      domainList.appendChild(row);
    });

    // Add event listeners to buttons
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => openEffectsModal(btn.dataset.domain));
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => deleteDomain(btn.dataset.domain));
    });
  }

  function openEffectsModal(domainName) {
    currentEditDomain = domainName;
    modalDomainName.textContent = domainName;

    // Get current effects for this domain
    const domain = domains.find((d) => d.name === domainName);

    // Set checkboxes based on current effects
    effectCheckboxes.forEach((checkbox) => {
      checkbox.checked =
        domain.effects && domain.effects.includes(checkbox.value);
    });

    // Show modal
    effectsModal.classList.remove("hidden");
  }

  function closeModal() {
    effectsModal.classList.add("hidden");
    currentEditDomain = null;
  }

  function saveEffectsForDomain() {
    if (!currentEditDomain) return;

    // Get selected effects
    const selectedEffects = Array.from(effectCheckboxes)
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value);

    // Update domain
    const domainIndex = domains.findIndex((d) => d.name === currentEditDomain);
    if (domainIndex !== -1) {
      domains[domainIndex].effects = selectedEffects;
      console.log("Updated domain effects:", domains[domainIndex]);
    }

    // Save immediately to apply effect change right away
    saveAllSettings();

    // Re-render list
    renderDomainList();

    // Close modal
    closeModal();
  }

  function deleteDomain(domainName) {
    if (confirm(`Are you sure you want to delete ${domainName}?`)) {
      domains = domains.filter((d) => d.name !== domainName);
      renderDomainList();

      // Save immediately to apply changes
      saveAllSettings();
    }
  }

  function saveAllSettings() {
    console.log("Saving domains to storage:", domains);

    // First store locally
    chrome.storage.local.set(
      {
        managedDomains: domains,
      },
      function () {
        if (chrome.runtime.lastError) {
          console.error("Error saving to storage:", chrome.runtime.lastError);
          showNotification("Error saving settings!", "error");
          return;
        }

        console.log("Settings saved to storage successfully");

        // Always show a success notification for the storage save
        showNotification("Settings saved successfully!");

        // Then notify background script without waiting for response
        setTimeout(() => {
          try {
            console.log("Sending updateDomainList to background...");
            // Send the message without expecting a response
            chrome.runtime.sendMessage({
              action: "updateDomainList",
              domains: domains,
              timestamp: Date.now(),
            });
            console.log("Message sent to background script");
          } catch (e) {
            console.error("Exception sending message:", e);
            showNotification(
              "Warning: Changes may not apply immediately",
              "warning"
            );
          }
        }, 100); // small delay to ensure storage is committed first
      }
    );
  }

  function showNotification(message, type = "success") {
    console.log(`Notification: ${message} (${type})`);

    const notification = document.createElement("div");
    notification.textContent = message;
    notification.className = `fixed top-4 right-4 ${
      type === "success"
        ? "bg-green-500"
        : type === "warning"
        ? "bg-yellow-500"
        : "bg-red-500"
    } text-white px-4 py-2 rounded shadow-md`;
    document.body.appendChild(notification);

    // Remove notification after 2 seconds
    setTimeout(() => {
      notification.remove();
    }, 2000);
  }
});
