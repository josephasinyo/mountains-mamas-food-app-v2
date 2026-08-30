export interface ManualImage {
    src: string;
    alt: string;
    caption?: string;
}

export interface ManualSubSection {
    title?: string;
    paragraphs?: string[];
    steps?: string[];
    image?: ManualImage;
    images?: ManualImage[];
    tip?: string;
    warning?: string;
}

export interface ManualSection {
    id: string;
    title: string;
    description?: string;
    subsections?: ManualSubSection[];
    steps?: string[];
    paragraphs?: string[];
    image?: ManualImage;
    images?: ManualImage[];
    tip?: string;
    warning?: string;
}

export interface ManualData {
    title: string;
    subtitle: string;
    portalType: 'admin' | 'company';
    sections: ManualSection[];
}

export const ADMIN_MANUAL_DATA: ManualData = {
    title: "Catering Admin & Staff User Manual",
    subtitle: "Complete operational guide for running the catering platform",
    portalType: "admin",
    sections: [
        {
            id: "welcome",
            title: "Welcome & Overview",
            paragraphs: [
                "Welcome to the Admin Operational Guide! This manual is your complete, step-by-step guide for managing every part of the catering platform.",
                "Every section in this manual explains the purpose of each feature, why it exists, and how to use it step-by-step to run daily operations smoothly.",
                "Use the search bar or sidebar navigation to jump directly to any topic. You can also print out clean copies or save this manual as a PDF at any time."
            ]
        },
        {
            id: "login-passwords",
            title: "1. How to Log In & Reset Passwords",
            description: "Purpose: Secure authentication ensures only authorized catering administrators and staff members can access business operations, order data, and financial records.",
            paragraphs: [
                "The Admin Portal (/admin) is password-protected to safeguard company metadata, customer contact details, and billing invoices."
            ],
            steps: [
                "Go to your admin URL: /admin",
                "Type in your admin email (mountainmamascafe@gmail.com) and password.",
                "Click Log In to open your main Admin Dashboard."
            ],
            tip: "Password Reset: If you ever forget your password, click 'Forgot Password?' on /admin/login to receive an instant password reset link by email."
        },
        {
            id: "dashboard-alerts",
            title: "2. How to Use the Admin Dashboard & Sound Alerts",
            description: "Purpose: The Admin Dashboard gives you an instant, real-time command center to monitor daily lunch volume, pending orders, partner companies, and kitchen alerts at a glance.",
            paragraphs: [
                "Your main Dashboard (/admin) provides a live summary of daily kitchen operations so you can quickly see what needs attention today."
            ],
            subsections: [
                {
                    title: "Dashboard Key Indicators",
                    paragraphs: [
                        "The summary cards at the top of your dashboard give you immediate insights into business volume:"
                    ],
                    steps: [
                        "Today's Lunches: Total lunch orders scheduled for tours leaving today. Use this number to verify morning kitchen prep.",
                        "Pending Lunches: Lunches currently awaiting kitchen preparation or status updates.",
                        "Active Companies: Total count of active tour company partner accounts operating on the platform.",
                        "Month's Lunches: Total box lunches ordered across all tours for the current calendar month.",
                        "Menu Items: Total active food items currently available for ordering.",
                        "All Time Lunches: All-time cumulative box lunches ordered across the history of the catering platform."
                    ],
                    image: {
                        src: "/manuals/dashboard_kpis.png",
                        alt: "Admin Dashboard Key Indicators Overview",
                        caption: "Admin Dashboard Key Indicators (KPI Summary Cards)"
                    }
                },
                {
                    title: "Managing New Order Sound Alerts",
                    paragraphs: [
                        "Purpose of Sound Alerts: In a busy kitchen environment, staff cannot constantly refresh the screen. Sound alerts play an audio chime whenever a new order is submitted, ensuring last-minute orders are never missed."
                    ],
                    steps: [
                        "Go to App Settings (/admin/settings).",
                        "Locate the New Order Sound Alerts toggle switch.",
                        "Click the switch to turn sound alerts on or off.",
                        "Click 'Test Sound Alert' to test the chime volume on your browser speakers."
                    ],
                    image: {
                        src: "/manuals/sound_alerts.png",
                        alt: "Managing New Order Sound Alerts Setting",
                        caption: "App Settings - New Order Sound Alert Toggle & Test Button"
                    }
                }
            ]
        },
        {
            id: "tour-companies",
            title: "3. How to Set Up, Approve & Manage Tour Companies",
            description: "Purpose: Managing tour company profiles allows you to customize volume pricing, set billing payment methods, configure custom ordering links, and provide dedicated customer support.",
            paragraphs: [
                "You can onboard tour operators in two different ways depending on how they join your platform: Approving Self-Registered Companies or Direct Admin Onboarding."
            ],
            subsections: [
                {
                    title: "Approving Self-Registered Companies",
                    paragraphs: [
                        "What it is: A Self-Registered Company is a tour operator that filled out the public registration form on your website (/company/register) to request an account.",
                        "Why approval is required: When a company self-registers, their account is automatically placed on hold with a Pending status to prevent unauthorized ordering until an Admin verifies their company details."
                    ],
                    steps: [
                        "Go to /admin/companies and click the Pending tab.",
                        "Review the company's contact name, phone number, and email.",
                        "Click Activate (under the Actions menu) to approve the company and grant them instant portal access."
                    ],
                    image: {
                        src: "/manuals/approve_company.png",
                        alt: "Approving Self-Registered Tour Companies",
                        caption: "Tour Companies - Pending Tab & Activate Account Action"
                    }
                },
                {
                    title: "Adding a New Tour Company Manually (Admin Onboarding)",
                    paragraphs: [
                        "What it is: The alternative way to register a company is Direct Admin Onboarding. Instead of waiting for a company to sign up on their own, an Admin directly creates the company account and emails them an invitation link.",
                        "Why use this method: This is the fastest way to onboard negotiated tour partners, allowing you to set their custom volume discounts, default pickup times, and billing rules upfront."
                    ],
                    steps: [
                        "Click + Add Company at the top right of /admin/companies.",
                        "Enter Company Name, Contact Email, Phone, Representative Name & Title.",
                        "Select Payment Method: Choose Direct Pay (credit card required at checkout) or Invoice Billing (monthly invoice statements).",
                        "Set Discount Percentage (e.g., 5% or 10% volume discount).",
                        "Type Kitchen Prep Instructions: Add custom packing notes for your kitchen team (e.g., 'Pack in insulated cooler boxes with ice packs').",
                        "Choose Branding Mode: Toggle Use Mountain Mamas Branding to display standard logos, or leave off to display the company's custom greeting.",
                        "Click Save Company.",
                        "Click Resend Invitation (under Actions) to send an onboarding email so the company contact can set their password and log in immediately without waiting for approval."
                    ],
                    images: [
                        {
                            src: "/manuals/add_company_button.png",
                            alt: "Add Company Button on Admin Tour Companies List",
                            caption: "Tour Companies List - Click + Add Company to manually register a new tour partner"
                        },
                        {
                            src: "/manuals/add_company_modal.png",
                            alt: "Add New Company Modal Form",
                            caption: "Add New Company Form - Enter partner identity, payment method, discounts, and kitchen packing instructions"
                        }
                    ]
                },
                {
                    title: "Finding & Copying Ordering Links",
                    paragraphs: [
                        "Purpose: Each tour company receives unique web links (URL slugs) that allow their guests to select meals directly.",
                        "Default Link vs White-Labeled Link:",
                        "• Default Link: The name of the tour company is displayed in the header of their ordering app and the link shows the company name (e.g., /northwestern-tours).",
                        "• White-Labeled Link: The branding of Mountain Mama's Café is displayed in the header of the company's ordering app and their name is not shown in the ordering link (e.g., /lunches-0d56)."
                    ],
                    steps: [
                        "Go to /admin/companies.",
                        "Click the arrow next to any company row to expand their Partner Profile.",
                        "Locate the Public Slug(s) section showing the Default Link and White-Labeled Link.",
                        "Click Copy Link (or copy icon) to copy the URL to your clipboard and share it with the tour company."
                    ],
                    image: {
                        src: "/manuals/company_ordering_links.png",
                        alt: "Expanded Tour Company Profile showing Default and White-Labeled Public Slugs",
                        caption: "Expanded Tour Company Profile - Public Slugs showing Default and White-Labeled ordering URLs"
                    }
                },
                {
                    title: "Viewing a Tour Company's Portal ('View Portal')",
                    paragraphs: [
                        "Purpose: If a tour company calls asking for help with their portal or needs assistance managing orders or invoices, View Portal mode allows you to view the app directly through their company dashboard without asking for their private password."
                    ],
                    steps: [
                        "Go to /admin/companies.",
                        "Locate the company row and click the '...' (Three Dots) Actions menu on the right.",
                        "Click View Portal.",
                        "You will enter their portal in Admin Mode with a top banner reading 'VIEWING PORTAL AS [COMPANY NAME] (ADMIN MODE)'.",
                        "Inspect orders, check guest meal lists, or update company settings on their behalf.",
                        "When finished, click the Return to Admin button on the top banner to safely return to your Admin Dashboard."
                    ],
                    images: [
                        {
                            src: "/manuals/view_company_portal_button.png",
                            alt: "Actions Menu showing View Portal option",
                            caption: "Actions Menu (...) - Click View Portal to access a tour company's dashboard"
                        },
                        {
                            src: "/manuals/viewing_company_portal_banner.png",
                            alt: "Viewing Portal As Company Top Banner with Return to Admin button",
                            caption: "Company Portal View - Top banner displays active company in Admin Mode and Return to Admin button"
                        }
                    ]
                }
            ]
        },
        {
            id: "meals-menu",
            title: "4. How to Manage Menu Items & Food Choices",
            description: "Purpose: The Menu Catalog gives you full control over box lunches, junior boxes, sandwich-only offerings, pricing, add-ons, and ingredient availability.",
            paragraphs: [
                "Manage all menu items, price tiers, package offerings, and food photos from Meals (/admin/meals). Bread choices and cookie options are managed separately on the App Settings page (/admin/settings)."
            ],
            subsections: [
                {
                    title: "Adding or Editing a Meal Item",
                    paragraphs: [
                        "Purpose of Adding & Editing Meals: Adding a new meal item allows you to expand your catering menu with new sandwich options, entrees, or seasonal box lunches. Editing an existing meal allows you to update item prices, refine ingredient descriptions, upload new food photos, or adjust package pricing (Box Lunch, Sandwich Only, Junior Box) whenever your menu evolves."
                    ],
                    steps: [
                        "Go to /admin/meals.",
                        "Click + Add Meal to create a new item, or click the Pencil (Edit) icon on an existing meal card.",
                        "Set Meal Name, Description, Standard Box Price, Sandwich-Only Price, and Junior Box Price.",
                        "Pick Category: Sandwich, Entree, Salad, Snack, Dessert, or Drink.",
                        "Pick Package Type: Box Lunch, Junior Box, or Both.",
                        "Type Box Includes Text: Describe what comes inside the box (e.g., 'Includes kettle chips, apple, and chocolate chip cookie').",
                        "Upload Images: Upload photos for Main, Box Lunch, or Junior Box (PNG, JPG, or WEBP up to 10MB).",
                        "Click Save Meal."
                    ],
                    images: [
                        {
                            src: "/manuals/add_meal_button.png",
                            alt: "Menu Management page showing meal cards and Add Meal button",
                            caption: "Menu Management (/admin/meals) - Click + Add Meal to create a new item or click Edit Details on any meal card"
                        },
                        {
                            src: "/manuals/edit_meal_modal.png",
                            alt: "Edit Meal modal form showing meal details, images, and pricing",
                            caption: "Edit Meal Form - Update meal name, description, category, package type, main image, and box inclusions"
                        }
                    ]
                },
                {
                    title: "Hiding or Showing Meals Instantly (Ingredient Outages)",
                    paragraphs: [
                        "Purpose: If the kitchen runs out of a specific ingredient (e.g., Turkey or Gluten-Free Wraps), you can temporarily hide that meal from all guest and company ordering menus instantly without deleting the item record."
                    ],
                    steps: [
                        "Locate the meal on /admin/meals.",
                        "Hover over the meal card and click the Eye Icon (Eye = Active / Visible on menu; Crossed Eye = Inactive / Hidden).",
                        "The meal instantly hides from all ordering pages until you click the Eye Icon again to reactivate it."
                    ],
                    image: {
                        src: "/manuals/hide_meal_button.png",
                        alt: "Meal Card showing Eye Icon button for hiding/showing meal items",
                        caption: "Meal Card - Click the Eye icon on any meal photo to instantly hide or show the item on the menu"
                    }
                },
                {
                    title: "Managing Available Bread & Cookie Options",
                    paragraphs: [
                        "Purpose: Managing global bread options (Herby Focaccia, Sour Dough Bread, Gluten-free wrap) and cookie choices (Homemade Cookie, Lemon Blueberry, Chocolate Chip) gives guests custom flexibility during checkout while ensuring the kitchen has an exact count for morning prep."
                    ],
                    steps: [
                        "Go to App Settings (/admin/settings).",
                        "Scroll to the Bread Options or Cookie Options card.",
                        "Adding a New Option: Type the new bread name (e.g., 'Sourdough') or cookie name into the input field at the top of the section and click the orange + button to save it.",
                        "Reordering Display Order: Use the Up Arrow (↑) and Down Arrow (↓) icons beside any bread or cookie item to shift its position up or down. This controls how options are displayed on the tour companies' dashboard settings page. Tour companies can then choose from these available options and reorder them on their own settings page in the exact sequence they want displayed for their guests.",
                        "Removing an Option: Hover over any bread or cookie row and click the red Trash Can icon on the right side to delete that option from the system."
                    ],
                    image: {
                        src: "/manuals/bread_cookie_options.png",
                        alt: "Bread and Cookie Options management on App Settings page",
                        caption: "App Settings (/admin/settings) - Manage global bread and cookie options, reorder items with arrows, or delete choices with the trash icon"
                    }
                }
            ]
        },
        {
            id: "orders-fulfillment",
            title: "5. How to Track, Edit & Fulfill Orders",
            description: "Purpose: The Order Center provides complete visibility over every lunch order placed across all tour companies, giving kitchen and logistics staff tools to filter, edit, and fulfill orders accurately.",
            paragraphs: [
                "Track and manage all active, upcoming, and fulfilled orders from Orders (/admin/orders)."
            ],
            subsections: [
                {
                    title: "Searching & Filtering Orders",
                    paragraphs: [
                        "Purpose of Date Toggles: Filtering by Tour Date allows kitchen staff to focus on meals leaving today or tomorrow, while filtering by Placed At Date helps track when orders were submitted."
                    ],
                    steps: [
                        "Search Bar: Type a Guest Name, Order ID, Guide Name, or Tour Company.",
                        "Date Dropdown: Filter by Date Range (Today, Yesterday, Tomorrow, This Week, Next Week, Custom Range).",
                        "Status Dropdown: Filter by Pending, Pending Order Request, Fulfilled, or Cancelled.",
                        "Tour Date vs Placed Date Toggle: Switch between sorting by the date the tour leaves vs the date the order was placed."
                    ],
                    image: {
                        src: "/manuals/search_filter_orders.png",
                        alt: "Orders search and filter control bar on /admin/orders",
                        caption: "Orders Management (/admin/orders) - Filter orders by keyword search, Tour Date vs Order Date toggle, date range, company, and order status"
                    }
                },
                {
                    title: "Expanding Orders & Checking Custom Choices",
                    paragraphs: [
                        "Purpose: Clicking an order card toggles it open to reveal complete item breakdowns, package types, custom bread selections, cookie choices, cheese options, and dietary allergy notes specified by guests. Clicking the card a second time smoothly collapses it back to its compact summary view."
                    ],
                    steps: [
                        "Click on any order card on /admin/orders to expand its full details.",
                        "Review the Total Items count and exact quantity breakdown (e.g., 7x Turkey and Cheese, 3x Ham and Cheese).",
                        "Inspect custom options for each meal: Lunch Package Type (Box Lunch vs Junior Box), Bread Options (e.g., Sour Dough Bread), Cookie Options (e.g., Homemade Cookie), and Cheese/Sandwich Options.",
                        "Check total price calculations and timestamps (Tour Date & Time vs Placed At Date & Time).",
                        "Click anywhere on the expanded order card again to collapse the details and return to the compact list view."
                    ],
                    image: {
                        src: "/manuals/expanded_order_details.png",
                        alt: "Expanded Order Card showing Item Breakdown, bread, cookie, and package choices",
                        caption: "Expanded Order Details - View complete item breakdown, custom bread/cookie selections, and quantity totals (click card again to collapse)"
                    }
                },
                {
                    title: "Understanding Order Status Definitions",
                    paragraphs: [
                        "Purpose of Order Statuses: Order statuses give catering admins and kitchen staff an instant, clear indicator of where an order stands in the preparation and delivery pipeline.",
                        "• Pending: An order that has been confirmed by a tour company or guest, currently awaiting kitchen preparation and packing for its upcoming tour date.",
                        "• Pending Order Request: A new order submission or order modification request submitted by a tour company that requires admin review and approval before being finalized.",
                        "• Fulfilled: An order that has been completely prepared, packed into lunch boxes by the kitchen staff, and handed off to the tour guide for departure.",
                        "• Cancelled: An order that has been called off or voided (due to tour cancellation or guest changes) and will not be prepared by the kitchen."
                    ]
                },
                {
                    title: "Updating Individual Order Statuses",
                    paragraphs: [
                        "Purpose of Status Updates: Changing an order's status ensures kitchen prep, box packing, and final guide hand-offs are tracked accurately in real time."
                    ],
                    steps: [
                        "Locate the target order card on /admin/orders.",
                        "Click the '...' (Three Dots) button in the top right corner of the order card to open the Actions menu.",
                        "Hover over Change Status > to expand the status options.",
                        "Click Pending, Pending Order Request, Fulfilled, or Cancelled to instantly update the order status."
                    ],
                    image: {
                        src: "/manuals/order_actions_change_status.png",
                        alt: "Order Card Actions menu showing Change Status options",
                        caption: "Order Card Actions (...) - Click the three dots and select Change Status to update an order"
                    }
                },
                {
                    title: "Performing Bulk Actions on Multiple Orders",
                    paragraphs: [
                        "Purpose of Bulk Actions: Performing bulk status changes allows kitchen and administrative staff to process or fulfill dozens of tour orders simultaneously with a single click, saving valuable time."
                    ],
                    steps: [
                        "Select the checkbox on individual order cards, or click Select All (100) at the top of the screen to select all orders displayed on this page.",
                        "Use the Update Status dropdown menu in the floating bulk action bar to bulk change the status of all selected orders (e.g., Mark Pending, Mark Fulfilled, Mark Cancelled).",
                        "You can also delete the selected orders at once by clicking Delete Selected."
                    ],
                    tip: "Important: Bulk deleting orders removes them permanently and cannot be undone.",
                    image: {
                        src: "/manuals/bulk_actions_orders.png",
                        alt: "Bulk Actions bar showing Select All, Update Status dropdown, and Delete Selected button",
                        caption: "Bulk Order Actions - Select multiple orders or Select All (100) to update statuses or delete orders simultaneously"
                    }
                },
                {
                    title: "Switching Between List View & Cards View",
                    paragraphs: [
                        "Purpose of Layout Views: Switch between layout modes depending on whether you need to visually inspect detailed sandwich selections and custom options (Cards View) or quickly scan line-item totals across many orders (List View)."
                    ],
                    steps: [
                        "Go to /admin/orders.",
                        "Click List View at the top right header to switch to a compact tabular spreadsheet format.",
                        "Click Cards View to switch back to full order cards showing item breakdowns, bread choices, and cookie options."
                    ],
                    image: {
                        src: "/manuals/list_view_table_orders.png",
                        alt: "Orders List Table View showing Customer, Company, Tour Date, Items, and Status columns",
                        caption: "Orders List View - Tabular layout displaying line-item orders with List / Cards view toggle"
                    }
                },
                {
                    title: "Printing the Order Table & Exporting CSV Data",
                    paragraphs: [
                        "Purpose: Printing the order table provides kitchen managers and delivery drivers with a physical summary sheet of scheduled lunches for morning prep, packing verification, or driver dispatch."
                    ],
                    steps: [
                        "Filter your orders by date or company on /admin/orders.",
                        "Click Print Table at the top right header to generate a clean, formatted printable document of all visible orders.",
                        "Click Export to download the current order list as a CSV spreadsheet for accounting or record keeping."
                    ],
                    image: {
                        src: "/manuals/print_order_table_preview.png",
                        alt: "Print Table preview dialog showing formatted Orders Dashboard printable pages",
                        caption: "Print Order Table - Click Print Table to generate formatted multi-page printable sheets for kitchen staff and drivers"
                    }
                },
                {
                    title: "Printing Kitchen Tickets (Box Lunch Slips)",
                    paragraphs: [
                        "Purpose: Kitchen tickets generate individual printable slips for each box lunch order, allowing staff to paste or attach labels to sandwich bags and lunch boxes with guest names, meal types, and bread/cookie selections."
                    ],
                    steps: [
                        "Go to /admin/orders.",
                        "Click Tickets at the top right header.",
                        "Review the generated tickets for all active or filtered orders and print them directly for kitchen packing."
                    ],
                    image: {
                        src: "/manuals/print_tickets_preview.png",
                        alt: "Print Tickets preview dialog showing 6 tickets per page layout",
                        caption: "Print Kitchen Tickets - Click Tickets to generate 6-per-page printable slips with guest names and meal choices for box packing"
                    }
                },
                {
                    title: "Adding a New Order Manually & Comp Orders (Phone / Admin Onboarding)",
                    paragraphs: [
                        "Purpose: Manually creating an order allows catering admins to place an order on behalf of a tour company over the phone, handle last-minute tour additions directly, or create a complimentary (Comp) order for tour guides."
                    ],
                    steps: [
                        "Go to /admin/orders and click the + Add Order button at the top header.",
                        "Select the Tour Company from the dropdown list.",
                        "Enter the Customer / Guide Name, Contact Number, Tour Date, and Pickup Time.",
                        "Select meal items, lunch package types (Box Lunch vs Junior Box), bread choices, and cookie options.",
                        "Comp Orders: Check the COMP checkbox next to the quantity counter field to make a meal complimentary ($0.00) for tour guides or VIPs.",
                        "Click Create Order to submit the order directly to the kitchen queue."
                    ],
                    image: {
                        src: "/manuals/add_order_modal.png",
                        alt: "Add Tour Company Order Modal with red arrow pointing to COMP checkbox",
                        caption: "Add Tour Company Order Modal - Enter order details, meals, and check COMP to make a meal complimentary ($0.00)"
                    }
                }
            ]
        },
        {
            id: "order-requests",
            title: "6. How to Review & Approve Order Requests",
            description: "Purpose: Order Requests are last-minute order submissions placed by tour companies inside the 14-hour cutoff window (<14h before pickup). They require admin review and approval before being added to the active kitchen prep schedule.",
            paragraphs: [
                "When a tour company or guide submits a last-minute order less than 14 hours before the tour departure time, the platform places the order into a Pending Order Request state to protect kitchen capacity.",
                "Admins can review, approve, or decline these requests directly from the Orders Management screen (/admin/orders)."
            ],
            subsections: [
                {
                    title: "Identifying Pending Order Requests",
                    paragraphs: [
                        "• Order Requests Tab Badge: The top navigation bar on /admin/orders displays an amber badge indicator on the Order Requests tab (e.g., Order Requests 1) showing the count of requests awaiting review.",
                        "• Active Orders Badge: On the Active Orders tab, any unapproved last-minute request displays a prominent PENDING ORDER REQUEST badge in amber, complete with quick ✓ Approve and ✕ Decline action buttons directly on the card."
                    ],
                    image: {
                        src: "/manuals/order_requests_tab_badge.png",
                        alt: "Admin Orders screen showing Order Requests tab badge and Pending Order Request card",
                        caption: "Orders Management (/admin/orders) - Top Order Requests tab indicator and PENDING ORDER REQUEST badge with quick Approve/Decline buttons"
                    }
                },
                {
                    title: "Approving or Declining Order Requests",
                    paragraphs: [
                        "Click the Order Requests tab to open the dedicated approval dashboard. This view filters all last-minute requests and displays complete details including Tour Date, Pickup Time, Guide Name, Total Lunches, Total Value, and Guest Meal breakdown.",
                        "Automatic Email Notifications: Whenever an admin approves or declines an order request, an automated email notification is immediately sent to the tour company contact confirming whether their last-minute order request was accepted or rejected."
                    ],
                    steps: [
                        "Click Order Requests at the top of /admin/orders.",
                        "Review the yellow banner showing total last-minute requests awaiting approval.",
                        "Inspect order details: Verify tour date, pickup time, guide contact, box lunch selections, and dietary requirements.",
                        "To Accept the Order: Click ✓ Approve Request. The status automatically updates to PENDING, adding the order to the active kitchen prep queue, and an approval email is sent to the tour company.",
                        "To Reject the Order: Click ✕ Decline. The order request is voided and a decline email notification is sent to the tour company."
                    ],
                    tip: "Email Notifications: Tour companies receive an instant email notification as soon as an admin approves or declines their order request.",
                    image: {
                        src: "/manuals/order_requests_approval_view.png",
                        alt: "Order Requests Tab View with Approve Request and Decline buttons",
                        caption: "Order Requests Approval Dashboard - Review full meal details, tour date, and click Approve Request or Decline (emails company automatically)"
                    }
                }
            ]
        },
        {
            id: "change-requests",
            title: "7. How to Review & Approve Change Requests",
            description: "Purpose: Change Requests occur when a tour company submits a modification or cancellation for an existing order between 14 and 24 hours prior to tour departure. Admins compare original vs proposed details before accepting or rejecting updates.",
            paragraphs: [
                "The 3-tier modification policy allows direct online changes 24+ hours in advance, while changes submitted 14–24 hours before pickup generate an Order Change Request for admin approval."
            ],
            subsections: [
                {
                    title: "Identifying Pending Change Requests",
                    paragraphs: [
                        "• Change Requests Tab Badge: The top navigation bar on /admin/orders displays a notification counter badge on the Change Requests tab (e.g., Change Requests 1) whenever an order change is submitted.",
                        "• Active Orders Badge: On the Active Orders tab, orders with pending changes display a blue PENDING EDIT (or PENDING CANCELLATION / PENDING DELETION) status badge alongside the PENDING status badge."
                    ],
                    image: {
                        src: "/manuals/change_requests_tab_badge.png",
                        alt: "Admin Orders screen showing Change Requests tab badge and PENDING EDIT order card",
                        caption: "Orders Management (/admin/orders) - Change Requests tab notification badge and PENDING EDIT status badge on active order cards"
                    }
                },
                {
                    title: "Comparing & Approving Proposed Order Changes",
                    paragraphs: [
                        "Click the Change Requests tab to view the side-by-side Order Details Comparison dashboard. This allows admins to evaluate exact changes made to tour date, pickup time, customer details, or guest meal selections before finalizing.",
                        "Automatic Email Notifications: When a change request is approved or declined, the platform automatically emails the tour company with an updated order confirmation statement or notice of decline."
                    ],
                    steps: [
                        "Click Change Requests at the top of /admin/orders.",
                        "Locate the UPDATE / EDIT REQUEST comparison card.",
                        "Review Order Details Comparison: Check red strikethrough original values vs green proposed values for Tour Date, Pickup Time, Customer Name, and Notes.",
                        "Review Proposed Menu Selections: Green badges highlight + ADDED meal items, while red badges highlight - REMOVED meal items.",
                        "To Approve Changes: Click ✓ Approve. The order details, guest list, and kitchen prep totals update instantly to reflect the proposed changes, and a confirmation email is sent to the company.",
                        "To Decline Changes: Click Decline. The proposed changes are discarded, the order reverts to its original details, and a notification email is sent to the company."
                    ],
                    tip: "Email Notifications: The tour company is automatically notified by email whenever a change request is approved or declined by Catering Admin.",
                    image: {
                        src: "/manuals/change_requests_comparison_view.png",
                        alt: "Change Requests Comparison Dashboard showing original vs proposed values and Approve/Decline buttons",
                        caption: "Change Requests Comparison View - Side-by-side comparison of original vs proposed tour dates, pickup times, + ADDED and - REMOVED menu items (emails company automatically)"
                    }
                }
            ]
        },
        {
            id: "kitchen-prep",
            title: "8. How to Use Daily Kitchen Prep",
            description: "Purpose: The Daily Prep Quantities screen eliminates kitchen math by automatically adding up every single sandwich, bread choice, cookie option, package type, and dietary note across all tour companies for any selected date range.",
            paragraphs: [
                "Go to Daily Quantities (/admin/quantities) every morning for kitchen preparation!"
            ],
            subsections: [
                {
                    title: "Smart Prep Sheet Tab & Group By Options",
                    paragraphs: [
                        "Purpose of Smart Prep Tab: The Smart Prep tab gives kitchen staff a dynamic visual workspace to view and organize lunch quantities for morning preparation.",
                        "• GROUP BY Sandwich Name vs Tour Company: Toggle between grouping by Sandwich Name (clusters all identical lunches across all tour companies together) or Tour Company (groups box lunches under individual tour partner cards like Hayden Valley Nature Tours or Yellowstone Scenic Tours with total lunch count badges).",
                        "• Expanding Meal Cards: Click on any sandwich or tour company card to expand detailed line items, box package types (Box Lunch vs Junior Box), custom bread choices (Whole Grain Focaccia, Sour Dough Bread), and dietary allergy notes."
                    ],
                    steps: [
                        "Go to /admin/quantities.",
                        "Ensure the Smart Prep tab is selected.",
                        "Select GROUP BY Sandwich Name or GROUP BY Tour Company to organize prep cards.",
                        "Click card expand icons to review bread selections, cookie choices, and dietary notes."
                    ],
                    image: {
                        src: "/manuals/smart_prep_summary_tabs.png",
                        alt: "Admin Quantities screen showing Smart Prep tab, Summary tab, and Group By options",
                        caption: "Prep Quantities (/admin/quantities) - Smart Prep tab view with GROUP BY Sandwich Name vs Tour Company toggle controls"
                    }
                },
                {
                    title: "Summary Sheet Tab",
                    paragraphs: [
                        "Purpose of Summary Tab: The Summary tab provides kitchen managers with a consolidated high-level table breakdown of all sandwich counts, package tiers, and cookie totals across all scheduled tours.",
                        "• High-Level Inventory Audit: Displays total quantities categorized by Sandwich / Salad type, Junior Box count, Standard Box count, Sandwich Only count, and total lunches for quick inventory auditing."
                    ],
                    steps: [
                        "Go to /admin/quantities.",
                        "Click the Summary tab next to Smart Prep.",
                        "Review total sandwich, junior box, standard box, and cookie counts across all tours."
                    ],
                    image: {
                        src: "/manuals/summary_totals_tab.png",
                        alt: "Admin Quantities screen showing Summary tab active with Summary Totals table and House-made Cookies table",
                        caption: "Summary Sheet Tab View (/admin/quantities) - Consolidated Summary Totals table and House-made Cookies table breakdown"
                    }
                },
                {
                    title: "Printing Smart Prep & Summary Sheets",
                    paragraphs: [
                        "Purpose of Printing: Printing physical prep sheets allows prep cooks and kitchen managers to keep paper checklists on the assembly line during busy morning shifts."
                    ],
                    steps: [
                        "Printing Smart Prep Sheet: Click Print Smart Prep Sheet at the top right header to generate a formatted multi-page Kitchen Prep Report grouped by company and detailed sandwich customizations.",
                        "Printing Summary Sheet: Click Print Standard Totals at the top right header to generate a formatted Summary Totals Report with high-level item counts, cookie totals, and package breakdowns."
                    ],
                    images: [
                        {
                            src: "/manuals/print_smart_prep_sheet_preview.png",
                            alt: "Print Smart Prep Sheet preview dialog showing Kitchen Prep Report",
                            caption: "Print Smart Prep Sheet - Click Print Smart Prep Sheet for a formatted multi-page prep checklist with company customizations"
                        },
                        {
                            src: "/manuals/print_standard_totals_preview.png",
                            alt: "Print Standard Totals preview dialog showing summary totals report",
                            caption: "Print Standard Totals - Click Print Standard Totals for a consolidated summary count of all sandwiches, cookies, and package tiers"
                        }
                    ]
                }
            ]
        },
        {
            id: "spanish-translation",
            title: "9. Quantities & Spanish Translation",
            description: "Purpose: Many catering kitchens employ Spanish-speaking prep cooks. The Spanish Translation feature translates meal names, bread options, cookie choices, and custom dietary allergy notes into Spanish instantly so prep staff can assemble orders accurately without language barriers or translation errors.",
            paragraphs: [
                "Translate prep lists into Spanish with a single click directly on /admin/quantities!"
            ],
            subsections: [
                {
                    title: "Toggling Spanish Translation Mode",
                    paragraphs: [
                        "Purpose of Language Switcher: Located at the top right of the /admin/quantities header, the English / Spanish toggle instantly translates all displayed meal names, ingredient descriptions, bread choices, cookie options, and special dietary warning notes into Spanish."
                    ],
                    steps: [
                        "Go to /admin/quantities.",
                        "Locate the English / Spanish toggle pill at the top right header.",
                        "Click Spanish to translate all prep cards, summary tables, and dietary allergy notes into Spanish.",
                        "Click English at any time to switch back to the standard English display."
                    ],
                    image: {
                        src: "/manuals/spanish_translation_quantities.png",
                        alt: "Admin Quantities screen with Spanish mode enabled showing translated meal names and red arrow pointing to Spanish toggle",
                        caption: "Quantities & Spanish Translation (/admin/quantities) - Spanish mode active with translated meal names (e.g. El Oso Grizzly, Jamón y Queso), bread choices, and print controls"
                    }
                },
                {
                    title: "Printing Spanish Prep Lists for Kitchen Staff",
                    paragraphs: [
                        "When Spanish mode is active, clicking Print Smart Prep Sheet or Print Standard Totals generates physical printed prep checklists translated into Spanish for kitchen counter staff."
                    ],
                    steps: [
                        "Switch to Spanish mode on /admin/quantities.",
                        "Click Print Smart Prep Sheet or Print Standard Totals.",
                        "Print or save the translated PDF prep checklist for your Spanish-speaking kitchen team."
                    ]
                }
            ]
        },
        {
            id: "cutoff-timelines",
            title: "10. How Order Changes & Cutoff Timelines Work",
            description: "Purpose: The 3-Tier Modification Policy protects kitchen food sourcing and prep schedules by preventing last-minute unannounced order changes while providing emergency phone overrides when needed.",
            paragraphs: [
                "Order modifications automatically enforce 3 strict timeline tiers based on hours remaining until tour pickup time:"
            ],
            steps: [
                "Tier 1 (24+ Hours Before Pickup): Tour companies or guests can edit, modify, or cancel orders online directly. The app updates automatically without requiring admin action.",
                "Tier 2 (14 to 24 Hours Before Pickup): If a tour company submits a change or cancellation, the app creates an Order Change Request. An Amber Change Request Banner appears on the order in /admin/orders. Review the requested change and click Approve Request to apply updates, or Decline Request to keep original order.",
                "Tier 3 (Under 14 Hours Before Pickup): Online editing is locked. The portal directs users to call or text Kim directly at 406-461-1024. If Kim accepts an urgent change over the phone, locate the order on /admin/orders, click '...' (Three Dots), and select Edit Order to perform a manual admin override."
            ],
            warning: "Past Date Restriction: The system strictly prohibits creating, editing, or updating any order to a tour date prior to today's date."
        },
        {
            id: "comp-orders",
            title: "11. How to Add Complimentary (Comp) Orders",
            description: "Purpose: Complimentary (Comp) orders allow catering admins to provide free box lunches for tour guides, drivers, VIP guests, or promotional events without charging the tour company or generating an invoice fee.",
            paragraphs: [
                "Admins can mark individual box lunches as complimentary when placing or editing orders on /admin/orders."
            ],
            subsections: [
                {
                    title: "Adding a Comp Meal Item",
                    steps: [
                        "Go to /admin/orders and click + Add Order at the top header.",
                        "Select the target Tour Company and enter the Customer / Guide Name.",
                        "Select the Meal Item, Package Type (Box Lunch vs Junior Box), Bread Choice, and Cookie Option.",
                        "Check the COMP checkbox located directly next to the QTY counter field.",
                        "Notice that the item price drops to $0.00 and is marked as a Complimentary Item.",
                        "Click Create Order to submit the comped lunch directly to the kitchen prep queue."
                    ],
                    image: {
                        src: "/manuals/add_order_modal.png",
                        alt: "Add Tour Company Order Modal with red arrow pointing to COMP checkbox",
                        caption: "Adding a Comp Order - Check the COMP checkbox next to quantity to make the lunch complimentary ($0.00)"
                    }
                },
                {
                    title: "Comp Order Billing & Invoice Exclusions",
                    paragraphs: [
                        "• Kitchen Prep & Tickets: Comped orders appear on daily kitchen prep lists and ticket slips just like regular paid lunches, ensuring kitchen staff prepare and pack the guide's lunch.",
                        "• Automatic Invoice Exclusion: When generating monthly invoices, comped lunches are automatically excluded from billing totals so tour companies are never charged for complimentary guide meals."
                    ]
                }
            ]
        },
        {
            id: "invoicing-billing",
            title: "12. How to Create, Email & Manage Invoices",
            description: "Purpose: Invoicing automates monthly billing for tour companies by compiling all fulfilled orders, applying volume and per-lunch discounts, generating itemized or consolidated statements, emailing digital payment links, and managing billing ledgers.",
            paragraphs: [
                "Manage billing statements, Stripe invoice generation, and payment reconciliation directly from Invoices (/admin/invoices)."
            ],
            subsections: [
                {
                    title: "Generate Invoice vs Invoice History Ledger Tabs",
                    paragraphs: [
                        "The Invoices screen (/admin/invoices) is divided into two primary operational tabs:",
                        "• Generate Invoice Tab: Select tour companies, choose date ranges or billing period presets (e.g. This Month), filter orders, select line item styles, apply custom per-lunch discounts, and generate new Stripe invoices. Displays an unbilled order counter badge (e.g. Generate Invoice 85).",
                        "• Invoice History Ledger Tab: Displays the full historical ledger of all generated invoices across all tour companies (e.g. Invoice History Ledger 20), showing status badges (PAID, SENT, DRAFT), created dates, total amounts, and quick action buttons to view PDF statements, copy online payment links, send email invoices, mark paid manually, or delete draft invoices."
                    ],
                    steps: [
                        "Go to /admin/invoices.",
                        "Click Generate Invoice to create new billing statements for unbilled tour orders.",
                        "Click Invoice History Ledger to review previously generated invoices, track payment status, or email statements."
                    ],
                    image: {
                        src: "/manuals/invoice_history_ledger_tab.png",
                        alt: "Admin Invoices screen showing Invoice History Ledger tab active with filters, status badges, and action buttons",
                        caption: "Invoice History Ledger Tab - View generated invoices, track status (PAID, SENT, DRAFT), copy payment links, and email invoice statements"
                    }
                },
                {
                    title: "Detailed Invoice vs Consolidated Invoice Line Item Styles",
                    paragraphs: [
                        "When generating an invoice, catering admins can select between two line item formatting styles to match each tour operator's accounting preferences:",
                        "• Detailed Invoice Style: Itemizes every single fulfilled lunch order separately on the invoice statement. Shows individual tour dates, guide names, exact sandwich choices (e.g. 2x Roastbeef and Cheese, 3x Turkey and Cheese), and itemized line pricing. Ideal for tour operators who require complete audit trails for every lunch served.",
                        "• Consolidated Invoice Style: Hides individual lunch details and summarizes the entire billing period into a single consolidated line item (e.g., 'Consolidated Lunch Catering for 08/01/2026 — 08/31/2026'). Allows admins to specify a custom total lunch count (e.g. 50) and custom price per lunch (e.g. $12.50). Ideal for companies with flat-rate agreements or simplified accounting preferences."
                    ],
                    steps: [
                        "On the Generate Invoice tab, locate INVOICE LINE ITEMS STYLE.",
                        "Select Detailed Invoice to itemize every selected lunch separately on the statement.",
                        "Select Consolidated Invoice to combine orders into a single line item with custom quantity and unit price."
                    ],
                    images: [
                        {
                            src: "/manuals/generate_invoice_detailed_style.png",
                            alt: "Generate Invoice tab with Detailed Invoice style selected showing itemized lunch orders and Meal Box Aggregations",
                            caption: "Detailed Invoice Style - Itemizes every single lunch order separately with date, guide name, and exact meal selections"
                        },
                        {
                            src: "/manuals/generate_invoice_consolidated_style.png",
                            alt: "Generate Invoice tab with Consolidated Invoice style selected showing Consolidated Billing Line card",
                            caption: "Consolidated Invoice Style - Summarizes billing period into a single line item with custom lunch count and unit price"
                        }
                    ]
                },
                {
                    title: "Applying Volume & Per-Lunch Discounts on Invoices",
                    paragraphs: [
                        "Admins can apply custom negotiated per-lunch volume discounts directly inside the Billing Summary sidebar before generating a Stripe invoice."
                    ],
                    steps: [
                        "Select orders to invoice on the Generate Invoice tab.",
                        "Locate the BILLING SUMMARY card on the right sidebar.",
                        "Check 'Apply discount on some lunches' under the subtotal.",
                        "Enter RATE ($ OFF / LUNCH): Type the dollar discount amount to deduct per lunch (e.g., $0.50 off per lunch).",
                        "Enter NO. OF LUNCHES (MAX N): Type the count of lunches eligible for the discount (defaults to total selected lunches, e.g. 712).",
                        "Review recalculated Per-Lunch Discount (e.g. -$356.00), local Resort Tax (4%), and net Invoice Total (Base)."
                    ],
                    image: {
                        src: "/manuals/invoice_billing_summary_discount.png",
                        alt: "Billing Summary sidebar showing Apply discount on some lunches checkbox, rate per lunch, and calculated discount total",
                        caption: "Applying Per-Lunch Discounts - Check Apply discount on some lunches to set rate ($ off/lunch) and count of eligible lunches"
                    }
                },
                {
                    title: "Generating, Sending & Reconciling Invoices",
                    paragraphs: [
                        "Follow this complete workflow to issue invoices, email statement links, and reconcile payments:"
                    ],
                    steps: [
                        "Select Tour Company and Billing Period (e.g., This Month) on /admin/invoices.",
                        "Choose Line Item Style (Detailed Invoice vs Consolidated Invoice).",
                        "Select specific tour orders to include.",
                        "Review Billing Summary on the right sidebar and apply any per-lunch discounts if applicable.",
                        "Click Generate Stripe Invoice. The invoice status is created as DRAFT.",
                        "Click the Envelope button (Finalize & Send Invoice Email) in the ledger to email the digital statement link directly to the company contact.",
                        "Payment Reconciliation: Online card payments update status to PAID automatically. For checks or wire transfers, click Mark Paid (✓) manually.",
                        "Deleting Invoices: If an invoice was generated by mistake, click Delete (🗑). Unpaid orders automatically revert back to unbilled status so they can be re-invoiced!"
                    ],
                    tip: "Deleting Draft Invoices: Deleting a draft or mistaken invoice safely unlinks all associated orders, allowing you to re-select and re-invoice them anytime."
                }
            ]
        },
        {
            id: "field-customizer",
            title: "13. How to Customize Checkout Form Fields and Meal Page Fields",
            description: "Purpose: The Form Field Customizer allows catering admins to define global form questions for the Meal Selection Page and Checkout Page. Once created, these fields appear in the company dashboard settings, allowing tour operators to activate the exact questions they want displayed on their ordering app pages.",
            paragraphs: [
                "Manage global dynamic form fields from App Settings (/admin/settings) and company activation settings from Company Settings (/company/settings)."
            ],
            subsections: [
                {
                    title: "Managing Global Dynamic Form Fields in Admin Portal",
                    paragraphs: [
                        "Admins can create, edit, re-order, and delete global dynamic fields categorized into MEAL PAGE FIELDS (e.g. Sandwich Options, Bread Options, Cheese Options, Cookie Options, Guest Name, Allergy Alert) and TOUR DETAILS FIELDS (e.g. Tour Date, Pick-up Time, Pick-up Location):",
                        "• Active Status Toggles: Enable or disable a field globally across the platform.",
                        "• Field Placement (Up and Down Arrows): Re-order questions using arrow buttons to control the exact sequence they appear on companies dashboard setting page.",
                        "• Edit & Delete: Click the Edit pencil icon to adjust label text, placeholder prompts, or dropdown options, or click the Trash icon to remove a field."
                    ],
                    steps: [
                        "Go to App Settings (/admin/settings).",
                        "Scroll to Dynamic Form Fields.",
                        "Review existing fields under MEAL PAGE FIELDS and TOUR DETAILS FIELDS.",
                        "Use up and down arrow buttons to re-order fields."
                    ],
                    image: {
                        src: "/manuals/dynamic_form_fields_settings.png",
                        alt: "Admin App Settings screen showing Dynamic Form Fields with Meal Page Fields and Tour Details Fields",
                        caption: "Dynamic Form Fields (/admin/settings) - Manage global Meal Page Fields and Tour Details Fields with active toggles and re-ordering controls"
                    }
                },
                {
                    title: "Creating New Custom Form Fields",
                    paragraphs: [
                        "Click + Add Field on /admin/settings to launch the field creation wizard:"
                    ],
                    steps: [
                        "Click + Add Field at the top right of the Dynamic Form Fields section.",
                        "Field Name (ID): Enter a unique identifier (e.g. allergy_info).",
                        "Display Label: Enter the public question label (e.g. 'Any Allergy Info?').",
                        "Placeholder: Enter helpful prompt text (e.g. 'e.g. Enter allergy details here...').",
                        "Type: Select field input type (Dropdown Select, Text, Textarea, Date, Checkbox).",
                        "Location: Choose whether the field appears on the Meal Page or the Checkout / Tour Details Page.",
                        "Select Options: For dropdown fields, add option choices (e.g., Gluten free, Wrap) and specify default selections.",
                        "Required Field Toggle: Turn on if guests must answer before placing an order.",
                        "Add Automatically to Companies Toggle: Turn on so newly registered tour companies get this field enabled by default.",
                        "Click Save Field to publish."
                    ],
                    image: {
                        src: "/manuals/add_new_form_field_modal.png",
                        alt: "Add New Field modal showing Field Name, Display Label, Type, Location, Select Options, and toggles",
                        caption: "Add New Field Modal - Configure field ID, display label, location (Meal Page vs Checkout), dropdown options, and default onboarding rules"
                    }
                },
                {
                    title: "Activating Fields in Tour Company Settings",
                    paragraphs: [
                        "Purpose of Company Activation: Admins create fields centrally, which then appear in the settings page of each tour company's dashboard (/company/settings). Tour managers can toggle individual fields ON or OFF to activate only the questions relevant to their excursion operations (e.g. mandating 'Hotel Room Number' or 'Pick-up Location' for their specific ordering pages).",
                        "• Custom Ordering Experience: Activated fields automatically render on the public guest ordering link and guide ordering cart pages!"
                    ]
                }
            ]
        },
        {
            id: "outreach-tools",
            title: "14. How to Use Outreach & Campaign Tools",
            description: "Purpose: The Outreach Campaign Manager empowers catering admins to discover, track, and engage prospective tour companies, manage sales pipeline stages via Brevo email campaigns, import bulk leads, and seamlessly convert interested prospects into active tour company partners.",
            paragraphs: [
                "Manage tour company prospects, email campaigns, and partner conversions from Outreach (/admin/outreach)."
            ],
            subsections: [
                {
                    title: "Outreach Campaign Pipeline & Lead Metrics",
                    paragraphs: [
                        "The Outreach dashboard (/admin/outreach) displays key pipeline metrics across all prospective tour operators:",
                        "• TOTAL LEADS: Total number of prospective tour operators tracked in your catering sales database.",
                        "• NOT CONTACTED: Newly added prospects waiting for initial email outreach.",
                        "• EMAILED: Prospects who have received automated campaign invitations or introduction emails.",
                        "• RESPONDED: Active leads who have replied or expressed interest in catering partnerships.",
                        "• CONVERTED: Successfully onboarded tour operators that became registered partner accounts.",
                        "• Search & Status Filter: Quickly find specific companies by name, email, or filter by pipeline stage (All Status, Not Contacted, Emailed, Responded).",
                        "• Import CSV: Upload spreadsheet files containing bulk tour operator contact lists.",
                        "• Actions Menu (... button): Click the three dots beside any lead to Convert to Partner, Mark as Responded, Mark Not Contacted, Mark as Rejected, Edit Details, or Add Internal Notes."
                    ],
                    steps: [
                        "Go to Outreach (/admin/outreach).",
                        "Review top metric cards to monitor sales campaign performance.",
                        "Filter leads by status or use the search bar to locate specific operators.",
                        "Click the Actions menu (...) next to any company to update status or edit lead notes."
                    ],
                    image: {
                        src: "/manuals/outreach_campaign_manager.png",
                        alt: "Admin Outreach Campaign Manager showing metric stat cards, lead table, and actions dropdown menu",
                        caption: "Outreach Campaign Manager (/admin/outreach) - Track sales pipeline metrics, search prospective tour operators, and convert leads to registered partners"
                    }
                },
                {
                    title: "Adding & Configuring Prospective Tour Leads",
                    paragraphs: [
                        "Click + Add Lead at the top right of /admin/outreach to add an individual tour operator to your outreach database:"
                    ],
                    steps: [
                        "Click + Add Lead at the top right of /admin/outreach.",
                        "Enter Company Name * (e.g. Yellowstone Tour Guides) and primary Email * for outreach campaigns.",
                        "Provide Phone number and Website URL to verify their excursion offerings and schedules.",
                        "Set Operational Details: Enter Home Base (e.g. West Yellowstone), State (e.g. MT), Primary Gate (e.g. West), Tour Type (e.g. Sightseeing, Fly Fishing, Bus Tours), and Season (e.g. Summer).",
                        "Assign Outreach Tier & Priority: Specify Outreach Tier (e.g. Tier 1) and Priority level (e.g. A+) to prioritize high-value tour operators.",
                        "Enter Key Contact: Provide Contact Name (e.g. John Doe) and Title (e.g. Director of Travel).",
                        "Estimate Group Volume: Specify Average Group Size (e.g. 25) and Estimated Annual Guests (e.g. 1,500) to gauge catering potential.",
                        "Add Internal Notes: Record any special guest preferences, early pickup needs, or initial conversation notes.",
                        "Click Save Lead to add the operator to the active outreach queue."
                    ],
                    image: {
                        src: "/manuals/add_new_lead_modal.png",
                        alt: "Add New Lead modal with company info, tour operations, outreach tier, contact person, and group size fields",
                        caption: "Add New Lead Modal - Enter company details, contact person, primary park gate, group size estimates, and outreach priority tiers"
                    }
                },
                {
                    title: "Sending Bulk Email Outreach Campaigns",
                    paragraphs: [
                        "Admins can broadcast personalized outreach emails to multiple prospective tour operators simultaneously using Brevo email templates:",
                        "• Lead Selection: Check the box next to one, multiple, or all prospective tour companies in the table.",
                        "• Bulk Action Bar: Click Send Campaign (N) to launch the campaign customizer, or click Delete (N) to remove selected leads.",
                        "• Built-in Email Templates: Choose from four purpose-built templates designed for tour operator conversion:",
                        "  - Friendly First Touch: Personal, high-delivery text-only email for low-pressure initial contact.",
                        "  - Trust Builder: Highlights catering statistics (e.g. 3,000+ lunches served) and client testimonials to establish credibility.",
                        "  - Season Opener: Time-sensitive notice for onboarding tour operators before the excursion season begins.",
                        "  - Menu Showcase: Highlights signature box lunch options with photos, sandwich descriptions, prices, and direct registration links.",
                        "• Live Email Preview: Review live merge tags and design layout before dispatching.",
                        "• Automated Status Update: Sending a campaign automatically advances each recipient's status to EMAILED and records the Last Contacted date."
                    ],
                    steps: [
                        "On /admin/outreach, check the boxes next to the target tour companies.",
                        "Click the purple Send Campaign (N) button at the top right of the table.",
                        "Select your preferred email template from the left sidebar (Friendly First Touch, Trust Builder, Season Opener, or Menu Showcase).",
                        "Review the live interactive preview on the right.",
                        "Click Send Campaign to N Recipients to dispatch emails via Brevo."
                    ],
                    images: [
                        {
                            src: "/manuals/outreach_bulk_send_campaign_selection.png",
                            alt: "Outreach table showing checkboxes selected for multiple leads and Send Campaign button",
                            caption: "Selecting Leads for Outreach - Select one or multiple tour operators and click Send Campaign"
                        },
                        {
                            src: "/manuals/outreach_customize_campaign_modal.png",
                            alt: "Customize Campaign modal showing email template selector on left and live preview on right",
                            caption: "Customize Campaign Modal - Choose from 4 pre-built email templates, preview live merge content, and send to recipients"
                        }
                    ]
                },
                {
                    title: "Converting Leads into Registered Partner Companies",
                    paragraphs: [
                        "When a prospective tour company agrees to partner with Mountain Mama's Café for their excursion lunches:",
                        "• Convert to Partner: Click the ... Actions button beside their name in the Outreach table and select Convert to Partner.",
                        "• Automatic Account Setup: The system transfers all company details directly into the Companies directory (/admin/companies), where you can configure custom meal packaging, set price discounts, and invite tour managers to their private ordering dashboard!"
                    ]
                }
            ]
        },
        {
            id: "analytics-insights",
            title: "15. How to View Analytics & Revenue Reports",
            description: "Purpose: The Analytics dashboard provides comprehensive business intelligence, allowing catering admins to track gross revenue, analyze daily lunch volume trends, discover top-selling meal items, monitor lost revenue from cancellations, and evaluate order distributions across tour operator partners.",
            paragraphs: [
                "Track sales growth, meal popularity, and tour operator performance from Analytics (/admin/analytics)."
            ],
            subsections: [
                {
                    title: "Key Performance Indicators & Revenue Cards",
                    paragraphs: [
                        "The top KPI cards on /admin/analytics summarize core business metrics over the selected reporting window (e.g. Last 30 days):",
                        "• Total Revenue: Cumulative gross catering revenue generated across all tour companies (automatically excluding cancelled orders).",
                        "• Total Lunches: Total count of individual box lunch items prepared and fulfilled.",
                        "• Active Companies: Number of distinct tour operators currently placing orders.",
                        "• Avg. Lunch Price: Average realized price per lunch across all active orders.",
                        "• Lost Revenue: Revenue lost due to cancelled or refunded orders.",
                        "• Cancelled Lunches: Total number of individual lunch items cancelled."
                    ],
                    steps: [
                        "Go to Analytics (/admin/analytics).",
                        "Review top KPI stat cards for high-level revenue and volume performance.",
                        "Track average lunch pricing and monitor cancellation metrics."
                    ],
                    image: {
                        src: "/manuals/analytics_dashboard_overview.png",
                        alt: "Analytics dashboard showing key metrics, lunches trend line chart, most popular meals bar chart, and revenue breakdown",
                        caption: "Analytics Dashboard (/admin/analytics) - Real-time revenue metrics, daily lunch order trends, meal popularity rankings, and partner distribution charts"
                    }
                },
                {
                    title: "Interactive Charts & Business Intelligence",
                    paragraphs: [
                        "Visual analytics help optimize kitchen staffing and menu planning:",
                        "• Lunches Trend: Interactive line chart illustrating daily lunch volume over time. Hover over any data point to view exact daily lunch totals (e.g. Lunches: 51).",
                        "• Most Popular Meals: Horizontal bar chart ranking your top 5 best-selling box lunch recipes (e.g. Turkey and Cheese, The Madison, Ham and Cheese, The Yellowstone Club, Roastbeef and Cheese).",
                        "• Lunches by Company: Donut chart displaying the proportion of lunch volume generated by each tour company partner.",
                        "• Revenue Breakdown: Daily revenue bar chart visualizing daily billing spikes and peak excursion days."
                    ]
                }
            ]
        },
        {
            id: "staff-management",
            title: "16. How to Manage Admin Staff & Permissions",
            description: "Purpose: Staff Management allows primary administrators to invite kitchen crew and office staff, assign granular page-by-page access permissions, and maintain secure credentials across your catering team.",
            paragraphs: [
                "Manage staff accounts and portal access permissions from Staff (/admin/staff)."
            ],
            subsections: [
                {
                    title: "Staff Directory & Access Level Overview",
                    paragraphs: [
                        "The Staff dashboard (/admin/staff) displays active team members and their designated permission levels:",
                        "• Staff Cards: View full name, login email address, active account status, and join date.",
                        "• ACCESS LEVEL Badges: Visual tags displaying which portal pages each staff member can view (e.g. Dashboard, Orders, Quantities).",
                        "• Action Menu (... button): Click the three dots on any staff card to edit permissions, resend login credentials, or deactivate an account."
                    ],
                    steps: [
                        "Go to Staff (/admin/staff).",
                        "Review current staff members and their active page access badges.",
                        "Click the options menu (...) on any card to update access rights or reset passwords."
                    ],
                    image: {
                        src: "/manuals/staff_management_overview.png",
                        alt: "Admin Staff Management directory showing active staff cards, access level badges, and add staff member button",
                        caption: "Staff Management (/admin/staff) - View active team members, check page permissions, and manage staff credentials"
                    }
                },
                {
                    title: "Inviting Staff & Setting Granular Page Access",
                    paragraphs: [
                        "Click + Add Staff Member at the top right of /admin/staff to onboard a new team member with customized permissions:",
                        "• Automated Credentials: The invited staff member immediately receives an email with a secure temporary password to log into the portal.",
                        "• Granular Accessible Pages: Check only the specific pages this team member requires for their daily duties:",
                        "  - Dashboard: Overview metrics and daily catering snapshot.",
                        "  - Orders: Live order tickets, status updates, and comp lunch entries.",
                        "  - Quantities: Kitchen prep lists, summary sheets, and Spanish translations (ideal for kitchen crew).",
                        "  - Invoices: Billing statements, Stripe invoices, and payment tracking (recommended for billing managers).",
                        "  - Meals: Menu items, ingredients, bread, and cookie options.",
                        "  - Companies: Tour partner accounts, pricing tiers, and contact directories.",
                        "  - Analytics: Business intelligence charts and revenue reports.",
                        "  - Activity Log: Security audit trails and system event logs."
                    ],
                    steps: [
                        "Click + Add Staff Member on /admin/staff.",
                        "Enter the staff member's Full Name and Email address.",
                        "Select the checkboxes under Accessible Pages for each section they are allowed to access.",
                        "Click Send Invite to dispatch the invitation email."
                    ],
                    image: {
                        src: "/manuals/add_staff_member_modal.png",
                        alt: "Add Staff Member modal showing name, email, and accessible pages permission checkboxes",
                        caption: "Add Staff Member Modal - Specify staff name, email, and check specific accessible pages to restrict permissions"
                    }
                }
            ]
        },
        {
            id: "activity-logs",
            title: "17. How to View & Audit Activity Logs",
            description: "Purpose: Activity Logs provide an immutable, real-time security audit trail of all operational and administrative actions taken across the platform, including order updates, change requests, status changes, and authentication events.",
            paragraphs: [
                "Review system activity and audit administrative events from Activity (/admin/activity)."
            ],
            subsections: [
                {
                    title: "Audit Trail Filters & Event Types",
                    paragraphs: [
                        "The Activity Log (/admin/activity) records every notable action across the system for security and operational transparency:",
                        "• Quick Filter Pills: Filter logs by category: All, Order (creation, status changes, cancellations), Meal (menu updates), Company (profile & contract edits), Invoice (generation & payments), Auth (logins & password resets), or Config (settings adjustments).",
                        "• Search Filter: Search logs by user email address, action description, or resource ID.",
                        "• Log Table Columns: Displays Action name (e.g. order deleted, change request created, order update direct, bulk order fulfilled), Type, User Email, Role (ADMIN vs COMPANY), and Date & Time."
                    ],
                    steps: [
                        "Go to Activity (/admin/activity).",
                        "Click filter pills (e.g. Order, Invoice, Auth) to isolate specific event types.",
                        "Use the search box to find actions performed by a specific staff member or tour company."
                    ]
                },
                {
                    title: "Inspecting Expanded Event Details & JSON Context",
                    paragraphs: [
                        "Click any log row with an arrow (>) to expand the complete diagnostic context:",
                        "• EVENT DETAILS (JSON): Detailed data payload showing modified fields, request IDs, before/after values, and item identifiers.",
                        "• AUDIT CONTEXT: Displays exact event timestamp down to the second and unique Resource ID for complete traceability."
                    ],
                    steps: [
                        "Click the arrow (>) next to any activity log entry.",
                        "Review the formatted JSON payload to inspect exact field updates.",
                        "Verify user email, role, and exact timestamp for accountability."
                    ],
                    image: {
                        src: "/manuals/activity_log_audit_trail.png",
                        alt: "Activity Logs screen showing event filter pills, audit log table, and expanded JSON event details with resource ID",
                        caption: "Activity Logs (/admin/activity) - Inspect chronological audit trails, filter by event type, and expand JSON payload details"
                    }
                }
            ]
        }
    ]
};

