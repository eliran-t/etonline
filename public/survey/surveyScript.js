/*********************************************************************************
 * **********************************************
 * #region JavaScript
 * **********************************************
 * ****************************************************************************/

// Tracks the currently dragged pill globally
let draggedPill = null;
let activeDropZone = null;
let inputPillClicked = null;
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
    // In constructor
    this.poolCollapse = new bootstrap.Collapse(this.element, {
      toggle: false, // Prevent automatic toggling to control it manually
    });

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

    // Add an event listener to the pool's main element
    this.poolLabel.addEventListener("click", (event) => {
      event.stopPropagation(); // Prevent event from propagating
      this.closePool();
    });

    this.closeButton.addEventListener("click", (event) => {
      event.stopPropagation(); // Prevent event from propagating
      this.closePool();
    });
  }

  positionByDropZone() {
    if (!this.dropZoneRef) return;

    let relativeTopOffset = screen.width < 768 ? 180 : 30;
    let relativeLeftOffset = screen.width < 768 ? -25 : 50;

    const rect = this.dropZoneRef.element.getBoundingClientRect();
    let topOffset = window.scrollY || document.documentElement.scrollTop;
    let newTop = rect.top + topOffset + relativeTopOffset;
    let newLeft = rect.right + window.scrollX + relativeLeftOffset; // Default position

    this.element.style.top = `${newTop}px`;
    this.element.style.left = `${newLeft}px`;
  }

  togglePoolState(isOpen, newDropZoneRef) {
    this.setDropZone(isOpen ? newDropZoneRef : null);

    if (isOpen) {
      this.element.opacity = 1;
      this.element.classList.remove("kids-pool");
      this.element.style.display = ""; // Reset to default or specific display style

      // Force a reflow to ensure transitions play
      void this.element.offsetHeight;
    } else {
      this.element.opacity = 0;
      this.element.classList.add("kids-pool");
      this.element.style.display = "none"; // Hide element from the document flow
    }

    this.setTabIndexBasedOnPoolState(isOpen);
    this.isPoolOpen = isOpen;
  }

  closePool() {
    if (activeDropZone) {
      activeDropZone.deactivate();
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
    this.bsCollapse = null;
    this.initializeTransitionHandling();
    dropzoneContainer.appendChild(this.element);
  }

  initializeTransitionHandling() {
    // Listen for the transition end event on the dropzone element
    this.element.addEventListener("transitionend", (event) => {
      console.log("Transition end event triggered on ", event.propertyName);
      if (event.propertyName === "opacity") {
        // Ensure we're looking at the right CSS property
        this.onTransitionEnd();
      }
    });
  }

  onTransitionEnd() {
    // Check the current state and act accordingly
    if (this.element.classList.contains("show")) {
      // The element has just been shown
      console.log("Dropzone transition to 'open' finished.");
      this.pillPoolRef.togglePoolState(true, this); // Open the pill pool
    } else {
      // The element has just been hidden
      console.log("Dropzone transition to 'close' finished.");
      this.pillPoolRef.togglePoolState(false, this);
    }
  }

  createDropZoneElement() {
    this.element = document.createElement("div");
    this.element.id = this.id;
    // Keep the unfocused class along with collapse for Bootstrap
    this.element.className = "dropzone unfocused collapse";
    this.element.tabIndex = 0;

    // Add label for the drop zone
    const labelDiv = document.createElement("div");
    labelDiv.className = "survey-label";
    labelDiv.textContent = this.label;
    this.element.appendChild(labelDiv);

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
          activeDropZone.deactivate(); // Set activeDropZone to null
        }
      },
      true
    ); // Use capture phase to ensure the event is captured at the document level
  }

  onFocus(event) {
    if (!this.pillPoolRef.dropZoneRef == this) {
      this.activate();
    }
  }

  // Modify the activate method to handle pill pool only after transition ends
  activate() {
    console.log("Activating ");
    // Check if bsCollapse already exists, if not, create it
    if (!this.bsCollapse) {
      this.bsCollapse = new bootstrap.Collapse(this.element, {
        toggle: false,
      });
    }
    console.log("Activating drop zone:", this.id);
    this.bsCollapse.show();
    this.element.classList.remove("unfocused");
    this.focusDropZone();
    activeDropZone = this;
    this.element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  // Modify the deactivate method to handle pill pool only after transition ends
  deactivate() {
    // Assuming bsCollapse has been created in activate(), just hide it
    if (this.bsCollapse) {
      console.log("Deactivating drop zone:", this.id);
      this.bsCollapse.hide();
    }
    this.element.classList.add("unfocused");
    activeDropZone.unFocusDropZone();
    activeDropZone = null;
  }

  openPillPool() {
    this.pillPoolRef.togglePoolState(true, this);
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
      activeDropZone.deactivate(); // Set activeDropZone to null
      return;
    }

    // Case 2: Clicking on a different zone
    if (activeDropZone) {
      activeDropZone.deactivate();
      return;
    }

    // Case 3: First click on a zone
    this.activate(); // Set this drop zone as the active one
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
  const body = document.body;

  infoModalText.innerHTML = message;
  if (color) {
    infoModalContent.style.backgroundColor = color;
  }
  infoModal.style.display = "flex"; // Use flex to center the modal
  body.classList.add("body-no-scroll"); // Disable scrolling on the body

  infoModalClose.onclick = function () {
    infoModal.style.display = "none";
    body.classList.remove("body-no-scroll"); // Re-enable scrolling on the body
  };

  window.onclick = function (event) {
    if (event.target == infoModal) {
      infoModal.style.display = "none";
      body.classList.remove("body-no-scroll"); // Re-enable scrolling on the body
    }
  };
}

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

