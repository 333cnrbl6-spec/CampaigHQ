import { useState } from 'react';
import {
  BookOpen, LayoutDashboard, Users, Zap, MapPin, Map, Printer,
  Route, Newspaper, ClipboardList, Calendar, Send, BarChart3,
  Upload, MessageSquare, FileText, ChevronRight, Search,
  CheckCircle2, AlertCircle, Info, ThumbsUp, DoorOpen,
  ShieldCheck, Navigation, FileSpreadsheet, Footprints, ScrollText, UserCog
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ─── Manual content ────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: 'getting-started',
    icon: BookOpen,
    title: 'Getting Started',
    color: 'text-primary',
    bg: 'bg-primary/10',
    content: [
      {
        type: 'intro',
        text: 'Welcome to the Paul Binns Green Party Campaign App — a complete campaign management platform for voter contact, leaflet tracking, volunteer coordination, route planning, and election day operations.',
      },
      {
        type: 'steps',
        heading: 'Logging In',
        steps: [
          'Visit the app URL in your browser and sign in with your campaign email.',
          'First-time users: ask your campaign administrator to send you an invite.',
          'Once logged in you\'ll land on the Dashboard — your campaign command centre.',
        ],
      },
      {
        type: 'steps',
        heading: 'Navigating the App',
        steps: [
          'Use the sidebar on the left to move between sections.',
          'The sidebar can be collapsed using the arrow at the bottom to give more screen space.',
          'On mobile, the layout adjusts automatically — all features are accessible.',
          'The green Olive bot (bottom right) is always available to answer questions.',
        ],
      },
      {
        type: 'list',
        heading: 'Key sections at a glance',
        items: [
          'Dashboard — campaign overview, live stats, and coverage map',
          'Voter Contacts — full database of every contact in the ward',
          'Field Mode — mobile door-knocking interface with offline support',
          'Leaflet Distribution — three-round tracking per street',
          'Route Optimiser — postcode-accurate walking routes',
          'Turf Sheets & Print — pre-briefing safety form + printable canvassing sheets',
          'Voter List Import — bulk import from the electoral register spreadsheet',
          'GDPR Compliance — consent tracking, data requests, and retention controls',
          'Organiser Dashboard — volunteer performance and coverage heatmap',
        ],
      },
      {
        type: 'tip',
        text: 'Bookmark the app on your phone\'s home screen for quick access during canvassing sessions.',
      },
    ],
  },
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: 'Dashboard',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    content: [
      {
        type: 'intro',
        text: 'The Dashboard gives you a live overview of the whole campaign — doors knocked, support levels, upcoming events, and active tasks at a glance.',
      },
      {
        type: 'list',
        heading: 'What you can see',
        items: [
          'Total doors knocked and contacts made across the campaign',
          'Support level breakdown — strong supporters, leaning, undecided, opposed',
          'Upcoming events and deadlines',
          'Active tasks and their priorities',
          'Recent campaign activity',
          'Canvassing coverage map',
        ],
      },
      {
        type: 'tip',
        text: 'Check the Dashboard every morning during the campaign to stay on top of progress and spot any gaps in coverage.',
      },
    ],
  },
  {
    id: 'contacts',
    icon: Users,
    title: 'Voter Contacts',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    content: [
      {
        type: 'intro',
        text: 'The Voter Contacts section is the central database for everyone you\'ve spoken to or plan to speak to across the ward.',
      },
      {
        type: 'steps',
        heading: 'Adding a New Contact',
        steps: [
          'Click "Voter Contacts" in the sidebar.',
          'Click the "Add Contact" button (top right).',
          'Enter name, address, postcode — these are the key fields.',
          'Optionally add phone, email, support level, and notes.',
          'Click Save.',
        ],
      },
      {
        type: 'steps',
        heading: 'Searching & Filtering',
        steps: [
          'Use the search bar to search by name, address, or postcode.',
          'Use the filter dropdowns to narrow by support level or canvassed status.',
          'Check the "Volunteers only" filter to quickly find people who have offered to help.',
        ],
      },
      {
        type: 'steps',
        heading: 'Bulk Tagging',
        steps: [
          'Select multiple contacts using the checkboxes on the left.',
          'Click "Apply Tags".',
          'Choose or type a tag (e.g. "Requires Follow-up", "Display Poster").',
          'Click Apply — all selected contacts are tagged at once.',
        ],
      },
      {
        type: 'tip',
        text: 'Focus canvassing effort on "Undecided" contacts first — they\'re the votes most likely to be won.',
      },
    ],
  },
  {
    id: 'field-mode',
    icon: Zap,
    title: 'Field Mode',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    content: [
      {
        type: 'intro',
        text: 'Field Mode is the mobile-optimised door-knocking interface. It sorts contacts by proximity to your current location, works offline, and lets you log interactions instantly.',
      },
      {
        type: 'steps',
        heading: 'Starting a Session',
        steps: [
          'Click "Field Mode" in the sidebar.',
          'Allow location access when prompted — this enables proximity sorting.',
          'The contact list automatically orders by closest address first.',
          'The status bar shows whether you\'re Online or Offline.',
        ],
      },
      {
        type: 'steps',
        heading: 'Logging a Door Knock',
        steps: [
          'View the current contact\'s name and address on screen.',
          'Click "Log Interaction".',
          'Set the support level: Strong Supporter / Leaning / Undecided / Opposed / Unknown.',
          'Set the outcome: Positive / Neutral / Negative / No Answer.',
          'Add any notes about issues they raised.',
          'Click "Save & Next" to move to the next contact.',
          'If offline, the interaction is saved locally and syncs when you reconnect.',
        ],
      },
      {
        type: 'warning',
        text: 'Always allow location permissions before heading out. Without them, contacts won\'t be sorted by proximity and you\'ll need to navigate manually.',
      },
    ],
  },
  {
    id: 'canvassing-activity',
    icon: DoorOpen,
    title: 'Session Activity Log',
    color: 'text-green-600',
    bg: 'bg-green-50',
    content: [
      {
        type: 'intro',
        text: 'After a canvassing session, volunteers log a summary of their activity here — doors knocked, responses, issues raised. The Campaign Summary tab gives managers a complete picture of daily and weekly reach.',
      },
      {
        type: 'steps',
        heading: 'Logging a Session (Volunteers)',
        steps: [
          'Click "Session Activity" in the Contacts section of the sidebar.',
          'Select the "Log a Session" tab.',
          'Enter your name, the date, and the street or area you covered.',
          'Fill in doors knocked, positive responses, negative responses, and no answers.',
          'Add any street issues residents mentioned in the "Street Issues Raised" box.',
          'Click Submit Session Log.',
        ],
      },
      {
        type: 'steps',
        heading: 'Viewing the Campaign Summary (Managers)',
        steps: [
          'Click the "Campaign Summary" tab.',
          'Use the range buttons (Today / Last 7 Days / Last 14 Days / All Time) to filter.',
          'See total doors knocked, volunteer count, support rates, leaflets delivered, and hours volunteered.',
          'The bar chart shows daily doors knocked over time.',
          'Scroll down to see all recent sessions and a feed of street issues raised by residents.',
        ],
      },
      {
        type: 'tip',
        text: 'Street issues logged here can be fed directly into Paul\'s policy position and used in canvassing conversations.',
      },
    ],
  },
  {
    id: 'turf',
    icon: Map,
    title: 'Turf Management',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    content: [
      {
        type: 'intro',
        text: 'Turf Management lets you draw, assign, and track geographic canvassing zones on a live map. Each turf can be assigned to a volunteer or team with a target number of doors.',
      },
      {
        type: 'steps',
        heading: 'Creating a Turf',
        steps: [
          'Click "Turf Management" in the sidebar.',
          'Use the drawing tools (top right of the map) to draw a polygon over your chosen area.',
          'Give the turf a name and assign it to a volunteer.',
          'Set a priority level and door target if needed.',
          'Save — the turf appears on the map with its colour.',
        ],
      },
      {
        type: 'steps',
        heading: 'Importing from Legacy DOCX Files',
        steps: [
          'Click "Import Map Files" in the Admin section of the sidebar.',
          'Drag and drop your DOCX round files into the upload zone.',
          'The system automatically reads the street list and draws a map boundary using the embedded map image.',
          'Review the extracted streets and confirm the import.',
          'The turf and its streets will appear on the map and in the Leaflet Tracker.',
        ],
      },
      {
        type: 'tip',
        text: 'Use the map overview to see at a glance which areas are covered, in progress, and still unassigned — especially useful in the final days before polling.',
      },
    ],
  },
  {
    id: 'leaflets',
    icon: Newspaper,
    title: 'Leaflet Distribution',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    content: [
      {
        type: 'intro',
        text: 'The Leaflet Distribution tracker manages three rounds of leafleting across all streets in the ward — tracking which streets are done, which are in progress, and which still need covering.',
      },
      {
        type: 'list',
        heading: 'The Three Rounds',
        items: [
          'Round 1 — All households: every house gets a leaflet.',
          'Round 2 — Postal voters only: targeted delivery to postal voter addresses.',
          'Round 3 — All households except postal voters: completes the round 2 exclusions.',
        ],
      },
      {
        type: 'steps',
        heading: 'Marking a Street as Done',
        steps: [
          'Click "Leaflet Distribution" in the sidebar.',
          'Find the street using the search or filter by turf or round.',
          'Click the tick button for the relevant round (R1, R2, or R3).',
          'The progress bars update automatically.',
        ],
      },
      {
        type: 'steps',
        heading: 'Printing a Leaflet Run Sheet',
        steps: [
          'Inside Leaflet Distribution, click "Print Run Sheet" for a turf.',
          'You will first be shown the Safety Briefing Form — fill this in before printing.',
          'The printed output includes a cover page with volunteer details, emergency contact, and GDPR reminder.',
          'The main sheet lists all streets with round tick boxes, house counts, and postal voter counts.',
          'Hand the printed sheet to volunteers at the start of a session.',
        ],
      },
      {
        type: 'tip',
        text: 'Always complete the Safety Briefing form before printing — it ensures lone worker safety details are on the sheet in case of emergency.',
      },
    ],
  },
  {
    id: 'turf-sheets',
    icon: Printer,
    title: 'Turf Sheets & Print',
    color: 'text-fuchsia-600',
    bg: 'bg-fuchsia-50',
    content: [
      {
        type: 'intro',
        text: 'Turf Sheets generate printable canvassing documents for any set of contacts. They can be printed in standard mode or in Optimised Route mode (sorted by walking order from the Route Optimiser).',
      },
      {
        type: 'steps',
        heading: 'Printing a Standard Turf Sheet',
        steps: [
          'Click "Turf Sheets" in the sidebar.',
          'Use the turf zone filter or search to find the contacts you want.',
          'Select individual contacts or click "Select All".',
          'Click "Print Sheet".',
          'Complete the Safety Briefing Form (volunteer name, date, emergency contact, GDPR confirmation).',
          'The sheet generates with a cover page followed by a table of contacts grouped by street.',
        ],
      },
      {
        type: 'steps',
        heading: 'Printing an Optimised Route Sheet',
        steps: [
          'First generate a route in the Route Optimiser (see Route Optimiser section).',
          'From the route panel, click "Print Turf Sheet".',
          'This opens Turf Sheets with contacts pre-selected in walking order.',
          'Complete the Safety Briefing Form and print.',
          'The sheet title shows "Optimised Route" and contacts are listed in route sequence.',
        ],
      },
      {
        type: 'list',
        heading: 'What the Safety Briefing Form collects',
        items: [
          'Volunteer name and date of session',
          'Emergency contact name and phone number (mandatory)',
          'Health or accessibility notes (optional)',
          'Lone worker safety confirmation (mandatory tick)',
          'GDPR data handling confirmation (mandatory tick)',
        ],
      },
      {
        type: 'list',
        heading: 'What the Print Cover Page shows',
        items: [
          'Campaign branding and task title',
          'Volunteer and date details',
          'Emergency contact prominently highlighted',
          'Contact/street count and estimated leaflets needed',
          'Safeguarding and GDPR reminder block',
        ],
      },
      {
        type: 'warning',
        text: 'The Safety Briefing form cannot be skipped. All mandatory fields (name, emergency contact, both confirmation ticks) must be completed before the sheet will generate.',
      },
    ],
  },
  {
    id: 'route',
    icon: Navigation,
    title: 'Route Optimiser',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    content: [
      {
        type: 'intro',
        text: 'The Route Optimiser builds accurate walking routes for canvassing sessions. It groups contacts by postcode, finds the most efficient order to visit each postcode cluster, then sorts house numbers within each street for a natural walking sequence.',
      },
      {
        type: 'steps',
        heading: 'Building a Route',
        steps: [
          'Click "Route Optimiser" in the Maps & Routes section of the sidebar.',
          'Use the Turf Zone filter to narrow down to a specific area.',
          'Select individual contacts or click "Select All" to include the whole zone.',
          'Click "Generate Route".',
          'The system looks up each unique postcode via postcodes.io (free UK service) — typically takes a few seconds.',
          'The optimised route appears on the map and in the visit order panel.',
        ],
      },
      {
        type: 'list',
        heading: 'How the optimisation works',
        items: [
          'Contacts are grouped by full postcode (e.g. M29 8AB)',
          'Postcodes are ordered using a nearest-neighbour algorithm to minimise walking distance',
          'Within each postcode, contacts are sorted by house number for natural street-walking order',
          'The map shows the route connecting all stops in sequence',
          'Contacts without a postcode are flagged and excluded — make sure postcodes are imported correctly',
        ],
      },
      {
        type: 'steps',
        heading: 'Using a Route',
        steps: [
          'From the Visit Order panel (right side), click "Field Mode" to start door-knocking in route order on your phone.',
          'Click "Print Turf Sheet" to generate a printable sheet with the contacts in route sequence.',
          'Click "Export CSV" to download the route as a spreadsheet.',
          'Click "Leaflet Tracker" (if a turf zone is selected) to open the street tracking view for that zone.',
        ],
      },
      {
        type: 'warning',
        text: 'Contacts must have a postcode to be included in the route. If many contacts are showing as "No postcode", re-import the voter list file — the importer now automatically extracts postcodes from the electoral register spreadsheet.',
      },
      {
        type: 'tip',
        text: 'Using the Route Optimiser before each canvassing session can meaningfully increase the number of doors covered per hour — especially in areas with streets running in different directions.',
      },
    ],
  },
  {
    id: 'events',
    icon: Calendar,
    title: 'Events & Shifts',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    content: [
      {
        type: 'intro',
        text: 'Create and manage campaign events — canvassing days, hustings, fundraisers, and team meetings. The Shift Management section handles structured volunteer sessions with sign-ups.',
      },
      {
        type: 'steps',
        heading: 'Creating an Event',
        steps: [
          'Click "Events" in the sidebar.',
          'Click "Add Event".',
          'Set the title, type, date, time, location, and description.',
          'Invite volunteers by email.',
          'Track RSVPs and send reminders.',
        ],
      },
      {
        type: 'steps',
        heading: 'Managing Canvassing Shifts',
        steps: [
          'Click "Shift Management" in the sidebar.',
          'Create a shift with a date, time, meeting location, and capacity.',
          'Volunteers sign up and are tracked.',
          'Assign specific streets or turfs to each volunteer on the day.',
        ],
      },
    ],
  },
  {
    id: 'outreach',
    icon: Send,
    title: 'Outreach & Comms',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    content: [
      {
        type: 'intro',
        text: 'Send bulk emails to contacts, automate follow-up sequences, and manage social media content — all from within the app.',
      },
      {
        type: 'steps',
        heading: 'Sending a Bulk Email',
        steps: [
          'Click "Bulk Outreach" in the sidebar.',
          'Choose your audience — filter by support level, tag, or postcode.',
          'Write your message and subject line.',
          'Preview before sending.',
          'Click Send.',
        ],
      },
      {
        type: 'steps',
        heading: 'Outreach Automation',
        steps: [
          'Click "Outreach Automation" in the sidebar.',
          'Create a sequence triggered by a specific event (e.g. new contact added, support level changed).',
          'Add messages with time delays between them.',
          'Activate the sequence — it runs automatically.',
        ],
      },
    ],
  },
  {
    id: 'reports',
    icon: BarChart3,
    title: 'Reports',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    content: [
      {
        type: 'intro',
        text: 'The Reports section provides detailed analytics on canvassing coverage, support levels, interaction trends, and volunteer activity.',
      },
      {
        type: 'list',
        heading: 'Available Reports',
        items: [
          'Canvassing progress by area and street',
          'Support level breakdown across the ward',
          'Interaction outcomes over time',
          'Volunteer activity summary',
          'Leaflet round completion rates',
          'Issues most frequently raised by residents',
        ],
      },
      {
        type: 'tip',
        text: 'Use the 7-day trend chart to see whether campaign momentum is building — and share it with volunteers to keep morale high.',
      },
    ],
  },
  {
    id: 'voter-import',
    icon: FileSpreadsheet,
    title: 'Voter List Import',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    content: [
      {
        type: 'intro',
        text: 'The Voter List Importer is designed specifically for the Tyldesley & Mosley Common electoral register spreadsheet (XLSX format). It automatically extracts addresses, postcodes, and turf zone tags from each sheet.',
      },
      {
        type: 'steps',
        heading: 'Importing the Electoral Register',
        steps: [
          'Click "Voter Import" in the Admin section of the sidebar.',
          'Drag and drop the XLSX electoral register file into the upload zone.',
          'Choose the voter type: Postal Voters or Registered (Non-Postal).',
          'A preview shows how many addresses are on each sheet and which turf zone they belong to.',
          'Click "Import" — records are saved in batches with a progress bar.',
          'When complete, a success screen confirms how many contacts were saved.',
        ],
      },
      {
        type: 'list',
        heading: 'What is automatically extracted',
        items: [
          'Address (full street address from column 2 of the spreadsheet)',
          'Postcode — scanned from dedicated postcode columns (cols 2–5) or extracted from the address string using a UK postcode pattern',
          'Turf zone tag — derived from the sheet name (e.g. "TYL 1 - 835" → tag "TYL1")',
          'Postal Voter tag — added automatically if you select "Postal Voters" at import time',
          'Registered voter flag — set to true for all electoral register imports',
        ],
      },
      {
        type: 'warning',
        text: 'Postcodes are essential for the Route Optimiser. If contacts are missing postcodes after import, check the spreadsheet has a postcode column or that postcodes are included within the address text.',
      },
      {
        type: 'steps',
        heading: 'Importing Generic Data (CSV/Excel/JSON)',
        steps: [
          'Click "Import Data" in the Admin section.',
          'Drag and drop your file (CSV, Excel, JSON, PDF, or Word).',
          'The AI detects field structure and suggests column mappings.',
          'Review and adjust the mapping if needed.',
          'Validation runs automatically — review any flagged records.',
          'Confirm and import. The import log is saved for rollback if needed.',
        ],
      },
    ],
  },
  {
    id: 'gdpr',
    icon: ShieldCheck,
    title: 'GDPR Compliance',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    content: [
      {
        type: 'intro',
        text: 'The GDPR Compliance module helps you meet your legal obligations under UK GDPR — managing consent records, handling right-to-be-forgotten requests, and applying data retention policies.',
      },
      {
        type: 'list',
        heading: 'What GDPR Compliance covers',
        items: [
          'Consent Log — view which contacts have given consent, when, and by what method',
          'Right to Be Forgotten — process deletion requests from contacts',
          'Data Retention — identify and clean up contacts whose data is past its retention period',
          'Consent methods tracked: door knock, phone, email, online form, electoral roll, unknown',
        ],
      },
      {
        type: 'steps',
        heading: 'Processing a Right to Be Forgotten Request',
        steps: [
          'Click "GDPR Compliance" in the sidebar.',
          'Go to the "Right to Be Forgotten" tab.',
          'Search for the contact by name or email.',
          'Click "Request Deletion".',
          'The contact is flagged with deletion_requested = true and a date is recorded.',
          'An admin can then confirm and permanently delete the record.',
        ],
      },
      {
        type: 'steps',
        heading: 'Reviewing the Consent Log',
        steps: [
          'Click "GDPR Compliance" → "Consent Log" tab.',
          'Filter by consent method or date range.',
          'Contacts obtained via the electoral roll are automatically recorded.',
          'For door-knock contacts, consent should be recorded when adding or updating the contact.',
        ],
      },
      {
        type: 'warning',
        text: 'Under UK GDPR, you must have a lawful basis for holding each contact\'s personal data. The electoral register provides a legitimate interest basis for registered voters. For other contacts, ensure consent has been recorded.',
      },
    ],
  },
  {
    id: 'import',
    icon: Upload,
    title: 'Data Import (Generic)',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    content: [
      {
        type: 'intro',
        text: 'The generic Data Import tool accepts CSV, Excel, JSON, PDF, and Word files and uses AI to automatically detect and map fields to the Contact database.',
      },
      {
        type: 'steps',
        heading: 'Importing a Contact List',
        steps: [
          'Click "Import Data" in the Admin section.',
          'Drag and drop your file into the upload zone.',
          'The AI detects the field structure and suggests column mappings.',
          'Review and adjust the mapping if needed.',
          'Validation runs automatically — review any flagged records.',
          'Confirm and import.',
          'The import log is saved so you can roll back if needed.',
        ],
      },
      {
        type: 'tip',
        text: 'For the official electoral register file, use "Voter Import" instead — it has a dedicated parser that correctly handles the multi-sheet turf zone format and extracts postcodes automatically.',
      },
      {
        type: 'warning',
        text: 'Always review the validation report before confirming an import — duplicate addresses or missing postcodes will be flagged for your attention.',
      },
    ],
  },
  {
    id: 'organiser',
    icon: UserCog,
    title: 'Organiser Dashboard',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    content: [
      {
        type: 'intro',
        text: 'The Organiser Dashboard gives campaign managers a bird\'s-eye view of volunteer performance, canvassing coverage gaps, and overall campaign health.',
      },
      {
        type: 'list',
        heading: 'What the Organiser Dashboard shows',
        items: [
          'Total doors knocked this week vs target',
          'Volunteer activity — who has been out and when',
          'Canvassing coverage heatmap — streets with no contact highlighted',
          'Support level distribution across the ward',
          'Recent session logs from all volunteers',
          'Turfs completed, in progress, and not started',
        ],
      },
      {
        type: 'steps',
        heading: 'Using the coverage map',
        steps: [
          'Click "Organiser Dashboard" in the sidebar.',
          'The map shows all turfs colour-coded by completion status.',
          'Click any turf to see which volunteer is assigned and their progress.',
          'Use this to identify gaps and reassign or add resource before polling day.',
        ],
      },
      {
        type: 'tip',
        text: 'Review the Organiser Dashboard at the end of each canvassing day to spot unworked streets and brief the team the following morning.',
      },
    ],
  },
  {
    id: 'scripts',
    icon: ScrollText,
    title: 'Canvassing Scripts',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    content: [
      {
        type: 'intro',
        text: 'The Canvassing Scripts section provides AI-generated, editable scripts for door-knocking conversations — tailored to different voter types and key local issues.',
      },
      {
        type: 'steps',
        heading: 'Using a Script',
        steps: [
          'Click "Canvassing Scripts" in the sidebar.',
          'Select a script from the list or click "Generate New Script".',
          'Choose the audience (undecided voter, known supporter, postal voter, etc.).',
          'The AI generates a conversational script referencing local issues.',
          'Scripts can be printed and handed to volunteers before a session.',
          'Field Mode can display the relevant script alongside each contact.',
        ],
      },
      {
        type: 'tip',
        text: 'Consistent, issue-led scripts make conversations more productive. Share updated scripts before each session as new local issues emerge.',
      },
    ],
  },
  {
    id: 'troubleshooting',
    icon: AlertCircle,
    title: 'Troubleshooting',
    color: 'text-red-600',
    bg: 'bg-red-50',
    content: [
      {
        type: 'intro',
        text: 'Solutions to the most common issues volunteers and organisers encounter.',
      },
      {
        type: 'faq',
        items: [
          {
            q: 'Field Mode shows "Offline" and won\'t sync',
            a: 'Check your internet connection. Wait a moment, then try clicking "Sync Now". Interactions logged offline are saved locally and will sync automatically when connection returns — no data is lost.',
          },
          {
            q: 'A contact isn\'t appearing in search',
            a: 'Try searching by a different field (name vs address vs postcode). Check the spelling. Refresh the page (Ctrl+R / Cmd+R) and try again.',
          },
          {
            q: 'Location services aren\'t working on my phone',
            a: 'Go to your phone Settings > Location and make sure location services are enabled. When the app asks for permission, choose "Allow". Then refresh Field Mode.',
          },
          {
            q: 'The map boundary looks wrong after a DOCX import',
            a: 'The boundary is generated from the map image embedded in the DOCX file. If the boundary is off, you can manually redraw it in Turf Management by selecting the turf and using the drawing tool.',
          },
          {
            q: 'Can\'t log in',
            a: 'Check caps lock is off and your email address is correct. Ask your campaign administrator to resend your invite if you\'ve not logged in before.',
          },
          {
            q: 'Data looks wrong after an import',
            a: 'Go to the import log in Data Import and use the rollback option to undo the import. Then correct your source file and re-import.',
          },
          {
            q: 'Route Optimiser says many contacts have no postcode',
            a: 'The voter list was likely imported before postcode extraction was added. Re-import the electoral register file using the Voter Import page — the importer now automatically detects and saves postcodes from the spreadsheet.',
          },
          {
            q: 'Safety Briefing form won\'t let me proceed to print',
            a: 'All mandatory fields must be completed: volunteer name, emergency contact name, emergency contact phone, and both confirmation checkboxes (lone worker safety + GDPR). Check for any fields highlighted in red.',
          },
          {
            q: 'Printed sheet has no cover page',
            a: 'The cover page only appears when you go through the Safety Briefing form before printing. If you printed directly from the browser, use the in-app "Print Sheet" button instead.',
          },
          {
            q: 'Route Optimiser contacts are still in the wrong area',
            a: 'Make sure you\'ve filtered by a specific Turf Zone before selecting contacts. If contacts have incorrect postcodes in the database, edit them individually in Voter Contacts.',
          },
        ],
      },
    ],
  },
];

// ─── Renderers ─────────────────────────────────────────────────────────────────

function ContentBlock({ block }) {
  switch (block.type) {
    case 'intro':
      return <p className="text-muted-foreground leading-relaxed">{block.text}</p>;

    case 'steps':
      return (
        <div>
          {block.heading && <h4 className="font-semibold text-sm mb-3">{block.heading}</h4>}
          <ol className="space-y-2">
            {block.steps.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <span className="text-foreground/80 leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      );

    case 'list':
      return (
        <div>
          {block.heading && <h4 className="font-semibold text-sm mb-3">{block.heading}</h4>}
          <ul className="space-y-2">
            {block.items.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground/80">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      );

    case 'tip':
      return (
        <div className="flex gap-3 bg-primary/8 border border-primary/20 rounded-xl p-4">
          <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/80 leading-relaxed">{block.text}</p>
        </div>
      );

    case 'warning':
      return (
        <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/80 leading-relaxed">{block.text}</p>
        </div>
      );

    case 'faq':
      return (
        <div className="space-y-4">
          {block.items.map((item, i) => (
            <div key={i} className="border border-border/60 rounded-xl p-4 space-y-1.5">
              <p className="font-semibold text-sm">{item.q}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function UserManual() {
  const [activeId, setActiveId] = useState('getting-started');
  const [search, setSearch] = useState('');

  const filteredSections = search.trim()
    ? SECTIONS.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.content.some(b =>
          JSON.stringify(b).toLowerCase().includes(search.toLowerCase())
        )
      )
    : SECTIONS;

  const activeSection = SECTIONS.find(s => s.id === activeId);

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden">
      {/* Sidebar nav */}
      <aside className="w-64 flex-shrink-0 border-r border-border/60 bg-muted/30 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border/60">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="font-heading font-bold text-base">User Manual</h2>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search manual..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {(search ? filteredSections : SECTIONS).map(({ id, icon: Icon, title, color }) => (
            <button
              key={id}
              onClick={() => { setActiveId(id); setSearch(''); }}
              className={cn(
                'w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors text-left',
                activeId === id
                  ? 'bg-primary/10 text-primary border-r-2 border-primary'
                  : 'text-foreground/70 hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', activeId === id ? 'text-primary' : 'text-muted-foreground')} />
              {title}
              {activeId === id && <ChevronRight className="w-3 h-3 ml-auto text-primary" />}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {search && filteredSections.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
            <Search className="w-10 h-10 opacity-30" />
            <p>No results for "{search}"</p>
          </div>
        ) : search ? (
          <div className="p-8 max-w-3xl space-y-10">
            {filteredSections.map(section => (
              <div key={section.id}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', section.bg)}>
                    <section.icon className={cn('w-5 h-5', section.color)} />
                  </div>
                  <h2 className="font-heading text-xl font-bold">{section.title}</h2>
                </div>
                <div className="space-y-5">
                  {section.content.map((block, i) => <ContentBlock key={i} block={block} />)}
                </div>
              </div>
            ))}
          </div>
        ) : activeSection ? (
          <div className="p-8 max-w-3xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/60">
              <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center', activeSection.bg)}>
                <activeSection.icon className={cn('w-7 h-7', activeSection.color)} />
              </div>
              <div>
                <h1 className="font-heading text-3xl font-bold">{activeSection.title}</h1>
                <p className="text-muted-foreground text-sm mt-0.5">Campaign App User Manual</p>
              </div>
            </div>

            {/* Content blocks */}
            <div className="space-y-7">
              {activeSection.content.map((block, i) => (
                <ContentBlock key={i} block={block} />
              ))}
            </div>

            {/* Navigation footer */}
            <div className="flex justify-between mt-12 pt-6 border-t border-border/60">
              {(() => {
                const idx = SECTIONS.findIndex(s => s.id === activeId);
                const prev = SECTIONS[idx - 1];
                const next = SECTIONS[idx + 1];
                return (
                  <>
                    {prev ? (
                      <button onClick={() => setActiveId(prev.id)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronRight className="w-4 h-4 rotate-180" /> {prev.title}
                      </button>
                    ) : <span />}
                    {next && (
                      <button onClick={() => setActiveId(next.id)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto">
                        {next.title} <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}