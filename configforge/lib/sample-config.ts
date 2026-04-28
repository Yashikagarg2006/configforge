import { AppConfigSchema } from "@/types/config";

export const SAMPLE_CONFIG: AppConfigSchema = {
  appName: "Student Manager",
  auth: { enabled: true },
  i18n: {
    default: "en",
    languages: ["en", "hi"],
    translations: {
      en: {
        students: "Students",
        add_student: "Add Student",
        name: "Name",
        email: "Email",
        marks: "Marks",
        submit: "Submit",
        dashboard: "Dashboard",
        csv_import: "CSV Import",
        notifications: "Notifications",
      },
      hi: {
        students: "विद्यार्थी",
        add_student: "विद्यार्थी जोड़ें",
        name: "नाम",
        email: "ईमेल",
        marks: "अंक",
        submit: "जमा करें",
        dashboard: "डैशबोर्ड",
        csv_import: "CSV आयात",
        notifications: "सूचनाएं",
      },
    },
  },
  database: {
    tables: {
      students: {
        userScoped: true,
        fields: {
          name: { type: "string", required: true, label: "name" },
          email: { type: "email", required: true, label: "email" },
          marks: { type: "number", required: false, label: "marks" },
        },
      },
    },
  },
  pages: [
    {
      route: "/students",
      title: "students",
      components: [
        { type: "heading", text: "students" },
        { type: "form", title: "add_student", table: "students", fields: ["name", "email", "marks"] },
        { type: "table", table: "students", columns: ["name", "email", "marks"] },
      ],
    },
    {
      route: "/overview",
      title: "dashboard",
      components: [
        { type: "heading", text: "dashboard" },
        { type: "dashboard", tables: ["students"] },
      ],
    },
  ],
  apis: [{ resource: "students", actions: ["create", "read", "update", "delete"] }],
  notifications: [
    { event: "students.create", message: "Student added successfully", type: "both" },
    { event: "students.update", message: "Student updated", type: "both" },
    { event: "students.delete", message: "Student deleted", type: "both" },
    { event: "students.import", message: "CSV imported successfully", type: "both" },
  ],
};
