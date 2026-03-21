import mongoose from "mongoose";
import { env } from "./config/env";
import { Program } from "./models/program.model";

const seedProgram = async () => {
  try {
    await mongoose.connect(env.MONGO_URI as string);
    console.log("✅ Connected to DB for Program Seeding...");

    const programData = {
      event_title: "PROGRAMME",
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
            { time: "8.30-9.00AM", activity: "National Anthem, EAC Anthem, Prayer", facilitator: "Session chair, Justice James Wakiaga" },
            { time: "9.00-10.30AM", activity: "Remarks from Chairperson FIDA-Kenya, Principal Judge, and DG KJA", facilitator: "Ms. Christine Kungu, Mr Justice Eric Ogola, Justice (Dr.) Smokin Wanjala" },
            { time: "10.30-11.00AM", activity: "Key note address and official opening", facilitator: "Lady Justice Philomena Mbete Mwilu" },
            { time: "11.00-11.30AM", activity: "PHOTO SESSION AND HEALTH BREAK" },
            { time: "11.30-12.30PM", activity: "The Legal Framework for the Protection of Women and Children", facilitator: "Ms. Leah Kiguatha" },
            { time: "2.00-3.30 PM", activity: "Panel discussion: Advancing Child Protection", facilitator: "Lady Justice Teresia Matheka, Lady Justice Constance Mocumie, Justice Hilary Chemitei, Dr. Florence Mueni, Ms. Jedidah Waruhiu SC, Ms. Judy Oduor" },
            { time: "4.00PM", activity: "TEA BREAK AND END OF DAY TWO" },
          ],
        },
        {
          day: "THREE",
          date: new Date("2026-03-24"),
          session_chairs: ["LADY JUSTICE EMILY OMINDE", "JUSTICE CHARLES KARIUKI", "LADY JUSTICE ROSELINE KORIR"],
          activities: [
            { time: "9.00-10.00AM", activity: "Assessing the GBV Taskforce Recommendations", facilitator: "Lady Justice (Rtd.) Dr. Nancy Baraza" },
            { time: "11.00-12.30PM", activity: "Contemporary trends in addressing SGBV: Lessons from IJM Kenya", facilitator: "Mr. Aggrey Juma, Mr. Vincent Chahale" },
            { time: "2.00-3.30PM", activity: "Legal Protection for Refugees and Stateless Persons / Technology Induced Psychological Harm", facilitator: "Ms. Catherine Njoroge, Mr. Mohamed Ahmed, Ms. Meghan Mukuria" },
            { time: "4.00PM", activity: "TEA BREAK AND END OF DAY THREE" },
          ],
        },
        {
          day: "FOUR",
          date: new Date("2026-03-25"),
          session_chairs: ["LADY JUSTICE HELENE NAMISI", "LADY JUSTICE MARGARET MUIGAI", "JUSTICE ANTHONY NDUNG’U"],
          activities: [
            { time: "9.00-10.00AM", activity: "Reading the Numbers: Performance Trends for the High Court", facilitator: "Dr Joseph Osewe" },
            { time: "11.00-12.30PM", activity: "Judiciary Policies (Psychosocial, Alcohol/Substance, Accountability, FWA)", facilitator: "Ms Faith Kosgey, Dr. Elizabeth Kalei, Lady Justice Christine Baari" },
            { time: "2.00-3.00PM", activity: "Understanding the Judges Retirement Benefits Act", facilitator: "Justice William Ouko" },
            { time: "6.00-9.00PM", activity: "Gala Dinner", facilitator: "Mr. Duncan Okello" },
          ],
        },
        {
          day: "FIVE",
          date: new Date("2026-03-26"),
          session_chairs: ["JUSTICE MOSES ADO", "LADY JUSTICE NJOKI MWANGI", "MR. DUNCAN OKELLO"],
          activities: [
            { time: "9.00-10.00AM", activity: "Design Thinking for Judicial Leaders", facilitator: "Prof. Ludeki Chweya" },
            { time: "11.00-12.30PM", activity: "Executive Presence on the Bench and Beyond", facilitator: "Dr. Enosh Bolo" },
            { time: "2.30-3.00PM", activity: "Address by H.E Susan Kihika", facilitator: "Governor Nakuru County" },
          ],
        },
        {
          day: "SIX",
          date: new Date("2026-03-27"),
          activities: [
            { time: "10.00AM", activity: "Check-out", facilitator: "Secretariat" },
          ],
        },
      ],
    };

    // Remove existing program to prevent duplicates if necessary, or use findOneAndUpdate
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