export const COMPANY_MANUAL_DATA: ManualData = {
    title: "Tour Company & Staff User Manual",
    subtitle: "Complete guide for help you use the catering portal.",
    portalType: "company",
    sections: [
        {
            id: "welcome",
            title: "Welcome & Getting Started",
            description: "Purpose: This manual provides step-by-step guidance for tour operators, dispatchers, and field guides to streamline meal ordering for upcoming excursions.",
            paragraphs: [
                "Welcome to your tour catering portal! This guide explains the purpose of every feature in your portal and ordering app, showing you how to share guest ordering links, place group orders, track upcoming tour lunches, and pay invoices."
            ]
        },
        {
            id: "register-account",
            title: "1. How to Register a New Company Account",
            description: "Purpose: Partner Self-Onboarding allows tour operators to register for dedicated catering access online, configure billing models, and execute digital corporate catering contracts.",
            paragraphs: [
                "New tour operators can onboard in minutes via the self-registration portal at /company/register."
            ],
            subsections: [
                {
                    title: "Step 1: Partner Details & Account Credentials",
                    paragraphs: [
                        "Navigate to /company/register to begin the self-onboarding wizard:",
                        "• Company Details: Enter your official Company Name, Company Email (used for order dispatch notifications and login), Legal Representative Name, Representative Title (e.g. CEO / Owner / Manager), and Company Phone.",
                        "• Security Credentials: Create a secure password meeting standard complexity requirements:",
                        "  - At least 8 characters in length.",
                        "  - At least one uppercase letter.",
                        "  - At least one number.",
                        "• Click Continue to proceed to billing configuration."
                    ],
                    steps: [
                        "Go to /company/register.",
                        "Complete Company Name, Email, Legal Representative, Title, and Phone.",
                        "Create and confirm your account password.",
                        "Click Continue."
                    ],
                    image: {
                        src: "/manuals/partner_registration_step1_profile.png",
                        alt: "Partner Self-Onboarding Step 1 showing partner details form and security credentials setup",
                        caption: "Step 1: Partner Details (/company/register) - Enter company profile, legal representative, and security credentials"
                    }
                },
                {
                    title: "Step 2: Selecting Billing Preferences (Direct Pay vs Monthly Invoice)",
                    paragraphs: [
                        "Choose how your tour group bookings and guest orders will settle payments:",
                        "• Direct Pay (No Contracts Required): Guests pay for their custom menus individually online via secure Stripe checkout during the ordering process. If selected, you can click Submit Registration immediately without needing a corporate agreement.",
                        "• Monthly Invoice (Corporate E-Contract Required): Mountain Mama's Café tracks all fulfilled tour lunches and bills your company on a monthly cycle. Retail prices are completely hidden from guests when they browse and submit their lunch orders. This option requires executing a digital corporate catering agreement in Step 3."
                    ],
                    steps: [
                        "Review the two billing models on Step 2.",
                        "Select Direct Pay if guests will pay individually by credit card.",
                        "Select Monthly Invoice if your company pays consolidated catering invoices monthly.",
                        "Click Continue to proceed to contract signing (for Monthly Invoice) or Submit Registration (for Direct Pay)."
                    ],
                    image: {
                        src: "/manuals/partner_registration_step2_billing.png",
                        alt: "Partner Self-Onboarding Step 2 showing Direct Pay vs Monthly Invoice billing preference cards",
                        caption: "Step 2: Billing Preferences - Select Direct Pay (individual guest checkout) or Monthly Invoice (corporate billing with hidden guest prices)"
                    }
                },
                {
                    title: "Step 3: Corporate Catering Contract & E-Signature (Monthly Invoicing)",
                    paragraphs: [
                        "When Monthly Invoice is selected, Step 3 opens the Corporate Catering & Invoicing Agreement:",
                        "• Agreement Terms: Outlines the catering terms, scope of service, dedicated tour ordering link configuration, and payment expectations between Mountain Mama's Café and your organization.",
                        "• Signatory Verification: Verify the pre-filled Legal Representative Name, Company Email, and Representative Title.",
                        "• Digital E-Signature Pad: Provide your legally binding digital signature:",
                        "  - Draw: Draw your signature directly using a mouse, trackpad, or touchscreen.",
                        "  - Cursive Type: Type your legal name to generate an authentic cursive digital signature.",
                        "  - Clear Signature: Reset the drawing pad if you wish to re-sign.",
                        "• Agreement Consent: Check the box: 'I agree that this drawn or typed signature serves as the legal digital authentication for this Corporate Catering Agreement, agreeing to all terms specified.'",
                        "• Submit & Approval: Click Submit Registration. Your application is reviewed by catering administration and your portal access is activated swiftly!"
                    ],
                    steps: [
                        "Read through the Corporate Catering & Invoicing Agreement.",
                        "Verify your legal representative contact information.",
                        "Draw or type your digital e-signature in the signature canvas.",
                        "Check the mandatory legal agreement acknowledgment checkbox.",
                        "Click Submit Registration to finalize your partner onboarding."
                    ],
                    image: {
                        src: "/manuals/partner_registration_step3_contract.png",
                        alt: "Partner Self-Onboarding Step 3 showing corporate catering contract review and digital e-signature pad",
                        caption: "Step 3: Corporate Catering Contract - Review agreement terms and provide a digital e-signature to activate monthly invoicing"
                    }
                }
            ]
        },
        {
            id: "login-passwords",
            title: "2. How to Log In & Reset Passwords",
            description: "Purpose: Secure authentication ensures only authorized company managers, dispatchers, and tour guides can view guest orders and catering invoices.",
            paragraphs: [
                "Access your partner dashboard or request password recovery from /company/login."
            ],
            subsections: [
                {
                    title: "Signing In to Your Partner Portal (/company/login)",
                    paragraphs: [
                        "Navigate to /company/login to access your company dashboard:",
                        "• Email Address: Enter your registered partner email address.",
                        "• Password: Enter your account password (click the eye icon to preview your typed password).",
                        "• Sign In to Portal: Click the purple button to log in and view your active tour orders.",
                        "• Forgot Password Link: If you cannot recall your password, click the FORGOT PASSWORD? link located directly beneath the password input field."
                    ],
                    steps: [
                        "Go to /company/login.",
                        "Enter your registered Email Address and Password.",
                        "Click Sign In to Portal."
                    ],
                    image: {
                        src: "/manuals/partner_login_forgot_password_link.png",
                        alt: "Partner Portal Sign In page showing login fields and forgot password link",
                        caption: "Partner Sign In (/company/login) - Enter your company email and password, or click Forgot Password if you need a reset"
                    }
                },
                {
                    title: "Requesting a Password Reset Link (/company/forgot-password)",
                    paragraphs: [
                        "If you or a staff member forget your login credentials, recover access in seconds:",
                        "• Email Submission: Enter your account email address in the field provided.",
                        "• Send Reset Link: Click Send Reset Link to dispatch an automated email containing a secure single-use password reset link.",
                        "• Create New Password: Open the email, click the link, and enter your new password to restore immediate portal access."
                    ],
                    steps: [
                        "Click FORGOT PASSWORD? on /company/login (or navigate directly to /company/forgot-password).",
                        "Enter your account Email Address.",
                        "Click Send Reset Link.",
                        "Check your email inbox for the reset link and choose a new password."
                    ],
                    image: {
                        src: "/manuals/partner_forgot_password_request.png",
                        alt: "Forgot password request screen showing email address input and send reset link button",
                        caption: "Forgot Password (/company/forgot-password) - Enter your registered email to receive a password reset link"
                    }
                }
            ]
        },
        {
            id: "company-dashboard",
            title: "3. How to Use Your Company Dashboard",
            description: "Purpose: The Company Dashboard gives you an immediate operational snapshot of your upcoming tour lunches, quick access to settle outstanding invoices, and a live stream of recent passenger orders.",
            paragraphs: [
                "When you log into /company, your Dashboard provides high-level metrics and direct management shortcuts:"
            ],
            subsections: [
                {
                    title: "Dashboard KPI Metrics & Payment Reminders",
                    paragraphs: [
                        "The top of /company highlights essential operational and billing data:",
                        "• Payment Reminder Banner: When an invoice is issued, an orange ACTION REQUIRED banner displays the invoice number, date range, total balance, and a direct Pay button to settle payments via Stripe in one click.",
                        "• Total Lunches: Lifetime cumulative box lunches ordered across all tours.",
                        "• Today's Lunches: Total count of box lunches scheduled for preparation and delivery today.",
                        "• Pending Lunches: Active orders scheduled for upcoming tour dates awaiting kitchen fulfillment.",
                        "• Unpaid Invoices: Summary card tracking outstanding balances and total count of pending invoices.",
                        "• Open My Order App Button: Located in the bottom-left sidebar to quickly open and preview your dedicated live customer ordering menu."
                    ],
                    steps: [
                        "Log into /company to review daily tour volume.",
                        "Check Today's Lunches to verify meals prepared for current tours.",
                        "Click Pay on the payment banner to immediately settle outstanding catering statements.",
                        "Use Open My Order App to access your live passenger ordering portal."
                    ],
                    image: {
                        src: "/manuals/company_dashboard_overview.png",
                        alt: "Company Dashboard overview showing payment reminder banner, KPI stat cards, recent orders table, and open my order app launcher",
                        caption: "Company Dashboard (/company) - Monitor tour lunch counts, review unpaid invoices, track recent bookings, and launch your order app"
                    }
                },
                {
                    title: "Recent Orders & Live Booking Stream",
                    paragraphs: [
                        "The Recent Orders panel provides a real-time log of recently placed tour lunches:",
                        "• Customer & Guide Name: Name of the individual guest or tour guide who placed the order.",
                        "• Tour Date & Time: Scheduled tour date and departure pickup time (e.g. 08/29/2026 6:30 AM).",
                        "• Status Badges: Current kitchen workflow state (e.g. FULFILLED, PENDING).",
                        "• Items Breakdown: Complete summary of ordered lunch recipes (e.g. 10 Total Items: 4x Ham and Cheese, 3x Turkey and Cheese, 3x PB&J).",
                        "• View All Shortcut: Click View All at the top right to jump directly into the full order management and filtering screen at /company/orders."
                    ]
                }
            ]
        },
        {
            id: "share-guest-links",
            title: "4. How to Configure App Settings, Branding & Ordering Options",
            description: "Purpose: The App Settings dashboard allows tour operators to tailor every aspect of their customer ordering portal—including available meal formats, header branding, guest links, bread and dessert catalogs, priority display sorting, and checkout form fields.",
            paragraphs: [
                "Configure your guest ordering portal, customize menu options, and retrieve client sharing links under App Settings (/company/settings)."
            ],
            subsections: [
                {
                    title: "Meal Options Configuration (/company/settings)",
                    paragraphs: [
                        "Configure which package formats and meal types are presented to your guests and tour guides when browsing the menu:",
                        "• Enable sandwich only: When enabled, customers can choose standalone sandwiches without side snacks or desserts.",
                        "• Enable box lunch: When enabled, customers can select full box lunch packages with included sides, dessert, and condiment inclusions.",
                        "• Enable junior box lunch: When enabled, customers can select junior box lunch packages tailored for children and youth tour passengers.",
                        "• Real-Time Catalog Sync: Toggling options instantly adds or removes corresponding package categories from your guest ordering portal."
                    ],
                    steps: [
                        "Navigate to App Settings (/company/settings) in your portal sidebar.",
                        "Locate the Meal Options card at the top of the page.",
                        "Toggle on the package formats you wish to offer (Sandwich only, Box lunch, Junior box lunch).",
                        "Changes save automatically and reflect immediately in your live ordering app."
                    ],
                    image: {
                        src: "/manuals/company_settings_meal_options.png",
                        alt: "App Settings Meal Options card showing toggles for standalone sandwich, box lunch, and junior box lunch",
                        caption: "Meal Options Configuration (/company/settings) - Toggle standalone sandwiches, standard box lunches, and junior box lunches on or off"
                    }
                },
                {
                    title: "App Branding, Active Links & Welcome Instructions (/company/settings)",
                    paragraphs: [
                        "Under the App Branding & Custom Message card in /company/settings, you can customize the guest ordering experience:",
                        "• Use Mountain Mama's Café Branding Toggle: When enabled, guests see 'Mountain Mama's Café' in the header. When disabled, your company name is prominently featured as the primary header title.",
                        "• Default Link Card: Provides your primary company slug URL (e.g., https://mountainmamascafe.app/yellowstone-adventures). Click Copy to copy the link to your clipboard, or Preview to test the live customer view.",
                        "• White-Label Order Link Card: Provides an unbranded neutral URL (e.g., https://mountainmamascafe.app/lunches-359c...) for travel agencies or private charters wanting an unbranded interface. Click Copy or Preview.",
                        "• Custom Welcome Instructions: Enter a personalized welcome message (e.g., 'Please place your family\'s order for your tour in Yellowstone below by selecting the meals of your choice.'). This text appears prominently at the top of your ordering page.",
                        "• Sidebar Quick App Launchers: Click Open Default App or Open White-Label App at the bottom of the left navigation sidebar to instantly open the ordering interface in a new browser tab."
                    ],
                    steps: [
                        "Go to App Settings (/company/settings).",
                        "Toggle Use Mountain Mama's Café Branding according to your branding preference.",
                        "Click Copy on either the Default Link or White-Label Order Link.",
                        "Type your custom greeting into the Custom Welcome Instructions field.",
                        "Use the sidebar Open Default App or Open White-Label App buttons to preview how your page looks to guests."
                    ],
                    image: {
                        src: "/manuals/company_app_branding_and_links.png",
                        alt: "App Branding and Custom Message settings showing branding toggle, default and white-label links, and custom welcome message",
                        caption: "App Branding & Active Links (/company/settings) - Configure header branding, copy default or white-label ordering links, and write custom welcome instructions"
                    }
                },
                {
                    title: "Bread Options & Priority Display Ordering (/company/settings)",
                    paragraphs: [
                        "Curate the specific artisan bread choices offered on your meal customization pages and control their visual sorting order:",
                        "• Priority Ranking Cards: Active breads are displayed in numbered priority order (e.g. #1: Seedy Wheat Bread, #2: French Bread, #3: Sour Dough Bread, #4: Gluten-free bread).",
                        "• Up & Down Arrow Controls: Click the ↑ and ↓ arrow buttons to move bread items up or down to set their display priority on the guest ordering screen.",
                        "• Active / Inactive Toggles: Toggle individual bread options on or off (e.g. Wrap, Gluten-free wrap, White Bread, Fresh Croissant, Deli Sliced Wheat, Herby Focaccia, Whole Grain Focaccia) to match seasonal kitchen availability."
                    ],
                    steps: [
                        "Scroll to the Bread Options card in App Settings (/company/settings).",
                        "Click the toggle switch next to any bread type to enable or disable it.",
                        "Use the ↑ (Move Up) and ↓ (Move Down) buttons to rank bread choices in your preferred display order.",
                        "Preview your ordering page to verify the updated bread selection order."
                    ],
                    image: {
                        src: "/manuals/company_settings_bread_options.png",
                        alt: "Bread Options settings showing numbered priority list with up down reorder arrows and inactive bread toggles",
                        caption: "Bread Options & Display Priority (/company/settings) - Enable available breads and use up/down arrows to sort their display priority"
                    }
                },
                {
                    title: "Cookie & Dessert Options Configuration (/company/settings)",
                    paragraphs: [
                        "Select and organize the fresh dessert and bakery items presented to guests during box lunch selection:",
                        "• Priority Dessert Ranking: Active desserts display their current rank (e.g. #1: Homemade Cookie, #2: Homemade Brownie, #3: Gluten free Brownie).",
                        "• Up / Down Arrow Sorting: Click ↑ and ↓ to set which dessert items appear first in the customer dropdown selection.",
                        "• Dessert Catalog Toggles: Enable or disable specialty flavors (e.g. Salted Caramel, Oatmeal Raisin, Lemon Blueberry, Chocolate Chip) according to your group preferences."
                    ],
                    steps: [
                        "Scroll to the Cookie Options card in App Settings (/company/settings).",
                        "Toggle on the dessert selections you want to offer your passengers.",
                        "Use the ↑ and ↓ buttons to arrange the display sequence.",
                        "Changes take effect immediately across all guest order forms."
                    ],
                    image: {
                        src: "/manuals/company_settings_cookie_options.png",
                        alt: "Cookie Options settings card showing prioritized cookie choices with up down arrows and inactive flavor options",
                        caption: "Cookie Options (/company/settings) - Select active dessert choices and adjust ordering priority with up/down controls"
                    }
                },
                {
                    title: "Form Customization: Meal Page & Tour Details Fields (/company/settings)",
                    paragraphs: [
                        "Customize the exact questions, input fields, and requirement rules for both the Meal Customization dialog and the Tour Details Checkout form:",
                        "• MEAL PAGE (ADD TO CART) Fields: Manage fields shown when a customer configures a meal, including Sandwich options (SELECT • REQUIRED), Cheese Options (SELECT • OPTIONAL), Bread Options (SELECT • REQUIRED), Cookie Options (SELECT • REQUIRED), Guest Name (TEXT • REQUIRED), and Allergy Alert (TEXTAREA • OPTIONAL).",
                        "• TOUR DETAILS (CHECKOUT) Fields: Manage departure logistics fields during checkout, including Pick-up Location (TEXT • OPTIONAL), Date of the tour (DATE • REQUIRED), and Time of pick-up (SELECT • REQUIRED).",
                        "• Toggle Switches: Easily turn optional fields on or off to streamline the checkout process and minimize guest ordering friction.",
                        "• Reorder Form Sequence: Use the ↑ and ↓ arrow buttons to reorder how questions appear from top to bottom."
                    ],
                    steps: [
                        "Scroll to Form Customization under App Settings (/company/settings).",
                        "Review the fields under MEAL PAGE (ADD TO CART) and TOUR DETAILS (CHECKOUT).",
                        "Toggle switches on or off to enable or disable optional questions.",
                        "Click ↑ or ↓ to adjust the order in which fields are presented to guests during checkout."
                    ],
                    image: {
                        src: "/manuals/company_settings_form_customization.png",
                        alt: "Form Customization settings card displaying reorderable fields for Meal Page and Tour Details Checkout forms",
                        caption: "Form Customization (/company/settings) - Reorder questions, configure required vs optional fields, and toggle form inputs for meal pages and checkout"
                    }
                }
            ]
        },
        {
            id: "guest-ordering-flow",
            title: "5. How Guests Place Their Own Lunch Orders (Step-by-Step)",
            description: "Purpose: Understanding the 5-step guest ordering journey helps your staff assist customers when they select meals online.",
            steps: [
                "Step 1 (Browse Menu): Guest opens link (/[slug]) and views welcome message and food categories.",
                "Step 2 (Item Customization): Guest clicks a meal and picks Bread, Cheese, Cookie, Side, and types Dietary Notes / Allergies.",
                "Step 3 (Cart Review): Guest reviews cart (/cart) and clicks Proceed to Checkout.",
                "Step 4 (Checkout & Details): Guest enters Guest Name, Tour Date (past dates blocked), Pickup Time, Guide Name, and Hotel.",
                "Step 5 (Confirmation): Guest receives an order confirmation number (/success). The order syncs instantly to your portal and the kitchen admin!"
            ],
            tip: "Saved Tour Details Memory: When tour guides or staff place multiple orders in a row, the app automatically remembers your recent Guide Name, Pickup Time, and Hotel in browser memory so they pre-fill automatically on subsequent checkouts!"
        },
        {
            id: "view-print-orders",
            title: "6. How to View, Filter & Manage Tour Orders",
            description: "Purpose: The Order History page gives tour managers, dispatchers, and guides a comprehensive control center to search customer bookings, review aggregated metrics, inspect individual sandwich customizations, and export packing sheets.",
            paragraphs: [
                "Manage, filter, and review all upcoming and historical tour lunch orders from Orders (/company/orders)."
            ],
            subsections: [
                {
                    title: "Switching Between List View & Cards View (/company/orders)",
                    paragraphs: [
                        "The Orders portal header includes a view switcher toggle to accommodate different operational needs:",
                        "• List View: Formats all bookings into a clean, compact tabular grid displaying Customer Name, Tour Date, Placed At timestamp, Items breakdown preview, Status badges (FULFILLED, CANCELLED), and an Actions menu (...). This view is ideal for quickly scanning high-volume departure days.",
                        "• Cards View: Displays each booking as an individual visual card highlighting pickup times, total ticket values, status badges, and item summaries for intuitive visual inspection.",
                        "• Real-Time Order Counter: Sub-header displays the exact count of active orders (e.g. 8 orders found · 25 total lunches · 0 pending orders).",
                        "• Search & Date Toolbar: Search by customer/guide name, toggle between TOUR DATE and ORDER DATE, apply date presets (Today, Tomorrow, This Week), and filter by fulfillment status."
                    ],
                    steps: [
                        "Navigate to Orders (/company/orders).",
                        "Click List in the view toggle at the top right to display the compact tabular table.",
                        "Click Cards in the view toggle to switch back to the multi-card grid view.",
                        "Use the search and date filters to narrow down the displayed orders in either view."
                    ],
                    images: [
                        {
                            src: "/manuals/company_orders_list_view.png",
                            alt: "Company Order History shown in List table view with columns for Customer, Tour Date, Placed At, Items, Status, and Actions",
                            caption: "List View (/company/orders) - Compact table view for fast scanning of customer names, departure dates, and order statuses"
                        },
                        {
                            src: "/manuals/company_orders_cards_view.png",
                            alt: "Company Order History shown in Cards grid view highlighting pickup times, pricing, and visual card cards",
                            caption: "Cards View (/company/orders) - Visual card grid highlighting pickup times, price totals, and meal previews"
                        }
                    ]
                },
                {
                    title: "Aggregated Search Value & Lunch Type Breakdown",
                    paragraphs: [
                        "When filters are applied, the summary banner instantly calculates consolidated statistics for all matching orders:",
                        "• SEARCH RESULTS VALUE: Total gross dollar value of all filtered orders (e.g. $456.00).",
                        "• LUNCHES COUNT: Total individual box lunches and meals across filtered tickets (e.g. 24 lunches).",
                        "• ORDERS FOUND: Total number of distinct group or passenger orders matching your search (e.g. 7 orders).",
                        "• BREAKDOWN BY LUNCH TYPE: Itemized breakdown per menu category showing unit count and dollar subtotal (e.g. Box Lunch: 19 lunches · $361.00; Junior Box: 5 lunches · $95.00).",
                        "• Show Guide Breakdown: Click to expand a guide-by-guide summary showing lunch volume and revenue attributed to each field guide."
                    ],
                    steps: [
                        "Review SEARCH RESULTS VALUE and LUNCHES COUNT to track excursion catering totals.",
                        "Check the BREAKDOWN BY LUNCH TYPE badges to verify packaging requirements.",
                        "Click Show Guide Breakdown to see which tour guides have meals assigned."
                    ]
                },
                {
                    title: "Order Cards & Detailed Item Customization Breakdown",
                    paragraphs: [
                        "Each order card provides granular visibility into customer selections and special preparation requirements:",
                        "• Card Header: Displays Customer/Guide Name, scheduled TOUR DATE, PICKUP TIME (e.g. 5:00 AM), fulfillment status badge (FULFILLED), TOTAL PRICE, and booking placement timestamp.",
                        "• ITEM BREAKDOWN List: Details every single lunch in the order:",
                        "  - Meal Name & Quantity: e.g. 3x Turkey and Cheese (French Bread), 2x Tuna Salad Sandwich, 1x Ham and Cheese.",
                        "  - Package Type: Categorized as Box Lunch, Junior Box, or Bag Lunch.",
                        "  - Bread Options: Selected bread (e.g. Whole Grain Focaccia, Gluten-free bread, Sourdough).",
                        "  - Cookie Options: Selected dessert (e.g. Homemade Cookie, Chocolate Chip).",
                        "  - Cheese & Sandwich Options: Preparation preferences (e.g. As is, Sandwich).",
                        "  - Dietary & Allergy Alerts: Prominent red notices (e.g. Allergy Alert: Gluten-Free) ensure zero mix-ups during packing and boarding."
                    ],
                    steps: [
                        "Locate the order card in Cards view (or click any row in List view).",
                        "Inspect bread, cheese, and cookie selections for each guest.",
                        "Check for highlighted red Allergy Alerts to ensure sensitive meals are packaged separately."
                    ],
                    image: {
                        src: "/manuals/company_order_history_item_breakdown.png",
                        alt: "Expanded order card displaying item breakdown, bread and cookie options, and red allergy alert",
                        caption: "Order Item Breakdown - Review specific custom selections, bread choices, cookie selections, and prominent dietary allergy alerts"
                    }
                },
                {
                    title: "Printing Order Tables & Tour Departure Manifests",
                    paragraphs: [
                        "Before heading out on tour, guides need a clear paper checklist to verify each guest gets their exact sandwich choice and dietary meal.",
                        "• Print Table Button: Click Print Table at the top right of /company/orders to trigger the browser's native print preview dialog.",
                        "• Formatted Print Manifest: The app automatically compiles a multi-page PDF/print layout containing Customer/Guide Name, Tour Date, Placed At timestamp, exact Order Details (with bread, cheese, and cookie choices), Dietary Notes, and total report lunch counts.",
                        "• Print / PDF Export: Select your connected printer or choose 'Save as PDF' from the destination dropdown to hand physical manifests to departure guides or email them to field dispatchers."
                    ],
                    steps: [
                        "Filter orders by your desired excursion date (e.g. today's or tomorrow's tour date).",
                        "Click Print Table at the top right of /company/orders.",
                        "Review the print preview pages to ensure all guest choices are included.",
                        "Click Print to send directly to your printer, or choose Save as PDF."
                    ],
                    image: {
                        src: "/manuals/company_print_orders_table_dialog.png",
                        alt: "Print Table preview dialog on company orders page showing multi-page manifest layout",
                        caption: "Print Orders Table - Click Print Table on /company/orders to preview and print formatted daily packing checklists for your guides"
                    }
                }
            ]
        },
        {
            id: "cutoff-timelines",
            title: "7. How Order Changes, Last-Minute Requests & Cutoff Timelines Work",
            description: "Purpose: The 3-Tier Modification & Cutoff Policy protects kitchen preparation timelines while providing tour operators transparent self-service and approval workflows for last-minute bookings.",
            paragraphs: [
                "Understand the order submission rules, cutoff warning notices, and status lifecycles for upcoming tour lunches."
            ],
            subsections: [
                {
                    title: "Placing a Last-Minute Order (<14 Hours Cutoff Warning)",
                    paragraphs: [
                        "When a lunch order is placed with a pickup departure time less than 14 hours away, the ordering app triggers automated safeguards:",
                        "• Tour Details Warning Banner: During checkout, a prominent yellow alert notifies the user: 'Last-Minute Request Notice: Because this pickup time is less than 14 hours away, this order will be submitted as a request requiring café approval.'",
                        "• Order Request Submitted Confirmation: After clicking Confirm Order, the screen displays a dedicated Action Required modal instructing the guide or guest to call or text Kim directly at (406) 461-1024 to verify immediate kitchen ingredient and bread availability."
                    ],
                    steps: [
                        "Select your meals and proceed to checkout.",
                        "Choose a pickup time that is within 14 hours of departure.",
                        "Note the Last-Minute Request Notice and click Confirm Order.",
                        "On the confirmation screen, follow the prompt to call or text (406) 461-1024 for immediate kitchen confirmation."
                    ],
                    images: [
                        {
                            src: "/manuals/last_minute_checkout_warning_notice.png",
                            alt: "Tour details checkout screen showing last-minute request warning notice for orders under 14 hours",
                            caption: "Last-Minute Checkout Alert - Notifies guests and guides when a chosen pickup time requires kitchen approval"
                        },
                        {
                            src: "/manuals/last_minute_request_submitted_modal.png",
                            alt: "Confirmation screen showing order request submitted alert with direct phone contact for Kim",
                            caption: "Order Request Submitted - Direct phone and SMS contact provided for immediate morning kitchen overrides"
                        }
                    ]
                },
                {
                    title: "Dashboard Status Lifecycle: PENDING ORDER REQUEST to PENDING",
                    paragraphs: [
                        "When a last-minute order is placed, it follows a two-stage status progression on your company dashboard (/company/orders):",
                        "• 1. PENDING ORDER REQUEST (Awaiting Kitchen Review): The order immediately syncs to your portal. The top counter increments (e.g. 1 pending order), and the order card displays the orange 'PENDING ORDER REQUEST' status badge.",
                        "• 2. PENDING (Approved for Kitchen Production): Once kitchen administration approves the request, the status badge automatically switches from PENDING ORDER REQUEST to 'PENDING', confirming the meals are scheduled for packing and delivery.",
                        "• Automated Email Notifications: An automated email is dispatched to your registered company email address the moment your order request is approved or updated."
                    ],
                    steps: [
                        "Open Orders (/company/orders) to monitor newly submitted bookings.",
                        "Look for the orange PENDING ORDER REQUEST badge on orders awaiting kitchen review.",
                        "Once approved by catering staff, verify the badge updates to PENDING (scheduled for fulfillment).",
                        "Check your email inbox for automatic status confirmation receipts."
                    ],
                    images: [
                        {
                            src: "/manuals/company_order_pending_request_status.png",
                            alt: "Company order history showing order card with PENDING ORDER REQUEST status badge",
                            caption: "Pending Request State - Displays orange PENDING ORDER REQUEST status while kitchen checks morning capacity"
                        },
                        {
                            src: "/manuals/company_order_approved_pending_status.png",
                            alt: "Company order history showing order card updated to PENDING status after kitchen approval",
                            caption: "Approved State - Status updates to PENDING once catering admin accepts and schedules the order"
                        }
                    ]
                },
                {
                    title: "The 3-Tier Modification Policy & Order Editing Rules",
                    paragraphs: [
                        "The portal enforces a 3-Tier cutoff policy based on the remaining time until your scheduled tour pickup departure. When editing an order on /company/orders, the modal banner dynamically recalculates remaining hours and informs you whether your edit applies immediately or requires approval.",
                        "• Opening the Edit Menu: Click the '...' action button on any unfulfilled order card and select 'Edit Order'.",
                        "• Tier 1 (24+ Hours Before Pickup - Direct Edit): Changes to customer names, guide names, tour dates, pickup times, dietary notes, and lunch items apply instantly. The banner displays ⚡ Direct Edit and the button displays 'Save Changes'.",
                        "• Tier 2 (14 to 24 Hours Before Pickup - Modification Request): Changes are submitted to café management for fast review. The banner displays ⚠️ Modification Request and the button displays 'Submit Change Request'.",
                        "• Tier 3 (Under 14 Hours Before Pickup - Locked Online): Online edits are strictly locked to protect morning bread baking and packing lines. A prominent alert prompts dispatchers to call or text Kim at (406) 461-1024 for immediate phone assistance."
                    ],
                    steps: [
                        "Click the '...' actions menu on your order card and select Edit Order.",
                        "Modify customer name, tour date, pickup time, notes, bread choices, or lunch quantities.",
                        "Review the top banner: it updates in real time to show remaining hours and your cutoff tier.",
                        "Click Save Changes (for direct edits > 24h) or Submit Change Request (for requests 14–24h away).",
                        "For orders under 14 hours, contact Kim directly at (406) 461-1024."
                    ],
                    images: [
                        {
                            src: "/manuals/company_order_actions_edit_menu.png",
                            alt: "Order card action dropdown menu showing Edit Order, Cancel Order, and Delete Order options",
                            caption: "Order Action Menu - Click '...' on any unfulfilled order card to access the Edit Order modal"
                        },
                        {
                            src: "/manuals/company_edit_order_direct_edit_banner.png",
                            alt: "Edit order modal displaying green direct edit banner with 4 days 21 hours remaining",
                            caption: "Tier 1 Direct Edit (> 24h) - Changes take effect immediately without requiring kitchen approval"
                        },
                        {
                            src: "/manuals/company_edit_order_modification_request_tier2.png",
                            alt: "Edit order modal displaying amber warning banner and Submit Change Request button for 14-24h window",
                            caption: "Tier 2 Modification Request (14–24h) - Button switches to Submit Change Request for kitchen approval"
                        },
                        {
                            src: "/manuals/company_order_locked_under_14h_notice.png",
                            alt: "Order history page displaying red locked notice banner when attempting to edit an order under 14 hours away",
                            caption: "Tier 3 Locked (< 14h) - Online modifications locked; direct call or text to Kim required for morning overrides"
                        }
                    ],
                    tip: "Past Dates Blocked: The date picker strictly disables previous dates to prevent historical scheduling mistakes.",
                    warning: "Email Alerts: You will automatically receive an email confirmation whenever an admin approves or declines your change request."
                }
            ]
        },
        {
            id: "invoices-payments",
            title: "8. How to View & Pay Invoices Online",
            description: "Purpose: The Invoices & Receipts module provides transparent, permanent recordkeeping of all excursion catering statements, real-time balance tracking, and secure integrated online payments via Credit Card or ACH transfer.",
            paragraphs: [
                "Access your complete billing history, inspect itemized meal type and tour date breakdowns, download official PDF statements, and settle balances instantly from Invoices (/company/invoices)."
            ],
            subsections: [
                {
                    title: "Billing KPI Stat Cards & Invoice History Ledger (/company/invoices)",
                    paragraphs: [
                        "The Invoices dashboard gives tour operators an instant financial overview and permanent ledger of all billing statements:",
                        "• Key Metric Cards: Track TOTAL PAID across historical billing cycles, current OUTSTANDING BALANCE awaiting payment, and lifetime TOTAL INVOICES issued.",
                        "• Search & Status Filter Bar: Search invoices by reference number (#A26FF000) or dollar amount. Filter table records by All, Unpaid (awaiting settlement), or Paid (settled).",
                        "• Status Indicators: Unpaid invoices display an orange 'SENT' status badge. Settled statements display a green 'PAID' badge with the exact date of payment.",
                        "• One-Click Payment & PDF Actions: Click Pay Online on any unpaid statement to launch the secure checkout window, or click the download icon to retrieve an official PDF invoice for your accounting records. Paid statements feature a View Receipt button for audit reconciliation."
                    ],
                    steps: [
                        "Navigate to Invoices (/company/invoices) in your portal sidebar.",
                        "Review high-level metrics: Total Paid, Outstanding Balance, and Total Invoices.",
                        "Click Unpaid to view open statements currently due.",
                        "Click Pay Online to settle an invoice, or click the download icon to save a PDF statement."
                    ],
                    image: {
                        src: "/manuals/company_invoices_history_ledger.png",
                        alt: "Company Invoices and Receipts dashboard showing KPI cards for Total Paid, Outstanding Balance, Total Invoices, and the Invoice History ledger table",
                        caption: "Invoices & Receipts Ledger (/company/invoices) - Track settled vs outstanding balances, filter by status, and access online payment or PDF downloads"
                    }
                },
                {
                    title: "Interactive Invoice Breakdown & Itemized Meal Type Accordions (/invoice/[id]/pay)",
                    paragraphs: [
                        "Clicking Pay Online or opening an invoice link opens the transparent itemized statement view:",
                        "• Header & Billing Period: Displays company details (Bill To: Yellowstone Excursions), the designated billing date range (e.g. July 1, 2026 — July 31, 2026), and a PDF Invoice download shortcut.",
                        "• Total Lunches Badge: Displays total meal volume (e.g. 956 Total Lunches) served across all tours in the billing cycle.",
                        "• Summary by Meal Type Accordion: Expandable table itemizing every sandwich and meal category (e.g. Turkey and Cheese, Ham and Cheese, Roastbeef, PB&J, Vegetarian), individual quantities served, contract unit price ($17.50), and category subtotals.",
                        "• Items by Tour Date Accordion: Expandable daily excursion log allowing your accounting team to cross-reference catering numbers against daily dispatch logs.",
                        "• Taxes & Volume Discount Breakdown: Transparently displays Lunches Subtotal, local Resort Tax (4%), negotiated partner savings (e.g. Per-Lunch Discount -$478.00 for 956 lunches), and Credit Card Processing Fees to yield the final Invoice Total (Base)."
                    ],
                    steps: [
                        "Open the online invoice link or click Pay Online from your portal.",
                        "Click Summary by Meal Type to audit sandwich quantities and unit pricing.",
                        "Click Items by Tour Date to verify daily excursion meal delivery counts.",
                        "Inspect transparent calculations for local taxes and per-lunch volume discounts."
                    ],
                    image: {
                        src: "/manuals/company_invoice_payment_breakdown.png",
                        alt: "Online invoice payment breakdown showing Summary by Meal Type table, tour date logs, taxes, per-lunch volume discounts, and invoice base total",
                        caption: "Itemized Invoice Breakdown (/invoice/[id]/pay) - Transparent accounting showing meal type quantities, daily excursion logs, and volume discounts"
                    }
                },
                {
                    title: "Adding Tips for Kitchen Staff & Secure Payment (Credit Card / ACH)",
                    paragraphs: [
                        "The bottom section of the invoice payment portal provides seamless gratuity options and flexible payment method selection:",
                        "• Add a Tip for the Sandwich Makers: Show appreciation for the early-morning kitchen crew that prepares and packs your excursion lunches. Choose one-click preset buttons ($75, $125, $175, $200) or enter a custom amount in the $ Custom amount field.",
                        "• Credit / Debit Card Payment: Select Credit/Debit Card for standard card settlement via Stripe (standard 2.9% + $0.30 processing fee).",
                        "• Bank Account (ACH) Payment: Select Bank Account (ACH) for direct bank transfer with 0% processing fees—ideal for high-volume monthly settlements.",
                        "• Instant Receipt & Status Sync: Click Pay Securely to submit your payment through 256-bit encrypted Stripe checkout. The invoice updates immediately to 'PAID' across your company portal and catering management dashboards, and a formal digital tax receipt is emailed to your billing contact."
                    ],
                    steps: [
                        "Select an optional tip amount for the café kitchen team.",
                        "Select your preferred payment method: Credit / Debit Card or 0% Fee Bank Account (ACH).",
                        "Review the live updated Total Due.",
                        "Click Pay Securely to complete payment via encrypted Stripe processing.",
                        "Download your digital receipt and check your inbox for payment confirmation."
                    ],
                    image: {
                        src: "/manuals/company_invoice_tip_and_payment_method.png",
                        alt: "Invoice payment bottom section showing tip selection for sandwich makers, payment method radio buttons, and secure Pay button",
                        caption: "Gratuity & Payment Methods - Add optional crew tips, choose between Credit Card or 0% Fee ACH Bank Transfer, and pay securely via Stripe"
                    }
                }
            ]
        },
        {
            id: "menu-management",
            title: "9. How to Manage Available Menu Offerings & Prices",
            description: "Purpose: The Menu Management portal gives tour operators full autonomy to review negotiated contract pricing, browse recipe ingredients, toggle individual meal availability for guests, switch between Cards and Table views, and print formatted menus.",
            paragraphs: [
                "Manage your company's active food catalog, inspect negotiated contract pricing, toggle meal visibility, and generate printable menus under Menu Management (/company/menu)."
            ],
            subsections: [
                {
                    title: "Interactive Meal Cards, Availability Toggles & Pricing (/company/menu)",
                    paragraphs: [
                        "The Menu Management screen displays your full catering catalog with granular operational controls:",
                        "• Visual Meal Cards & Photography: Browse all available recipes with high-resolution food photography, image carousel controls (< >), and category tags (e.g. SANDWICH).",
                        "• Negotiated Contract Pricing: Review your exact negotiated box lunch rate (e.g. $17.50) and Junior Box package pricing directly on each card.",
                        "• Instant Availability Toggles: Click the purple toggle switch on any card to instantly make that meal AVAILABLE (green badge) or HIDDEN (grey badge with greyscale photo preview). Hidden meals are immediately excluded from your live guest ordering app.",
                        "• Recipe & Ingredient Descriptions: Review comprehensive sandwich builds (e.g. 'Mountain Mama\'s homemade French bread piled high with Freshly sliced roast beef, one slice of cheddar, lettuce, and tomato') to guide guests with specific preferences.",
                        "• Search & View Toggle: Use the Search meals... input to filter recipes by keyword, or toggle between Cards and Table views.",
                        "• Print Menu Button: Click Print Menu at the top right to generate a clean, branded PDF menu for your departure lobby, office binders, or tour guides."
                    ],
                    steps: [
                        "Navigate to Menu Management (/company/menu) in your portal sidebar.",
                        "Review available sandwich choices, ingredients, and negotiated prices ($17.50).",
                        "Click the toggle switch on any meal card to set it to AVAILABLE (active for guests) or HIDDEN (disabled).",
                        "Use Search meals... or toggle between Cards and Table view to find specific items.",
                        "Click Print Menu at the top right to download or print a physical menu sheet."
                    ],
                    image: {
                        src: "/manuals/company_menu_management_cards_view.png",
                        alt: "Menu Management page showing interactive meal cards with availability badges, junior box prices, image carousels, toggle switches, and print menu button",
                        caption: "Menu Management (/company/menu) - Inspect negotiated pricing, toggle meals between Available and Hidden, browse ingredients, and print menus"
                    },
                    tip: "Instant Guest Sync: Turning a meal toggle off immediately hides that item from your customer ordering portal with zero delay."
                }
            ]
        }
    ]
};
