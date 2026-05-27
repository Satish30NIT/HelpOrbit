/**
 * Seed sample companies. Run: node scripts/seed-companies.js
 */
const companyModel = require("../src/models/company.model");

const SAMPLE_COMPANIES = [
  {
    title: "Apex Logistics Pvt Ltd",
    email: "contact@apexlogistics.in",
    phone: "9876543210",
    description: "Nationwide freight and warehouse services.",
    is_active: true,
    address: {
      address_line_1: "12 Industrial Estate",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      pin_code: "400001",
    },
  },
  {
    title: "GreenLeaf Organics",
    email: "hello@greenleaforganics.com",
    phone: "9123456780",
    description: "Organic food distribution.",
    is_active: true,
    address: {
      address_line_1: "45 Market Road",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      pin_code: "560001",
    },
  },
  {
    title: "Sunrise Healthcare",
    email: "info@sunrisehealthcare.in",
    phone: "9988776655",
    description: "Corporate health plans and clinics.",
    is_active: true,
    address: {
      address_line_1: "88 Hospital Lane",
      city: "Hyderabad",
      state: "Telangana",
      country: "India",
      pin_code: "500032",
    },
  },
  {
    title: "Nova Tech Solutions",
    email: "support@novatech.io",
    phone: "9812345678",
    description: "IT consulting and software development.",
    is_active: true,
    address: {
      address_line_1: "Tower B, Cyber City",
      city: "Gurugram",
      state: "Haryana",
      country: "India",
      pin_code: "122002",
    },
  },
  {
    title: "Heritage Textiles",
    email: "sales@heritagetextiles.co.in",
    phone: "9765432109",
    description: "Fabric manufacturing and export.",
    is_active: true,
    address: {
      address_line_1: "23 Mill Street",
      city: "Surat",
      state: "Gujarat",
      country: "India",
      pin_code: "395003",
    },
  },
  {
    title: "BlueOcean Marine",
    email: "ops@blueoceanmarine.in",
    phone: "9654321098",
    description: "Shipping and port logistics.",
    is_active: false,
    address: {
      address_line_1: "Dockyard Road 7",
      city: "Kochi",
      state: "Kerala",
      country: "India",
      pin_code: "682001",
    },
  },
  {
    title: "Prime Education Group",
    email: "admin@primeeducation.edu",
    phone: "9543210987",
    description: "Schools and coaching centres.",
    is_active: true,
    address: {
      address_line_1: "101 Campus Drive",
      city: "Pune",
      state: "Maharashtra",
      country: "India",
      pin_code: "411001",
    },
  },
  {
    title: "Urban Build Contractors",
    email: "projects@urbanbuild.in",
    phone: "9432109876",
    description: "Commercial and residential construction.",
    is_active: true,
    address: {
      address_line_1: "5 Builder Plaza",
      city: "Noida",
      state: "Uttar Pradesh",
      country: "India",
      pin_code: "201301",
    },
  },
  {
    title: "FreshFarm Agro",
    email: "supply@freshfarmagro.com",
    phone: "9321098765",
    description: "Agricultural produce supply chain.",
    is_active: true,
    address: {
      address_line_1: "Village Road 18",
      city: "Nagpur",
      state: "Maharashtra",
      country: "India",
      pin_code: "440001",
    },
  },
  {
    title: "Silverline Finance",
    email: "clients@silverlinefinance.in",
    phone: "9210987654",
    description: "Business loans and accounting services.",
    is_active: true,
    address: {
      address_line_1: "3 Finance Tower",
      city: "Chennai",
      state: "Tamil Nadu",
      country: "India",
      pin_code: "600002",
    },
  },
  {
    title: "Skyline Hospitality",
    email: "bookings@skylinehotels.in",
    phone: "9109876543",
    description: "Hotels and event management.",
    is_active: true,
    address: {
      address_line_1: "Lake View Resort",
      city: "Udaipur",
      state: "Rajasthan",
      country: "India",
      pin_code: "313001",
    },
  },
  {
    title: "Delta Auto Parts",
    email: "orders@deltaautoparts.in",
    phone: "9098765432",
    description: "Automotive spare parts wholesale.",
    is_active: true,
    address: {
      address_line_1: "Auto Hub, Sector 12",
      city: "Indore",
      state: "Madhya Pradesh",
      country: "India",
      pin_code: "452001",
    },
  },
  {
    title: "Crystal Clean Services",
    email: "service@crystalclean.in",
    phone: "9087654321",
    description: "Facility management and sanitization.",
    is_active: true,
    address: {
      address_line_1: "9 Service Park",
      city: "Jaipur",
      state: "Rajasthan",
      country: "India",
      pin_code: "302001",
    },
  },
  {
    title: "NorthStar Retail",
    email: "retail@northstar.in",
    phone: "9076543210",
    description: "Multi-brand retail outlets.",
    is_active: false,
    address: {
      address_line_1: "Mall Wing 2, Level 4",
      city: "Kolkata",
      state: "West Bengal",
      country: "India",
      pin_code: "700001",
    },
  },
  {
    title: "Pacific Energy Systems",
    email: "energy@pacificsystems.in",
    phone: "9065432109",
    description: "Solar installation and maintenance.",
    is_active: true,
    address: {
      address_line_1: "Green Park Industrial Area",
      city: "Ahmedabad",
      state: "Gujarat",
      country: "India",
      pin_code: "380015",
    },
  },
];

async function main() {
  let created = 0;
  let skipped = 0;

  for (const c of SAMPLE_COMPANIES) {
    const exists = await companyModel.emailExists(c.email);
    if (exists) {
      console.log(`Skip (email exists): ${c.title}`);
      skipped += 1;
      continue;
    }

    const { address, ...company } = c;
    await companyModel.create(
      {
        title: company.title,
        email: company.email,
        phone: company.phone,
        description: company.description,
        isActive: company.is_active,
      },
      address
    );
    console.log(`Created: ${c.title}`);
    created += 1;
  }

  const pool = require("../src/config/db");
  const { rows } = await pool.query(
    "SELECT COUNT(*)::int AS n FROM companies WHERE is_deleted = false"
  );
  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}, Total active companies: ${rows[0].n}`);
  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
