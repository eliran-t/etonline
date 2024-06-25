/*********************************************************************************
 * **********************************************
 * #region JavaScript
 * **********************************************
 * ****************************************************************************/
const FEEDBACK_EMAIL = "contact@eleaptech.com";

function isDev() {
  console.log("isDev => window.location.hostname:", window.location.hostname);
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

// Tracks the currently dragged pill globally
let draggedPill = null;
let activeDropZone = null;
let inputPillClicked = null;
let inputPillText = {
  text: "Click to add a task of your own. Press Enter to confirm.",
  shortText: "Click to add",
};
let lastPillId = null;
let pillPoolCenterTop = { x: null, y: null };

/* #region Pill */

class BasePill {
  static DEFAULT_CLASS = "pill badge badge-pill badge-primary pill-example";

  constructor(id, text, shortText, category, element) {
    this.id = id;
    this.text = text;
    this.shortText = shortText;
    this.category = category;
    this.container = null;
    this.createElement(element);
    this.addPillEventListeners();
  }

  onDragged(event) {
    event.dataTransfer.setData("text/plain", this.id);
    draggedPill = this;
  }

  onDragEnd(event) {
    draggedPill = null;
  }

  setAllPillText(shortText, text) {
    this.setTextFields(shortText, text);
    this.setElementText(shortText, text);
  }

  setElementText(shortText, text) {
    if (this.element) {
      this.element.textContent = shortText; // Set visible text
      this.element.title = text; // Set tooltip
    }
  }

  setTextFields(shortText, text) {
    this.shortText = shortText;
    this.text = text;
  }

  createElement(element) {
    if (element) {
      this.element = element;
    } else {
      this.element = document.createElement("span");
    }
    this.element.className = BasePill.DEFAULT_CLASS;
    this.setElementText(this.shortText, this.text); // Use setText to initialize text and tooltip
    if (this.category) {
      this.element.style.backgroundColor = this.category.color_code;
    }
  }
}

class Pill extends BasePill {
  constructor(id, text, shortText, category) {
    super(id, text, shortText, category);
  }

  addPillEventListeners() {
    this.element.draggable = true;
    this.element.addEventListener("dragstart", this.onDragged.bind(this));
    this.element.addEventListener("dragend", this.onDragEnd.bind(this));
    this.element.addEventListener("click", (event) => {
      if (this.container) {
        this.container.handlePillClick(this);
      }
      event.stopPropagation(); // Stop the event from propagating further
    });
  }

  onDragged(event) {
    event.dataTransfer.setData("text/plain", this.id);
    draggedPill = this; // Set the global reference to the dragged pill
  }

  onDragEnd(event) {
    draggedPill = null; // Clear the reference once dragging ends
  }

  clone() {
    const pillClone = new Pill(
      this.id,
      this.text,
      this.shortText,
      this.category
    );
    pillClone.containerId = this.containerId; // Clone retains the original's container context
    return pillClone;
  }
}

class InputPill extends BasePill {
  constructor(pillPool) {
    super(
      ++lastPillId,
      inputPillText.text,
      inputPillText.shortText,
      PILL_CATEGORY.USER_INPUT
    );
    this.pillPool = pillPool;
    this.isEditing = false;
    this.editClicksCount = 0;
  }

  addPillEventListeners() {
    this.element.addEventListener("click", (e) => {
      console.log(
        "Pill clicked. Current textContent:",
        this.element.textContent
      );

      if (!this.isEditing) {
        this.editClicksCount = 0;
        this.element.contentEditable = true;
        this.element.className = "pill pill-input form-control"; // Style as a text input
        this.element.textContent = ""; // Clear placeholder text on click
        console.log("Pill set to editable.");
        this.element.focus(); // Add focus to the element
      } else {
        this.resetInputPill();
      }
      this.isEditing = !this.isEditing;
    });

    this.element.addEventListener("blur", (e) => {
      if (this.element.textContent.trim() === "") {
        this.resetInputPill(); // Reset if left empty
        console.log("Pill reset due to blur event.");
      }
    });

    this.element.addEventListener("keypress", (e) => {
      console.log(`Key pressed: ${e.key}`);
      if (e.key === "Enter") {
        e.preventDefault();
        console.log("enter to insert pill.");

        const pillText = this.element.textContent.trim();
        console.log("Pill text =", pillText);

        if (pillText !== "") {
          console.log("pillPool.addPilll.");

          this.pillPool.addPillToPool(
            new Pill(++lastPillId, pillText, pillText, this.category),
            true
          );
        }
        this.resetInputPill();
        console.log("Pill text committed and input reset.");
      }
    });

    // Add a document-wide click listener to handle clicks outside the pill
    document.addEventListener("click", (e) => {
      if (this.isEditing && this.editClicksCount > 0) {
        // If we're updating and the click is outside the pill, reset everything
        this.resetInputPill();
        this.isEditing = false;
        console.log("Pill reset due to click outside.");
      }
      this.editClicksCount++;
    });
  }

  resetInputPill() {
    this.setAllPillText(inputPillText.shortText, inputPillText.text);
    this.element.className = BasePill.DEFAULT_CLASS;
    this.element.contentEditable = false;
    this.element.blur(); // Remove focus from the input
    console.log("Input pill reset to default state.");
  }
}

/* #endregion */

/* #region FloatingPillPool */

class FloatingPillPool {
  constructor(id, pills) {
    this.isPoolOpen = true;
    this.id = id;
    this.pills = new Set(); // Set of available pills for dragging
    this.element = document.getElementById(id);
    this.dropZoneRef = null;
    // Additional storage for category containers and headers
    this.categoryElements = {}; // To store category pill containers
    this.categoryHeaders = {}; // To store category headers for visibility
    this.pillPollHeight = this.element.getBoundingClientRect().height; // Save the X position
    this.openedCategoryId = null;
    this.closeButton = document.getElementById("poolCloseBtn"); // Property to store the close button element
    this.poolLabel = document.getElementById("poolPillLabel"); // Property to store the pool label element

    PILLS.forEach((pillData) => {
      const pill = new Pill(
        pillData.id,
        pillData.text,
        pillData.shortText,
        pillData.category
      );
      this.addPillToPool(pill);
    });
    this.addUserInputPill();
    this.setTabIndexBasedOnPoolState(false);
    // Call initPoolAlert once during the initialization of the pool

    document.addEventListener(
      "click",
      (event) => {
        // Check if the click is outside the pill pool
        if (!this.element.contains(event.target) && this.isPoolOpen) {
          this.closePool();
        }
      },
      true
    ); // Use capture phase to ensure this runs before any other click events

    // Add an event listener to the pool's main element
    this.poolLabel.addEventListener("click", (event) => {
      this.closePool();
    });

    this.closeButton.addEventListener("click", (event) => {
      this.closePool();
    });
  }

  togglePoolState(isOpen, newDropZoneRef) {
    this.setDropZone(isOpen ? newDropZoneRef : null);
    this.element.classList.toggle("kids-pool", !isOpen);
    this.setTabIndexBasedOnPoolState(isOpen);
    this.isPoolOpen = isOpen;
  }

  closePool() {
    this.togglePoolState(false, null);
    if (activeDropZone) {
      activeDropZone.unFocusDropZone();
      activeDropZone = null;
    }
  }

  setTabIndexBasedOnPoolState(isOpen) {
    // Set tabIndex for the pool element
    this.element.tabIndex = isOpen ? 0 : -1;

    // Iterate over all category elements and set their tabIndex
    Object.values(this.categoryElements).forEach((categoryElement) => {
      categoryElement.tabIndex = isOpen ? 0 : -1;
    });

    // handle category headers if they need to be focusable/ non-focusable
    Object.values(this.categoryHeaders).forEach((header) => {
      header.tabIndex = isOpen ? 0 : -1;
    });
  }

  addUserInputPill() {
    // Add the new task pill to the pool
    this.addPillToPool(new InputPill(this));
  }

  setDropZone(dropZone) {
    this.dropZoneRef = dropZone;
    this.positionByDropZone(); // Reposition based on the active drop zone
  }

  positionByDropZone() {
    if (!this.dropZoneRef) return;

    const rect = this.dropZoneRef.element.getBoundingClientRect();
    let newTop = rect.top + window.scrollY + rect.height * 0.68;
    let newLeft = rect.right + window.scrollX - 20; // Default position

    this.element.style.top = `${newTop}px`;
    this.element.style.left = `${newLeft}px`;
  }

  addPillToPool(pill, isUserInput) {
    if (isUserInput) {
      console.log(
        "Adding user input pill to pool. Pill data:",
        pill,
        "Category data:",
        pill.category,
        "Element data:",
        pill.element
      );
    }
    if (!this.categoryElements[pill.category.id]) {
      this.createCategoryGroup(pill.category);
    }
    pill.container = this;
    this.pills.add(pill);
    this.categoryElements[pill.category.id].appendChild(pill.element);
    lastPillId = pill.id;

    if (isUserInput && this.dropZoneRef) {
      this.passPillToDropZone(pill);
    }
  }

  createCategoryGroup(category, index) {
    const color = category.color_code;
    const categoryContainer = document.createElement("div");
    categoryContainer.className = "category-group";
    categoryContainer.style.display = "none"; // Start collapsed
    categoryContainer.style.backgroundColor = color;

    const header = document.createElement("button");
    header.textContent = category.name;
    header.className = "category-header";
    header.style.color = "black";
    header.style.backgroundColor = color;

    // Set the header as a flex container
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center"; // Align items vertically

    const infoMsg = this.getCategoryMsg(category);
    addInfoModalIcon("Category" + category.id, header, infoMsg, color);

    header.onclick = () => this.toggleCategory(category.id);

    this.element.appendChild(header);
    this.element.appendChild(categoryContainer);
    this.categoryHeaders[category.id] = header;
    this.categoryElements[category.id] = categoryContainer;
  }

  getCategoryMsg(category) {
    let msg = category.infoMsg;
    if (!msg) {
      const categoryPills = PILLS.filter(
        (pill) => pill.category.id === category.id
      );
      msg = categoryPills.map((pill) => `• ${pill.text}`).join("<br/>");
    }
    return `Category: ${category.name}<br/>  Tasks: <br/>${msg}`;
  }

  toggleCategory(categoryId) {
    // Retrieve the container for the clicked category
    const categoryContainer = this.categoryElements[categoryId];

    if (this.openedCategoryId === categoryId) {
      // Case: The clicked category is already open
      // Toggle the visibility of the current category's container
      categoryContainer.style.display =
        categoryContainer.style.display === "none" ? "block" : "none";

      // If the category is now closed (display is none), reset openedCategoryId
      if (categoryContainer.style.display === "none") {
        this.openedCategoryId = null;
      }
    } else {
      // Case: A different category was clicked
      // If there is a previously opened category, hide its container
      if (this.openedCategoryId) {
        const openedCategory = this.categoryElements[this.openedCategoryId];
        openedCategory.style.display = "none";
      }

      // Show the container of the newly clicked category
      categoryContainer.style.display = "block";

      // Update openedCategoryId to the ID of the newly clicked category
      this.openedCategoryId = categoryId;
    }
  }

  handlePillClick(pill) {
    this.passPillToDropZone(pill);
  }

  passPillToDropZone(pill) {
    // Ensure there is an active drop zone selected.
    if (this.dropZoneRef) {
      // Clone the pill to maintain the original in the pool
      const pillClone = pill.clone();
      // Use the dropZone's method to handle the pill drop
      draggedPill = pillClone;
      this.dropZoneRef.dropPill();
    } else {
      console.log("No active drop zone selected.");
    }
  }
}

/* #endregion */

/* #region DropZone */

class DropZone {
  constructor(dropzoneContainer, zoneId, label, pillPool, zoneData) {
    this.id = zoneId;
    this.label = label;
    this.pills = new Map();
    this.pillPoolRef = pillPool;
    this.zoneData = zoneData;
    this.createDropZoneElement();
    this.addEventListeners();
    this.addInfoIconToTopRight(this.element);
    this.addLabel(label);
    this.openPoolCounter = 0;

    dropzoneContainer.appendChild(this.element);

    if (!pillPool.dropZoneRef) {
      pillPool.setDropZone(this);
      this.collapsePillPool();
    }
  }

  createDropZoneElement() {
    this.element = document.createElement("div");
    this.element.id = this.id;
    this.element.className = "dropzone unfocused";
    this.element.tabIndex = 0; // Make drop zone focusable

    // Add label for the drop zone
    const labelDiv = document.createElement("div");
    labelDiv.className = "survey-label";
    labelDiv.textContent = this.label;
    this.element.appendChild(labelDiv);

    // Create and append the placeholder container
    let placeholderContainer;
    this.placeholderContainer = placeholderContainer =
      document.createElement("div");
    placeholderContainer.className = "tasks-pool-placeholder";
    this.element.appendChild(placeholderContainer);

    // Create and append the content inside the placeholder
    const placeholderContent = document.createElement("div");
    placeholderContent.className = "placeholder-content";
    placeholderContent.textContent = "Click to open tasks pool...";
    placeholderContainer.appendChild(placeholderContent);

    // Store the reference to the placeholder content for later use
    this.placeholderContent = placeholderContent;

    // Linking the HTML element with this DropZone instance
    this.element.controller = this;
  }

  addInfoIconToTopRight(container) {
    this.infoIcon = addInfoModalIcon(
      this.id,
      this.element,
      this.zoneData.info,
      "#1bc0de"
    );

    this.infoIcon.style.position = "absolute";
    this.infoIcon.style.top = "10px";
    this.infoIcon.style.right = "10px";
    container.appendChild(this.infoIcon);
  }

  addLabel(labelText) {
    const labelDiv = document.createElement("div");
    labelDiv.className = "survey-label";
    labelDiv.textContent = labelText;
    this.element.appendChild(labelDiv);
  }

  addEventListeners() {
    // Add event listeners
    this.element.addEventListener("click", (e) => this.onClick(e));
    this.element.addEventListener("dragover", (e) => this.onDragOver(e));
    this.element.addEventListener("drop", (e) => this.onPillDrop(e));
    this.element.addEventListener("focus", (e) => this.onFocus(e));

    document.addEventListener(
      "focus",
      function (event) {
        // Check if the focused element is not a drop zone and there is an active drop zone
        if (
          !event.target.classList.contains("dropzone") &&
          !event.target.closest(".pill-pool") && // Check if the event target is not the pool or a child of the pool
          activeDropZone
        ) {
          // Unfocus the active drop zone
          activeDropZone.unFocusDropZone();
          activeDropZone.collapsePillPool();
          activeDropZone = null; // Set activeDropZone to null
        }
      },
      true
    ); // Use capture phase to ensure the event is captured at the document level
  }

  onFocus(event) {
    if (!this.pillPoolRef.dropZoneRef == this) {
      this.openPillPool();
      this.focusDropZone();
      activeDropZone = this;
    }
  }

  collapsePillPool() {
    this.pillPoolRef.togglePoolState(false);
  }

  openPillPool() {
    this.pillPoolRef.togglePoolState(true, this);

    if (this.openPoolCounter === 0) {
      this.placeholderContainer.style.opacity = "0";
      this.placeholderContent.style.opacity = "0";
      this.placeholderContent.style.visibility = "hidden";
    }
    this.openPoolCounter++;
  }

  addPill(pill) {
    this.pills.set(pill.id, pill);
    pill.container = this;
    this.element.appendChild(pill.element);
    pill.element.addEventListener("click", () => pill.onClick());
  }

  onDragOver(event) {
    event.preventDefault();
  }

  onPillDrop(event) {
    event.preventDefault();
    this.dropPill();
  }

  dropPill() {
    if (draggedPill) {
      // Check if a pill with the same ID already exists in the drop zone
      if (this.pills.has(draggedPill.id)) {
        return; // If a pill with the same ID already exists, ignore the drop
      }

      const newPill = draggedPill.clone();
      newPill.container = this;
      this.pills.set(newPill.id, newPill); // Change this line
      this.element.appendChild(newPill.element);
      newPill.element.addEventListener(
        "click",
        newPill.element.click.bind(newPill)
      );
    }
  }

  handlePillClick(pill) {
    // Handle the click event for a pill in the drop zone context
    this.pills.delete(pill.id);
    pill.element.remove();
  }

  unFocusDropZone() {
    this.element.classList.remove("focused");
    this.element.classList.add("unfocused");
  }

  focusDropZone() {
    this.element.classList.remove("unfocused");
    this.element.classList.add("focused");
  }

  onClick(event) {
    // Check if the click event originated from the info icon or its children
    if (event.target.closest(".info-modal-icon") !== null) {
      // If the click is on the info icon or its children, do nothing
      return;
    }

    // Case 1: Clicking on the same zone
    if (activeDropZone === this) {
      this.unFocusDropZone();
      this.collapsePillPool();
      activeDropZone = null; // Set activeDropZone to null
      return;
    }

    // Case 2: Clicking on a different zone
    if (activeDropZone) {
      activeDropZone.unFocusDropZone();
      activeDropZone.collapsePillPool();
    }

    // Case 3: First click on a zone
    this.focusDropZone();
    this.openPillPool();
    activeDropZone = this; // Set this drop zone as the active one
  }
}

/* #endregion */
function addInfoModalIcon(id, container, message, color) {
  const faIcon = document.createElement("i");
  faIcon.id = "infoIcon" + id;
  faIcon.className = "fas fa-question-circle info-modal-icon";
  faIcon.style.cursor = "pointer"; // Change cursor on hover
  faIcon.style.fontSize = "1.3rem"; // Increase icon size
  faIcon.style.color = "#1bc0de"; // Set the icon color
  container.appendChild(faIcon);

  // Using an Immediately Invoked Function Expression (IIFE) to create a closure
  faIcon.onclick = (function (localMessage, localColor) {
    return function (event) {
      event.stopPropagation(); // Stop the event from propagating to parent elements
      infoModal(localMessage, localColor); // Show the modal on click
    };
  })(message, color);
  return faIcon;
}

function infoModal(message, color) {
  const infoModal = document.getElementById("infoModal");
  const infoModalText = document.getElementById("infoModalText");
  const infoModalContent = document.querySelector(".info-modal-content");
  const infoModalClose = document.querySelector(".info-modal-close");

  infoModalText.innerHTML = message;
  if (color) {
    infoModalContent.style.backgroundColor = color;
  }
  infoModal.style.display = "flex"; // Use flex to center the modal

  infoModalClose.onclick = function () {
    infoModal.style.display = "none";
  };

  window.onclick = function (event) {
    if (event.target == infoModal) {
      infoModal.style.display = "none";
    }
  };
}

const PILL_CATEGORY = {
  ADMIN: { id: 1, name: "Admin", color_code: "#FFD700" }, // Gold
  CUSTOMER_SERVICE: {
    id: 2,
    name: "Customer Service",
    color_code: "#1E90FF",
  }, // Dodger Blue
  SALES_MARKETING: {
    id: 3,
    name: "Sales & Marketing",
    color_code: "#32CD32",
  }, // Lime Green
  HUMAN_RESOURCES: {
    id: 4,
    name: "Human Resources",
    color_code: "#FF69B4",
  }, // Hot Pink
  OPERATIONS: { id: 5, name: "Operations", color_code: "#FFA500" }, // Orange
  IT_DATA: { id: 6, name: "IT/Data", color_code: "#6A5ACD" }, // Slate Blue
  FINANCE_ACCOUNTING: {
    id: 7,
    name: "Finance/Accounting",
    color_code: "#B22222",
  }, // Firebrick
  USER_INPUT: {
    id: 8,
    name: "Custom Input",
    isUserInput: true,
    color_code: "#FFFFFFF",
    infoMsg:
      "Select the white pill to create a new task. Confirm by pressing Enter. For any extra comments, use the final box provided.",
  }, // White
};

PILLS = [
  {
    id: 0,
    category: PILL_CATEGORY.ADMIN,
    text: "Compliance and regulation checks",
    shortText: "Compliance",
  },
  {
    id: 1,
    category: PILL_CATEGORY.ADMIN,
    text: "Scheduling and appointments",
    shortText: "Scheduling",
  },
  {
    id: 2,
    category: PILL_CATEGORY.ADMIN,
    text: "Email management",
    shortText: "Emails",
  },
  {
    id: 3,
    category: PILL_CATEGORY.ADMIN,
    text: "Report generation",
    shortText: "Reports",
  },
  {
    id: 4,
    category: PILL_CATEGORY.ADMIN,
    text: "Document control",
    shortText: "Docs Control",
  },
  {
    id: 5,
    category: PILL_CATEGORY.ADMIN,
    text: "Meeting coordination",
    shortText: "Meetings",
  },
  {
    id: 6,
    category: PILL_CATEGORY.ADMIN,
    text: "Travel arrangements",
    shortText: "Travel",
  },
  {
    id: 7,
    category: PILL_CATEGORY.ADMIN,
    text: "Budgeting and financial planning",
    shortText: "Budgeting",
  },
  {
    id: 8,
    category: PILL_CATEGORY.CUSTOMER_SERVICE,
    text: "Handling customer inquiries",
    shortText: "Inquiries",
  },
  {
    id: 9,
    category: PILL_CATEGORY.CUSTOMER_SERVICE,
    text: "Complaint resolution",
    shortText: "Complaints",
  },
  {
    id: 10,
    category: PILL_CATEGORY.CUSTOMER_SERVICE,
    text: "Customer follow-ups",
    shortText: "Follow-ups",
  },
  {
    id: 11,
    category: PILL_CATEGORY.CUSTOMER_SERVICE,
    text: "Booking and reservations",
    shortText: "Booking",
  },
  {
    id: 12,
    category: PILL_CATEGORY.CUSTOMER_SERVICE,
    text: "Customer data updates",
    shortText: "Data Updates",
  },
  {
    id: 13,
    category: PILL_CATEGORY.CUSTOMER_SERVICE,
    text: "Feedback collection",
    shortText: "Feedback",
  },
  {
    id: 14,
    category: PILL_CATEGORY.CUSTOMER_SERVICE,
    text: "Customer service training",
    shortText: "CS Training",
  },
  {
    id: 15,
    category: PILL_CATEGORY.SALES_MARKETING,
    text: "Lead generation",
    shortText: "Leads",
  },
  {
    id: 16,
    category: PILL_CATEGORY.SALES_MARKETING,
    text: "Follow-up emails",
    shortText: "Follow-ups",
  },
  {
    id: 17,
    category: PILL_CATEGORY.SALES_MARKETING,
    text: "Social media management",
    shortText: "Social Media",
  },
  {
    id: 18,
    category: PILL_CATEGORY.SALES_MARKETING,
    text: "Content creation for marketing",
    shortText: "Content Creation",
  },
  {
    id: 19,
    category: PILL_CATEGORY.SALES_MARKETING,
    text: "Customer segmentation",
    shortText: "Segmentation",
  },
  {
    id: 20,
    category: PILL_CATEGORY.SALES_MARKETING,
    text: "Campaign analysis",
    shortText: "Campaign Analysis",
  },
  {
    id: 21,
    category: PILL_CATEGORY.SALES_MARKETING,
    text: "Market research",
    shortText: "Market Research",
  },
  {
    id: 22,
    category: PILL_CATEGORY.HUMAN_RESOURCES,
    text: "Recruiting and onboarding",
    shortText: "Recruiting",
  },
  {
    id: 23,
    category: PILL_CATEGORY.HUMAN_RESOURCES,
    text: "Employee record keeping",
    shortText: "HR Records",
  },
  {
    id: 24,
    category: PILL_CATEGORY.HUMAN_RESOURCES,
    text: "Payroll processing",
    shortText: "Payroll",
  },
  {
    id: 25,
    category: PILL_CATEGORY.HUMAN_RESOURCES,
    text: "Performance reviews",
    shortText: "Reviews",
  },
  {
    id: 26,
    category: PILL_CATEGORY.HUMAN_RESOURCES,
    text: "Leave management",
    shortText: "Leave Mgmt",
  },
  {
    id: 27,
    category: PILL_CATEGORY.HUMAN_RESOURCES,
    text: "Training and development",
    shortText: "Training",
  },
  {
    id: 28,
    category: PILL_CATEGORY.HUMAN_RESOURCES,
    text: "Exit interviews",
    shortText: "Exit Interviews",
  },
  {
    id: 29,
    category: PILL_CATEGORY.OPERATIONS,
    text: "Inventory management",
    shortText: "Inventory",
  },
  {
    id: 30,
    category: PILL_CATEGORY.OPERATIONS,
    text: "Quality control checks",
    shortText: "Quality Control",
  },
  {
    id: 31,
    category: PILL_CATEGORY.OPERATIONS,
    text: "Maintenance scheduling",
    shortText: "Maintenance",
  },
  {
    id: 32,
    category: PILL_CATEGORY.OPERATIONS,
    text: "Production planning",
    shortText: "Production",
  },
  {
    id: 33,
    category: PILL_CATEGORY.OPERATIONS,
    text: "Logistics coordination",
    shortText: "Logistics",
  },
  {
    id: 34,
    category: PILL_CATEGORY.OPERATIONS,
    text: "Asset management",
    shortText: "Asset Mgmt",
  },
  {
    id: 35,
    category: PILL_CATEGORY.OPERATIONS,
    text: "Energy management",
    shortText: "Energy Mgmt",
  },
  {
    id: 36,
    category: PILL_CATEGORY.IT_DATA,
    text: "Data entry",
    shortText: "Data Entry",
  },
  {
    id: 37,
    category: PILL_CATEGORY.IT_DATA,
    text: "Database maintenance",
    shortText: "DB Maintenance",
  },
  {
    id: 38,
    category: PILL_CATEGORY.IT_DATA,
    text: "Software updates",
    shortText: "Updates",
  },
  {
    id: 39,
    category: PILL_CATEGORY.IT_DATA,
    text: "System backups",
    shortText: "Backups",
  },
  {
    id: 40,
    category: PILL_CATEGORY.IT_DATA,
    text: "Security monitoring",
    shortText: "Security",
  },
  {
    id: 41,
    category: PILL_CATEGORY.IT_DATA,
    text: "Troubleshooting IT issues",
    shortText: "Troubleshooting",
  },
  {
    id: 42,
    category: PILL_CATEGORY.IT_DATA,
    text: "Data analysis",
    shortText: "Data Analysis",
  },
  {
    id: 43,
    category: PILL_CATEGORY.FINANCE_ACCOUNTING,
    text: "Invoice processing",
    shortText: "Invoicing",
  },
  {
    id: 44,
    category: PILL_CATEGORY.FINANCE_ACCOUNTING,
    text: "Expense reporting",
    shortText: "Expenses",
  },
  {
    id: 45,
    category: PILL_CATEGORY.FINANCE_ACCOUNTING,
    text: "Tax filing",
    shortText: "Tax Filing",
  },
  {
    id: 46,
    category: PILL_CATEGORY.FINANCE_ACCOUNTING,
    text: "Auditing",
    shortText: "Auditing",
  },
  {
    id: 47,
    category: PILL_CATEGORY.FINANCE_ACCOUNTING,
    text: "Financial forecasting",
    shortText: "Forecasting",
  },
  {
    id: 48,
    category: PILL_CATEGORY.FINANCE_ACCOUNTING,
    text: "Account reconciliation",
    shortText: "Reconciliation",
  },
  {
    id: 49,
    category: PILL_CATEGORY.FINANCE_ACCOUNTING,
    text: "Credit management",
    shortText: "Credit Mgmt",
  },
];

const dropZoneNames = [
  {
    id: "qMostTime",
    label: "Most Time Consuming",
    info: "<p>Which everyday tasks take up the most time for you or your team?</p><ul><li><b>Entering information by hand:</b> Typing customer details, sales numbers, or product info into spreadsheets or systems</li><li><b>Creating reports:</b> Putting together summaries for your boss or clients</li><li><b>Looking for patterns in data:</b> Examining lots of information to understand what it means for your business</li><li><b>Managing social media:</b> Answering comments, posting updates, and scheduling posts on different platforms</li></ul>",
  },
  {
    id: "qMostRepetitive",
    label: "Most Repetitive",
    info: "<p>Which tasks involve doing the same things over and over again?</p><ul><li><b>Responding to customer questions:</b> Dealing with common inquiries or problems</li><li><b>Entering information repeatedly:</b> Typing the same kinds of details multiple times</li><li><b>Checking for mistakes in documents:</b> Reviewing text for errors in spelling, grammar, or formatting</li><li><b>Setting up meetings:</b> Finding a time that works for everyone and sending out invites</li></ul>",
  },
  {
    id: "qMostErrorProne",
    label: "Most Error Prone",
    info: "<p>In your day-to-day operations, which tasks stand out as the ones where mistakes or errors happen most frequently?  This could be due to the complexity of the task, the volume of information involved, or simply the nature of the work itself. We're interested in your specific experiences and insights.</p>",
  },
  {
    id: "qMonitoring",
    label: "Best for Monitoring",
    info: "<p>Which tasks do you want to track more easily, perhaps with a simple dashboard or using software tools?</p><ul><li><b>Sales:</b> How much you're selling, lead conversion, customer acquisition costs</li><li><b>Marketing:</b> Ad performance, customer responses, campaign effectiveness</li><li><b>Customer support:</b> Help requests, resolution time, customer satisfaction</li><li><b>Website:</b> Traffic, user behavior, popular pages</li></ul>",
  },
  {
    id: "qLeastLikable",
    label: "Least Favorite",
    info: "<p>Which tasks do you or your team dislike the most?</p><ul><li><b>Entering information by hand:</b> Often seen as boring and repetitive</li><li><b>Checking for mistakes in documents:</b> Requires a lot of focus and can be tiring</li><li><b>Cold calling:</b> Making unsolicited calls can be stressful</li><li><b>Manually updating spreadsheets:</b> Takes a long time and is easy to make mistakes</li></ul>",
  },
  {
    id: "qUserCandidates",
    label: "Best Candidates",
    info: "<p>Which tasks do you think could be done better or faster with the help of software?</p><ul><li><b>Entering information by hand:</b> Tools exist that can pull in information automatically</li><li><b>Responding to customer questions:</b> Chatbots can answer simple questions, letting your team focus on more complex issues</li><li><b>Managing social media:</b> Some programs can schedule posts, analyze what's working, and even help create content</li><li><b>Looking for patterns in data:</b> Special software can quickly analyze large amounts of information to find trends you might miss</li></ul>",
  },
];

const MSGS = {
  SUBMIT: "Submitting your survey...",
  ISSUE:
    "There was an issue submitting your survey. Please email me at " +
    FEEDBACK_EMAIL,
  SUCCESS: "Survey submitted successfully. Thank you for your participation!",
  ERROR_SAVED:
    "An error occurred, but your responses have been saved. Please try again later or contact support.",
  ERROR_PREP:
    "An error occurred while preparing your data. Please try again or contact support.",
};

const sections = ["s1_user", "s2_tasks", "s3_commentSubmit"];
let currentSectionIndex = 0;

function showSection(index) {
  sections.forEach((sectionId, idx) => {
    const section = document.getElementById(sectionId);
    if (idx === index) {
      section.classList.remove("collapse");
      section.classList.add("show");
    } else {
      section.classList.remove("show");
      section.classList.add("collapse");
    }
  });
  currentSectionIndex = index;
}

document.addEventListener("DOMContentLoaded", function () {
  class SurveyManager {
    constructor(scriptUrl) {
      let surveyElement;
      this.surveyElement = surveyElement = document.getElementById("survey");
      this.dropzoneElements = document.getElementById(sections[1]);
      this.pillPool = new FloatingPillPool("floatingPillPool", PILLS);
      this.dropZones = this.createDropZones(surveyElement);
      this.commentTextarea = document.getElementById("userComments");
      this.buttonElement = document.getElementById("submitBtn");
      this.buttonElement.addEventListener("click", () => this.handleSubmit());
      this.scriptUrl = scriptUrl;

      // Initialize feedback elements as class properties
      this.feedbackContainer = document.getElementById("feedbackContainer");
      this.feedbackModalBackdrop = document.getElementById(
        "feedbackModalBackdrop"
      );
      this.feedbackModalText = document.getElementById("feedbackModalText");
      // Setup close functionality once

      this.feedbackCloseBtn = document.getElementById("feedbackCloseBtn");
      this.feedbackCloseBtn.addEventListener("click", () => {
        this.closeFeedbackModal();
      });
    }

    // Function to open the feedback modal
    openFeedbackModal() {
      this.feedbackContainer.style.display = "block";
      this.feedbackContainer.style.opacity = 1;
      this.feedbackModalBackdrop.style.display = "block";
      this.feedbackModalBackdrop.style.opacity = 0.5;
    }

    // Function to close the feedback modal
    closeFeedbackModal() {
      this.feedbackContainer.style.opacity = 0;
      this.feedbackModalBackdrop.style.opacity = 0;
      this.feedbackContainer.style.display = "none";
      this.feedbackModalBackdrop.style.display = "none";
    }

    createDropZones(surveyElement) {
      return dropZoneNames.map((zoneData) => {
        return new DropZone(
          this.dropzoneElements,
          zoneData.id,
          zoneData.label,
          this.pillPool,
          zoneData
        );
      });
    }

    prepareSurveyData() {
      let surveyData = {};

      this.dropZones.forEach((zone) => {
        const pills = Array.from(zone.pills.values());
        surveyData[zone.id] = pills.map((pill) => pill.text).join(", ");
      });
      surveyData.userComments = this.commentTextarea.value;

      return surveyData;
    }

    buildFeedbackMessage(success, surveyData, error = "") {
      // Initial message based on success or failure
      let feedbackMessage = success
        ? `<strong>Success!</strong> <br> Your survey has been submitted successfully!`
        : `<strong>Error!</strong><br/> Unfortunately, your survey couldn't be submitted.<br/> Please try again or contact us at ${FEEDBACK_EMAIL} for support.<br/><br/>Error: ${error}<br>`;

      // Adding the answers section
      feedbackMessage +=
        "<br><br><strong>Thank you for your time!</strong><br> Here are your answers:<br>";

      // Initialize feedbackMessage with an opening <ul> tag for an unordered list
      feedbackMessage += "<br><ul style='text-align: left;'>";

      // Loop through surveyData to append each answer as a list item
      Object.keys(surveyData).forEach((key) => {
        const matchingZone = dropZoneNames.find((zone) => zone.id === key);
        const label = matchingZone ? matchingZone.label : key;
        // Wrap each feedback item in <li> tags instead of using a dash
        feedbackMessage += `<li>${label}: ${surveyData[key]}</li>`;
      });

      // Close the unordered list with a closing </ul> tag
      feedbackMessage += "</ul>";
      // Thank you note for successful submissions
      if (success) {
        feedbackMessage += `<br>Feel free to contact us at<br> ${FEEDBACK_EMAIL} <br>for any feedback.`;
      }

      return feedbackMessage;
    }

    sendDummyDevResponse(data) {
      // Log the data to simulate sending to a server
      console.log("Sending data to dev server:", data);

      // Construct a dummy success response
      const dummyResponse = {
        status: "success",
        message: "Data received successfully in dev mode.",
        receivedData: data, // Optionally include the received data in the response
      };

      // Simulate a delay to mimic async server communication
      return new Promise((resolve) =>
        setTimeout(() => resolve(dummyResponse), 1000)
      );
    }

    showUserFeedback(success, surveyData, error = "") {
      const feedbackMessage = this.buildFeedbackMessage(
        success,
        surveyData,
        error
      );

      // Update modal content
      this.feedbackModalText.innerHTML = feedbackMessage;

      // Use existing method to show modal
      this.openFeedbackModal();
    }

    async sendDataToSheet(scriptUrl, surveyData) {
      try {
        const response = await this.sendRequest(scriptUrl, surveyData);
        console.log("Data sent:", surveyData);
        if (!this.feedbackShown) this.showUserFeedback(true, surveyData); // Check before showing feedback
      } catch (error) {
        console.error("Error in sending data:", error);
        if (!this.feedbackShown)
          this.showUserFeedback(false, surveyData, error); // Check before showing feedback
      }
    }

    handleSubmit() {
      // Set a timeout for the fallback message
      const fallbackTimeout = setTimeout(() => {
        this.showUserFeedback(false, {}, MSGS.ISSUE);
      }, 15000); // 15 seconds timeout

      try {
        let userInfo = {
          name: document.getElementById("name").value,
          email: document.getElementById("email").value,
        };

        let surveyData = this.prepareSurveyData();

        this.sendDataToSheet(this.scriptUrl, surveyData)
          .then(() => {
            clearTimeout(fallbackTimeout); // Clear the fallback timeout
            this.showUserFeedback(true, surveyData, MSGS.SUCCESS);
          })
          .catch((error) => {
            clearTimeout(fallbackTimeout); // Clear the fallback timeout
            console.error("Submission failed:", error);
            this.showUserFeedback(false, surveyData, MSGS.ERROR_SAVED);
          })
          .finally(() => {
            clearTimeout(fallbackTimeout); // Ensure the timeout is cleared
          });
      } catch (error) {
        clearTimeout(fallbackTimeout); // Clear the fallback timeout
        console.error("Error preparing data:", error);
        this.showUserFeedback(false, {}, MSGS.ERROR_PREP);
      }
    }

    async sendRequest(url, data) {
      if (isDev()) {
        const dummyResponse = this.sendDummyDevResponse(data);
        console.log("Dummy response:", dummyResponse);
        return dummyResponse;
      }

      let jsonData = JSON.stringify(data);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=utf-8", // Avoid preflight by using text/plain
          },
          body: jsonData,
          redirect: "follow", // Important if the request is being redirected
        });

        if (!response.ok) {
          // If the HTTP status code is not in the 200-299 range
          throw new Error(
            `Network response was not ok: ${response.statusText}`
          );
        }

        // Parse the JSON response
        const jsonResponse = await response.json();

        // Check if the server indicates success
        if (jsonResponse.result === "success") {
          console.log("Data sent successfully:", jsonResponse);
          return jsonResponse; // Return the successful response
        } else {
          // Handle any server-side errors
          throw new Error(
            `Server did not indicate success: ${JSON.stringify(jsonResponse)}`
          );
        }
      } catch (error) {
        // Handle any network errors or server-side errors
        console.error("Error in sending data:", error);
        throw error; // Re-throw the error for further handling
      }
    }

    /** end class */
  }

  const deployId =
    "AKfycbzgcQYvmPmgDv19KduiKLK43xRTCqGFEyESM9rz4zjBmy-2jConvlcAoqBaVRnTpBB8Rg";
  const scriptUrl = `https://script.google.com/macros/s/${deployId}/exec`;

  document
    .getElementById("nextBtn1")
    .addEventListener("click", () => showSection(1));
  document
    .getElementById("prevBtn2")
    .addEventListener("click", () => showSection(0));
  document
    .getElementById("nextBtn2")
    .addEventListener("click", () => showSection(2));
  document
    .getElementById("prevBtn3")
    .addEventListener("click", () => showSection(1));

  new SurveyManager(scriptUrl);
});
