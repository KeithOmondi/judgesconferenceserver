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
              facilitator: "Secretariat",
            },
          ],
        },
        {
          day: "TWO",
          date: new Date("2026-03-23"),
          session_chairs: [
            "MR. DUNCAN OKELLO",
            "JUSTICE ALFRED MABEYA FCI Arb, EBS",
            "LADY JUSTICE PATRICIA NYAUNDI SC",
          ],
          activities: [
            { time: "8.00-8.30AM", activity: "Registration of participants", facilitator: "Secretariat" },
            { time: "8.30-9.00AM", activity: "National Anthem, EAC Anthem, and Prayer", facilitator: "Session chair & Justice James Wakiaga" },
            { 
              time: "9.00-10.30AM", 
              activity: "Remarks: Chairperson FIDA-Kenya, Principal Judge of High Court, and DG Kenya Judiciary Academy", 
              facilitator: "Ms. Christine Kungu, Justice Eric Ogola (EBS), Justice (Dr.) Smokin Wanjala (SCJ, CBS)" 
            },
            { 
              time: "10.30-11.00AM", 
              activity: "KEY NOTE ADDRESS AND OFFICIAL OPENING", 
              facilitator: "Lady Justice Philomena Mbete Mwilu, EGH (DCJ & VP Supreme Court)" 
            },
            { time: "11.00-11.30AM", activity: "PHOTO SESSION AND HEALTH BREAK" },
            { 
              time: "11.30-12.30PM", 
              activity: "The Legal Framework for the Protection of Women and Children: Constitutional Guarantees and Emerging Jurisprudence", 
              facilitator: "Ms. Leah Kiguatha" 
            },
            { time: "12.30-1.00PM", activity: "Plenary session" },
            { time: "1.00-2.00PM", activity: "LUNCH BREAK" },
            { 
              time: "2.00-3.30 PM", 
              activity: "Panel discussion: Advancing Child Protection: Promoting Effective Access to Justice for Children", 
              facilitator: "Lady Justice Teresia Matheka, Lady Justice Constance Mocumie, Justice Hilary Chemitei, Dr. Florence Mueni, Ms. Jedidah Waruhiu SC, Ms. Judy Oduor" 
            },
            { time: "3.30-4.00PM", activity: "Plenary session" },
            { time: "4.00PM", activity: "TEA BREAK AND END OF DAY TWO" },
          ],
        },
        {
          day: "THREE",
          date: new Date("2026-03-24"),
          session_chairs: ["LADY JUSTICE EMILY OMINDE", "JUSTICE CHARLES KARIUKI", "LADY JUSTICE ROSELINE KORIR"],
          activities: [
            { time: "8.30-9.00AM", activity: "Registration of participants", facilitator: "Secretariat" },
            { 
              time: "9.00-10.00AM", 
              activity: "From Report to Action: Assessing the GBV Taskforce Recommendations and the Unfinished Agenda in Ending SGBV", 
              facilitator: "Lady Justice (Rtd.) Dr. Nancy Baraza, PhD, OGW" 
            },
            { time: "10.00-10.30AM", activity: "Plenary session" },
            { time: "10.30-11.00AM", activity: "TEA BREAK" },
            { 
              time: "11.00-12.30PM", 
              activity: "Contemporary trends in addressing SGBV in Kenya: Lessons from IJM Kenya VAWC project", 
              facilitator: "Mr. Aggrey Juma & Mr. Vincent Chahale" 
            },
            { time: "12.30-1.00PM", activity: "Plenary Session" },
            { time: "1.00-2.00PM", activity: "LUNCH BREAK" },
            { 
              time: "2.00-3.30PM", 
              activity: "Legal Protection for Refugees and Stateless Persons / Dying in Plain Sight: Social Media, Mental Health and Adolescent Protection", 
              facilitator: "Ms. Catherine Njoroge, Mr. Mohamed Ahmed, Ms. Meghan Mukuria" 
            },
            { time: "3.30-4.00PM", activity: "Plenary session" },
            { time: "4.00PM", activity: "TEA BREAK AND END OF DAY THREE" },
          ],
        },
        {
          day: "FOUR",
          date: new Date("2026-03-25"),
          session_chairs: ["LADY JUSTICE HELENE NAMISI", "LADY JUSTICE MARGARET MUIGAI", "JUSTICE ANTHONY NDUNG'U"],
          activities: [
            { time: "8.30-9.00AM", activity: "Registration of participants", facilitator: "Secretariat" },
            { time: "9.00-10.00AM", activity: "Reading the Numbers: Performance Trends and Lessons for the High Court", facilitator: "Dr. Joseph Osewe" },
            { time: "10.00-10.30AM", activity: "Plenary session" },
            { time: "10.30-11.00AM", activity: "TEA BREAK" },
            { 
              time: "11.00-12.30PM", 
              activity: "Judiciary Psychosocial & Alcohol Policies / Disciplinary Processes / Flexible Working Arrangements (FWA) Policy", 
              facilitator: "Ms. Faith Kosgey, Dr. Elizabeth Kalei, Lady Justice Christine Baari" 
            },
            { time: "12.30-1.00PM", activity: "Plenary session" },
            { time: "1.00-2.00PM", activity: "LUNCH BREAK" },
            { 
              time: "2.00-3.00PM", 
              activity: "Understanding the Judges Retirement Benefits Act: Key Provisions and Implications", 
              facilitator: "Justice William Ouko, SCJ, CBS" 
            },
            { 
              time: "3.00-4.00PM", 
              activity: "Reassessing our impact; Judicial Reflection and Strategic Reorientation (Closed door session)", 
              facilitator: "Justice Eric Ogola, EBS" 
            },
            { time: "4.00PM", activity: "TEA BREAK" },
            { time: "4.00-5.00PM", activity: "CSR Activity", facilitator: "Hon. Elizabeth Kemei" },
            { time: "6.00-9.00PM", activity: "Gala Dinner", facilitator: "Mr. Duncan Okello" },
          ],
        },
        {
          day: "FIVE",
          date: new Date("2026-03-26"),
          session_chairs: ["JUSTICE MOSES ADO", "LADY JUSTICE NJOKI MWANGI", "MR. DUNCAN OKELLO"],
          activities: [
            { time: "8.30-9.00AM", activity: "Registration of participants", facilitator: "Secretariat" },
            { time: "9.00-10.00AM", activity: "Design Thinking for Judicial Leaders", facilitator: "Prof. Ludeki Chweya" },
            { time: "10.00-10.30AM", activity: "Plenary session" },
            { time: "10.30-11.00AM", activity: "TEA BREAK" },
            { 
              time: "11.00-12.30PM", 
              activity: "Executive Presence on the Bench and Beyond: Leading with Authority, Gravitas and Intentional Impact", 
              facilitator: "Dr. Enosh Bolo, ChMC, FCIMS" 
            },
            { time: "12.30-1.00PM", activity: "Plenary session" },
            { time: "1.00-2.00PM", activity: "LUNCH BREAK" },
            { time: "2.00-2.30PM", activity: "Closing Remarks", facilitator: "Justice Eric Ogola, EBS" },
            { 
              time: "2.30-3.00PM", 
              activity: "ADDRESS AND OFFICIAL CLOSING", 
              facilitator: "H.E Susan Kihika, Governor Nakuru County" 
            },
            { time: "3.00PM", activity: "TEA BREAK" },
          ],
        },
        {
          day: "SIX",
          date: new Date("2026-03-27"),
          activities: [
            { time: "10.00AM", activity: "Checkout", facilitator: "Secretariat" },
          ],
        },
      ],
    };

    await Program.deleteMany({});
    await Program.create(programData);

    console.log("✅ Program Seeding complete.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedProgram();