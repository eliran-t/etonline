const FEEDBACK_EMAIL = "contact@eleaptech.com";
const sections = ["s1_context", "s2_tasks", "s3_commentSubmit"];

let inputPillText = {
  text: "Click to add a task of your own. Press Enter to confirm.",
  shortText: "Click to add",
};

function isDev() {
  console.log("isDev => window.location.hostname:", window.location.hostname);
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
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

const PILLS = [
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
    info: "<p>Which tasks drain your team's time, energy and moral?</p><ul><li><b>Entering information by hand:</b> Often seen as boring and repetitive</li><li><b>Checking for mistakes in documents:</b> Requires a lot of focus and can be tiring</li><li><b>Cold calling:</b> Making unsolicited calls can be stressful</li><li><b>Manually updating spreadsheets:</b> Takes a long time and is easy to make mistakes</li></ul>",
  },
  {
    id: "qUserCandidates",
    label: "Best Candidates",
    info: "<p>Which tasks would you like to optimize?</p><ul><li><b>Entering information by hand:</b> Tools exist that can pull in information automatically</li><li><b>Responding to customer questions:</b> Chatbots can answer simple questions, letting your team focus on more complex issues</li><li><b>Managing social media:</b> Some programs can schedule posts, analyze what's working, and even help create content</li><li><b>Looking for patterns in data:</b> Special software can quickly analyze large amounts of information to find trends you might miss</li></ul>",
  },
];

function addLabelToInfo(dropZoneNames) {
  dropZoneNames.forEach((dropZone) => {
    // Prepend the label to the info property, wrapped in a heading tag for emphasis
    dropZone.info = `<h3>${dropZone.label}</h3>${dropZone.info}`;
  });
}

document.addEventListener("DOMContentLoaded", function () {
  // Assuming dropZoneNames is available and populated
  addLabelToInfo(dropZoneNames);
});

const MSGS = {
  SUBMIT: "Submitting your survey...",
  ISSUE:
    "There was an issue submitting your survey. Please email me at " +
    FEEDBACK_EMAIL,
  SUCCESS: "Survey submitted successfully. Thank you for your participation!",
  ERROR_SAVED: "An error occurred. Please try again later or contact support.",
  ERROR_PREP:
    "An error occurred while preparing your data. Please try again or contact support.",
  SECTION2_INFO: `
  <div class="S2-main-info-title">
    🎯 Survey Goal
  </div>
  <div class="S2-main-info-text">
    Map your team's daily tasks to groups to identify the best candidates for taking the 'tech leap'.
  </div>
  <div class="S2-main-info-title">
     A side product of the above:
  </div>
  <div class="S2-main-info-text">
    - Uncover hidden inefficiencies and workflow blind spots.
    - Identify untapped opportunities for growth and profit.
 </div>
  <div class="S2-main-info-title">
  Next, tailor Software Solutions based on the COP strategy:
 </div>
  <div class="S2-main-info-text">

    <ul class="s2-ul-li-info-modal">
        <li><b>Control:</b> Empower your team with real-time insights, intuitive dashboards, and useful notifications about critical events and processes.</li>
        <li><b>Optimize:</b> Improve workflows with tools like automation (e.g., scheduling weekly reports or triggering follow-up emails after customer inquiries)...</li>
        <li><b>Prevent:</b> Safeguard org operations by reducing manual error-prone  tasks, leverage historical data to predict and prevent potential issues...</li>
      </ul>

  </div>
    <div class="S2-main-info-title">

End Goal:
  </div>
    <div class="S2-main-info-text">
Free up your team to focus on what they truly enjoy and excel at while maximizing your organization's productivity, efficiency, growth, and profit.
  </div>
`,
  SECTION2_INFO: ` 
  <div class="S2-main-info-title">⚙️ <b>Instructions:</b></div>
  <div class="S2-main-info-text">
    <ul class="s2-ul-li-info-modal">
      <li>Each box represents a group of tasks.<ul>
          <li>a task can be in multiple groups.</li>
        </ul></li>
      <li>Click (select) a box to open Tasks Pool<ul>
  <li>list of common tasks categories.</li>
</ul></li>
      <li>Click a category to see its tasks.</li>
      <li>Click or drag&drop pills into selected box.</li>
      <li>Click last category (Custom input) to add new tasks.</li>
      <li>Click white pill to edit , press Enter to commit.</li>

      <ul>
          <li>new pill is added to both box and pool.</li>
        </ul>
      <li>
        Click the category's
        <i
          id="infoIconSection2"
          class="fas fa-question-circle info-modal-icon"
          style="cursor: pointer; color: rgb(27, 192, 222); margin: 0 3px"
        ></i>
        for full pills names and more info.
      </li>
    </ul>
  </div>
  
`,
};