function startSurvey() {
  const section0_element = document.getElementById("s0_welcome");
  const section1_element = document.getElementById("s1_context");
  section1_element.classList.remove("collapse");
  section1_element.classList.add("show");

  section0_element.classList.remove("show");
  section0_element.classList.add("collapse");
}

function observeNextButton(btnElement) {
  console.log("observeNextButton called for:", btnElement);

  if (!isDev()) {
    // Disable the button initially
    btnElement.disabled = true;
  }

  // Function to handle intersection changes
  const intersectionCallback = (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Enable the button when sentinel is intersecting with viewport
        btnElement.disabled = false;
        console.log("Button enabled because sentinel is visible.");
        // Disconnect observer once enabled (optional)
        observer.disconnect();
      }
    });
  };

  // Create IntersectionObserver instance
  const observer = new IntersectionObserver(intersectionCallback, {
    root: null, // viewport as root
    threshold: 0.5, // trigger when 50% of sentinel is visible
  });

  // Observe the sentinel element
  const sentinel = document.getElementById("scrollSentinel");
  if (sentinel) {
    observer.observe(sentinel);
    console.log("Observer started for sentinel.");
  } else {
    console.error("Sentinel element not found.");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  class SurveyManager {
    constructor(scriptUrl) {
      this.hasShownUserFeedback = false;
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
      this.pillPool.togglePoolState(false);
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

    buildFeedbackMessage(success, surveyData, error = "") {
      // Initial message based on success or failure
      let feedbackMessage = success
        ? `<div class=feedback-title>✅ Success!</div> <br> Your survey has been submitted successfully!`
        : `<div class=feedback-title>❌ Error!</div><br/>Survey submission failed.<br/> Please try again or email <b> ${FEEDBACK_EMAIL}</b> for support. Please also save your responses from the text below.<br/><br/>Error: ${error}<br>`;

      // Adding the answers section
      feedbackMessage +=
        "<br><br><strong>Thank you for your time!</strong><br> Here are your answers:<br>";

      // Initialize feedbackMessage with an opening <ul> tag for an unordered list
      feedbackMessage += `<br><ul class="feedback-survey-res" style='text-align: left;'>`;

      // Loop through surveyData to append each answer as a list item
      Object.keys(surveyData).forEach((key) => {
        const matchingZone = dropZoneNames.find((zone) => zone.id === key);
        const label = matchingZone ? matchingZone.label : key;
        // Wrap each feedback item in <li> tags instead of using a dash
        feedbackMessage += `<li><b>${label}</b>:  ${surveyData[key]}</li>`;
      });

      // Close the unordered list with a closing </ul> tag
      feedbackMessage += "</ul>";
      // Thank you note for successful submissions
      if (success) {
        feedbackMessage += `<br>Feel free to contact us at<br> ${FEEDBACK_EMAIL} <br>for any feedback.`;
      }

      return feedbackMessage;
    }

    showUserFeedback(success, surveyData, error = "") {
      // Check if the feedback modal has already been shown

      if (this.hasShownUserFeedback) {
        return; // Exit the function early if the modal has already been shown
      }

      try {
        const feedbackMessage = this.buildFeedbackMessage(
          success,
          surveyData,
          error
        );

        // Update modal content
        this.feedbackModalText.innerHTML = feedbackMessage;

        // Use existing method to show modal
        this.openFeedbackModal();
      } catch (error) {
        console.error("Error in showing feedback:", error);
        return;
      }
      this.hasShownUserFeedback = true;
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

        this.sendDataToSheet(this.scriptUrl, userInfo, surveyData)
          .then(() => {
            clearTimeout(fallbackTimeout); // Clear the fallback timeout
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

    async fetchWrapper(url, jsonData) {
      if (isDev()) {
        // Simulate a JSON response in development mode
        const dummyResponse = {
          status: 200,
          statusText: "OK",
          json: () =>
            Promise.resolve({
              result: "success",
              message: "Data received successfully in dev mode.",
            }),
        };
        return new Promise((resolve) =>
          setTimeout(() => resolve(dummyResponse), 1000)
        );
      }

      // Simulate a delay to mimic async server communication

      return await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8", // Avoid preflight by using text/plain
        },
        body: jsonData,
        redirect: "follow", // Important if the request is being redirected
      });
    }

    async sendDataToSheet(url, userInfo, surveyData) {
      let data = { ...userInfo, ...surveyData };

      let jsonData = JSON.stringify(data);

      try {
        const response = await this.fetchWrapper(url, jsonData);

        // Parse the JSON response
        const jsonResponse = await response.json();

        // Check if the server indicates success
        if (jsonResponse.result === "success") {
          console.log("Data sent successfully:", jsonResponse);
          this.showUserFeedback(true, surveyData, MSGS.SUCCESS);
          return true;
        } else {
          // Handle server-side errors properly
          throw new Error(
            `Server did not indicate success: ${JSON.stringify(jsonResponse)}`
          );
        }
      } catch (error) {
        // Handle any network errors or server-side errors
        console.error("Error in sending data:", error);
        this.showUserFeedback(false, surveyData, error); // Check before showing feedback
        return false;
      }
    }

    /** end class */
  }

  const deployId =
    "AKfycbzgcQYvmPmgDv19KduiKLK43xRTCqGFEyESM9rz4zjBmy-2jConvlcAoqBaVRnTpBB8Rg";
  const scriptUrl = `https://script.google.com/macros/s/${deployId}/exec`;

  document
    .getElementById("infoIconSection1")
    .addEventListener("click", function () {
      infoModal("Except for this one. ;)");
    });

  document
    .getElementById("infoIconSection2")
    .addEventListener("click", function () {
      infoModal(MSGS.SECTION2_INFO);
    });

  document
    .getElementById("nextBtn0")
    .addEventListener("click", () => startSurvey());

  let contentBtn = document.getElementById("nextBtn1");
  observeNextButton(contentBtn);
  contentBtn.addEventListener("click", () => showSection(1));

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
