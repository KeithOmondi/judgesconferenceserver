import mongoose from "mongoose";
import { env } from "./config/env";
import { Program } from "./models/program.model";

const seedProgram = async () => {
  try {
    await mongoose.connect(env.MONGO_URI as string);
    console.log("✅ Connected to DB for Program Seeding...");

    const programData = {
      event_title: "HIGH COURT LEADERS 2026 CONFERENCE",
      theme: "Protecting Vulnerable Women and Children: Strengthening Judicial Intervention for Access to Justice",
      schedule: [
        {
          day: "ONE",
          date: new Date("2026-03-22"),
          activities: [
            { 
              time: "2.00PM", 
              activity: "Travel & Check-in", 
              facilitator: "Secretariat" 
            },
          ],
        },
        {
          day: "TWO",
          date: new Date("2026-03-23"),
          session_chairs: [
            "MR. DUNCAN OKELLO",
            "JUSTICE ALFRED MABEYA FCI Arb, EBS",
            "LADY JUSTICE PATRICIA NYAUNDI SC"
          ],
          activities: [
            { 
              time: "8.00-8.30AM", 
              activity: "Registration of participants", 
              facilitator: "Secretariat",
              session_chair: "MR. DUNCAN OKELLO" 
            },
            { 
              time: "8.30-9.00AM", 
              activity: "National Anthem, EAC Anthem, Prayer", 
              facilitator: "Justice James Wakiaga",
              session_chair: "MR. DUNCAN OKELLO" 
            },
            {
              time: "9.00-10.30AM",
              activity: "Remarks: Chairperson FIDA-Kenya, Principal Judge of High Court, and DG Kenya Judiciary Academy",
              facilitator: "Ms. Christine Kungu\nJustice Eric Ogola, EBS\nJustice (Dr.) Smokin Wanjala, PhD, SCJ, CBS",
              session_chair: "MR. DUNCAN OKELLO"
            },
            {
              time: "10.30-11.00AM",
              activity: "KEY NOTE ADDRESS AND OFFICIAL OPENING BY THE CHIEF GUEST",
              facilitator: "LADY JUSTICE PHILOMENA MBETE MWILU, EGH, Deputy Chief Justice and Vice President of the Supreme Court of Kenya",
              session_chair: "MR. DUNCAN OKELLO"
            },
            { 
              time: "11.00-11.30AM", 
              activity: "PHOTO SESSION AND HEALTH BREAK" 
            },
            {
              time: "11.30-12.30PM",
              activity: "The Legal Framework for the Protection of Women and Children: Constitutional Guarantees, Statutory Safeguards, International Obligations, and Emerging Jurisprudence",
              facilitator: "Ms. Leah Kiguatha",
              session_chair: "JUSTICE ALFRED MABEYA FCI Arb, EBS"
            },
            { 
              time: "12.30-1.00PM", 
              activity: "Plenary session",
              session_chair: "JUSTICE ALFRED MABEYA FCI Arb, EBS"
            },
            { 
              time: "1.00-2.00PM", 
              activity: "LUNCH BREAK" 
            },
            {
              time: "2.00-3.30 PM",
              activity: "Panel discussion: Advancing Child Protection: Promoting Effective Access to Justice for Children",
              facilitator: "Lady Justice Teresia Matheka (Lead Presenter)\nLady Justice Constance Mocumie\nJustice Hilary Chemitei\nDr. Florence Mueni\nMs. Jedidah Waruhiu SC\nMs. Judy Oduor",
              session_chair: "LADY JUSTICE PATRICIA NYAUNDI SC"
            },
            { 
              time: "3.30-4.00PM", 
              activity: "Plenary session",
              session_chair: "LADY JUSTICE PATRICIA NYAUNDI SC"
            },
            { 
              time: "4.00PM", 
              activity: "TEA BREAK AND END OF DAY TWO" 
            },
          ],
        },
        {
          day: "THREE",
          date: new Date("2026-03-24"),
          session_chairs: ["LADY JUSTICE EMILY OMINDE", "JUSTICE CHARLES KARIUKI", "LADY JUSTICE ROSELINE KORIR"],
          activities: [
            { 
              time: "8.30-9.00AM", 
              activity: "Registration of participants", 
              facilitator: "Secretariat",
              session_chair: "LADY JUSTICE EMILY OMINDE"
            },
            {
              time: "9.00-10.00AM",
              activity: "From Report to Action: Assessing the GBV Taskforce Recommendations and the Unfinished Agenda in Ending SGBV",
              facilitator: "Lady Justice (Rtd.) Dr. Nancy Baraza, PhD, OGW",
              session_chair: "LADY JUSTICE EMILY OMINDE"
            },
            { 
              time: "10.00-10.30AM", 
              activity: "Plenary session",
              session_chair: "LADY JUSTICE EMILY OMINDE"
            },
            { 
              time: "10.30-11.00AM", 
              activity: "TEA BREAK" 
            },
            {
              time: "11.00-12.30PM",
              activity: "Contemporary trends in addressing SGBV in Kenya: Lessons from IJM Kenya VAWC project",
              facilitator: "Mr. Aggrey Juma\nMr. Vincent Chahale",
              session_chair: "JUSTICE CHARLES KARIUKI"
            },
            { 
              time: "12.30-1.00PM", 
              activity: "Plenary Session",
              session_chair: "JUSTICE CHARLES KARIUKI"
            },
            { 
              time: "1.00-2.00PM", 
              activity: "LUNCH BREAK" 
            },
            {
              time: "2.00-3.30PM",
              activity: "Legal Protection for Refugees and Stateless Persons / Dying in Plain Sight: Social Media, Mental Health and Adolescent Protection",
              facilitator: "Ms. Catherine Njoroge\nMr. Mohamed Ahmed\nMs. Meghan Mukuria",
              session_chair: "LADY JUSTICE ROSELINE KORIR"
            },
            { 
              time: "3.30-4.00PM", 
              activity: "Plenary session",
              session_chair: "LADY JUSTICE ROSELINE KORIR"
            },
            { 
              time: "4.00PM", 
              activity: "TEA BREAK AND END OF DAY THREE" 
            },
          ],
        },
        {
          day: "FOUR",
          date: new Date("2026-03-25"),
          session_chairs: ["LADY JUSTICE HELENE NAMISI", "LADY JUSTICE MARGARET MUIGAI", "JUSTICE ANTHONY NDUNG'U"],
          activities: [
            { 
              time: "8.30-9.00AM", 
              activity: "Registration of participants", 
              facilitator: "Secretariat",
              session_chair: "LADY JUSTICE HELENE NAMISI"
            },
            { 
              time: "9.00-10.00AM", 
              activity: "Reading the Numbers: Performance Trends and Lessons for the High Court.", 
              facilitator: "Dr. Joseph Osewe",
              session_chair: "LADY JUSTICE HELENE NAMISI"
            },
            { 
              time: "10.00-10.30AM", 
              activity: "Plenary session",
              session_chair: "LADY JUSTICE HELENE NAMISI"
            },
            { 
              time: "10.30-11.00AM", 
              activity: "TEA BREAK" 
            },
            {
              time: "11.00-12.30PM",
              activity: "Psychosocial & Substance Abuse Policy / Disciplinary Processes / Flexible Working Arrangements (FWA) Policy",
              facilitator: "Ms. Faith Kosgey\nDr. Elizabeth Kalei\nLady Justice Christine Baari",
              session_chair: "LADY JUSTICE MARGARET MUIGAI"
            },
            { 
              time: "12.30-1.00PM", 
              activity: "Plenary session",
              session_chair: "LADY JUSTICE MARGARET MUIGAI"
            },
            { 
              time: "1.00-2.00PM", 
              activity: "LUNCH BREAK" 
            },
            {
              time: "2.00-3.00PM",
              activity: "Understanding the Judges Retirement Benefits Act: Key Provisions and Implications",
              facilitator: "Justice William Ouko, SCJ, CBS",
              session_chair: "JUSTICE ANTHONY NDUNG'U"
            },
            {
              time: "3.00-4.00PM",
              activity: "Reassessing our impact; Judicial Reflection and Strategic Reorientation (Closed door session)",
              facilitator: "Justice Eric Ogola, EBS",
              session_chair: "JUSTICE ANTHONY NDUNG'U"
            },
            { 
              time: "4.00PM", 
              activity: "TEA BREAK" 
            },
            { 
              time: "4.00-5.00PM", 
              activity: "CSR Activity", 
              facilitator: "Hon. Elizabeth Kemei" 
            },
            { 
              time: "6.00-9.00PM", 
              activity: "Gala Dinner", 
              facilitator: "Mr. Duncan Okello" 
            },
          ],
        },
        {
          day: "FIVE",
          date: new Date("2026-03-26"),
          session_chairs: ["JUSTICE MOSES ADO", "LADY JUSTICE NJOKI MWANGI", "MR. DUNCAN OKELLO"],
          activities: [
            { 
              time: "8.30-9.00AM", 
              activity: "Registration of participants", 
              facilitator: "Secretariat",
              session_chair: "JUSTICE MOSES ADO"
            },
            { 
              time: "9.00-10.00AM", 
              activity: "Design Thinking for Judicial Leaders", 
              facilitator: "Prof. Ludeki Chweya",
              session_chair: "JUSTICE MOSES ADO"
            },
            { 
              time: "10.00-10.30AM", 
              activity: "Plenary session",
              session_chair: "JUSTICE MOSES ADO"
            },
            { 
              time: "10.30-11.00AM", 
              activity: "TEA BREAK" 
            },
            {
              time: "11.00-12.30PM",
              activity: "Executive Presence on the Bench and Beyond: Leading with Authority, Gravitas and Intentional Impact",
              facilitator: "Dr. Enosh Bolo, ChMC, FCIMS",
              session_chair: "LADY JUSTICE NJOKI MWANGI"
            },
            { 
              time: "12.30-1.00PM", 
              activity: "Plenary session",
              session_chair: "LADY JUSTICE NJOKI MWANGI"
            },
            { 
              time: "1.00-2.00PM", 
              activity: "LUNCH BREAK" 
            },
            { 
              time: "2.00-2.30PM", 
              activity: "Closing Remarks & Addressing the Chief Guest", 
              facilitator: "Chief Registrar Of the Judiciary - Hon. Winfridah Mokaya, CBS\nJSC Commissioner - Mr. Justice Anthony Mrima",
              session_chair: "MR. DUNCAN OKELLO"
            },
            { 
              time: "2.30-3.00PM", 
              activity: "Official Closing by H.E Susan Kihika, Governor Nakuru County", 
              facilitator: "Justice Eric Ogola, EBS",
              session_chair: "MR. DUNCAN OKELLO"
            },
            { 
              time: "3.00PM", 
              activity: "TEA BREAK" 
            },
          ],
        },
        {
          day: "SIX",
          date: new Date("2026-03-27"),
          activities: [{ 
            time: "10.00AM", 
            activity: "Checkout", 
            facilitator: "Secretariat" 
          }],
        },
      ],
    };

    await Program.deleteMany({});
    await Program.create(programData);

    console.log("✅ Full Program Seeding complete with Session Chairs.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedProgram();