import mongoose from "mongoose";
import { env } from "./config/env";
import { User } from "./models/user.model";

const seedUsers = async () => {
  try {
    await mongoose.connect(env.MONGO_URI as string);
    console.log("✅ Connected to DB...")

    const seedData = [
      
  {
    name: "Eric Ogola",
    email: "eric.ogola@court.go.ke",
    password: "Registrar@2026",
    pj: "55940",
    role: "judge",
    cohort: 2011,
    isVerified: true
  },
  {
    name: "Roseline C. Langat Korir",
    email: "roseline.korir@court.go.ke",
    password: "Registrar@2026",
    pj: "56001",
    role: "judge",
    isVerified: true
  },
  {
    name: "Rose Edwina Ougo",
    email: "rougo@court.go.ke",
    password: "Registrar@2026",
    pj: "14009",
    role: "judge",
    isVerified: true
  },
  {
    name: "David Kipyegomen Kemei",
    email: "dkemei@court.go.ke",
    password: "Registrar@2026",
    pj: "33095",
    role: "judge",
    isVerified: true
  },
  {
    name: "William Musya Musyoka",
    email: "william.musyoka@court.go.ke",
    password: "Registrar@2026",
    pj: "59326",
    role: "judge",
    isVerified: true
  },
  {
    name: "Lucy Gitari",
    email: "lucy.gitari@court.go.ke",
    password: "Registrar@2026",
    pj: "12926",
    role: "judge",
    isVerified: true
  },
  {
    name: "Reuben Nyakundi",
    email: "rnyakundi@court.go.ke",
    password: "Registrar@2026",
    pj: "14978",
    role: "judge",
    isVerified: true
  },
  {
    name: "John.R Wananda Anundo",
    email: "wananda.john@court.go.ke",
    password: "Registrar@2026",
    pj: "81735",
    role: "judge",
    isVerified: true
  },
  {
    name: "Emily Ominde",
    email: "emily.ominde@court.go.ke",
    password: "Registrar@2026",
    pj: "19871",
    role: "judge",
    isVerified: true
  },
  {
    name: "John Onyiego",
    email: "john.onyiego@court.go.ke",
    password: "Registrar@2026",
    pj: "20424",
    role: "judge",
    isVerified: true
  },
  {
    name: "Kiarie Waweru Kiarie",
    email: "wkiarie@court.go.ke",
    password: "Registrar@2026",
    pj: "14960",
    role: "judge",
    isVerified: true
  },
 
  {
    name: "Stella Mutuku",
    email: "stella.mutuku@court.go.ke",
    password: "Registrar@2026",
    pj: "16425",
    role: "judge",
    isVerified: true
  },
  {
    name: "John Lolwalan Tamar",
    email: "john.tamar@court.go.ke",
    password: "Registrar@2026",
    pj: "20775",
    role: "judge",
    isVerified: true
  },
  {
    name: "Sophie Chebet Chirchir",
    email: "sophie.chirchir@court.go.ke",
    password: "Registrar@2026",
    pj: "81734",
    role: "judge",
    isVerified: true
  },
  {
    name: "Alice Chepngetich Bett",
    email: "alice.soi@court.go.ke",
    password: "Registrar@2026",
    pj: "82774",
    role: "judge",
    isVerified: true
  },
  {
    name: "Stephen Mbungi",
    email: "smbungi@court.go.ke",
    password: "Registrar@2026",
    pj: "21755",
    role: "judge",
    isVerified: true
  },
  {
    name: "Roseline P.V Wendoh",
    email: "rwendoh@court.go.ke",
    password: "Registrar@2026",
    pj: "10885",
    cohort: 2009,
    role: "judge",
    isVerified: true
  },
  {
    name: "Joseph Raphael Karanja",
    email: "joseph.karanja@court.go.ke",
    password: "Registrar@2026",
    pj: "10916",
    cohort: 2009,
    role: "judge",
    isVerified: true
  },
  
  {
    name: "Joseph Sergon",
    email: "joseph.sergon@court.go.ke",
    password: "Registrar@2026",
    pj: "38841",
    role: "judge",
    isVerified: true
  },
  {
    name: "Richard Mwongo",
    email: "rmwongo@court.go.ke",
    password: "Registrar@2026",
    pj: "55990",
    role: "judge",
    isVerified: true
  },
  {
    name: "Abigail Mshila",
    email: "amshila@court.go.ke",
    password: "Registrar@2026",
    pj: "56027",
    role: "judge",
    isVerified: true
  },
  {
    name: "Dorah Chepkwony",
    email: "dorah.chepkwony@court.go.ke",
    password: "Registrar@2026",
    pj: "19732",
    role: "judge",
    isVerified: true
  },
  {
    name: "Diana Rachel Kavedza",
    email: "diana.kavedza@court.go.ke",
    password: "Registrar@2026",
    pj: "20660",
    role: "judge",
    isVerified: true
  },
  {
    name: "Teresia Ochieng Odera",
    email: "teresa.odera@court.go.ke",
    password: "Registrar@2026",
    pj: "40140",
    role: "judge",
    isVerified: true
  },
  {
    name: "Roselyne Aburili",
    email: "roselyne.aburili@court.go.ke",
    password: "Registrar@2026",
    pj: "65238",
    role: "judge",
    isVerified: true
  },
  {
    name: "Mwanaisha Saida SharifF",
    email: "mwanaisha.saida@court.go.ke",
    password: "Registrar@2026",
    pj: "81740",
    role: "judge",
    isVerified: true
  },
  {
    name: "Antony Mrima",
    email: "antony.murima@court.go.ke",
    password: "Registrar@2026",
    pj: "65270",
    role: "judge",
    isVerified: true
  },
  {
    name: "Robert Limo",
    email: "robert.limo@court.go.ke",
    password: "Registrar@2026",
    pj: "65254",
    role: "judge",
    isVerified: true
  },
  {
    name: "Patrick J. Otieno",
    email: "patrick.otieno@court.go.ke",
    password: "Registrar@2026",
    pj: "65377",
    role: "judge",
    isVerified: true
  },
  {
    name: "Margaret Muigai",
    email: "margaret.muigai@court.go.ke",
    password: "Registrar@2026",
    pj: "16522",
    role: "judge",
    isVerified: true
  },
  {
    name: "Francis Odhiambo Olel",
    email: "francis.rayola@court.go.ke",
    password: "Registrar@2026",
    pj: "81738",
    role: "judge",
    isVerified: true
  },
  {
    name: "Noel Onditi Adagi Inziani",
    email: "noel.adagi@court.go.ke",
    password: "Registrar@2026",
    pj: "82767",
    role: "judge",
    isVerified: true
  },
  {
    name: "Teresia Mumbua Matheka",
    email: "mumbua.matheka@court.go.ke",
    password: "Registrar@2026",
    pj: "20694",
    role: "judge",
    isVerified: true
  },
  {
    name: "Mugure Thande",
    email: "mugure.thande@court.go.ke",
    password: "Registrar@2026",
    pj: "65385",
    role: "judge",
    isVerified: true
  },
  
  {
    name: "Stephen Githinji",
    email: "stephen.githinji@court.go.ke",
    password: "Registrar@2026",
    pj: "20432",
    role: "judge",
    isVerified: true
  },
  {
    name: "Jesse Njagi Nyaga",
    email: "jesse.nyagah@court.go.ke",
    password: "Registrar@2026",
    pj: "15013",
    role: "judge",
    isVerified: true
  },
  {
    name: "Edward Muriithi",
    email: "edward.muriithi@court.go.ke",
    password: "Registrar@2026",
    pj: "39512",
    role: "judge",
    isVerified: true
  },
  {
    name: "Linus Poghon Kassan",
    email: "linus.kassan@court.go.ke",
    password: "Registrar@2026",
    pj: "40181",
    role: "judge",
    isVerified: true
  },
  {
    name: "Anne C. A. Adwera Ong'injo",
    email: "aonginjo@court.go.ke",
    password: "Registrar@2026",
    pj: "20555",
    role: "judge",
    isVerified: true
  },
  {
    name: "Benjamin Mwikya Musyoki",
    email: "benjamin.musyoki@court.go.ke",
    password: "Registrar@2026",
    pj: "82775",
    role: "judge",
    isVerified: true
  },
  {
    name: "Jairus Ngaah",
    email: "jairus.ngaah@court.go.ke",
    password: "Registrar@2026",
    pj: "59342",
    role: "judge",
    isVerified: true
  },
  {
    name: "John Chigiti",
    email: "john.chigiti@court.go.ke",
    password: "Registrar@2026",
    pj: "81739",
    role: "judge",
    isVerified: true
  },
  {
    name: "Esther Maina",
    email: "esther.maina@court.go.ke",
    password: "Registrar@2026",
    pj: "15021",
    role: "judge",
    isVerified: true
  },
  {
    name: "Julius Mukut Nangea",
    email: "jmukuti@court.go.ke",
    password: "Registrar@2026",
    pj: "33710",
    role: "judge",
    isVerified: true
  },
  {
    name: "Tabitha Ouya Wanyama",
    email: "tabitha.wanyama@court.go.ke",
    password: "Registrar@2026",
    pj: "82766",
    role: "judge",
    isVerified: true
  },
  {
    name: "Joe Omido Mkutu",
    email: "jmkutu@court.go.ke",
    password: "Registrar@2026",
    pj: "43294",
    role: "judge",
    isVerified: true
  },
  {
    name: "Christine Meoli",
    email: "christine.meoli@court.go.ke",
    password: "Registrar@2026",
    pj: "12950",
    role: "judge",
    isVerified: true
  },
  {
    name: "Janet Mulwa",
    email: "janet.mulwa@court.go.ke",
    password: "Registrar@2026",
    pj: "65288",
    role: "judge",
    isVerified: true
  },
  {
    name: "Benjamin Kimani Njoroge",
    email: "benjamin.njoroge@court.go.ke",
    password: "Registrar@2026",
    pj: "82770",
    role: "judge",
    isVerified: true
  },
  {
    name: "Rhoda Cherotich Rutto",
    email: "rhoda.cherotich@court.go.ke",
    password: "Registrar@2026",
    pj: "61315",
    role: "judge",
    isVerified: true
  },
  {
    name: "Freda Mugambi Githiru",
    email: "freda.mugambi@court.go.ke",
    password: "Registrar@2026",
    pj: "81743",
    role: "judge",
    isVerified: true
  },
  {
    name: "Nixon Sifuna Wanyama",
    email: "nixon.sifuna@court.go.ke",
    password: "Registrar@2026",
    pj: "81737",
    role: "judge",
    isVerified: true
  },
  {
    name: "Alfred Mabeya",
    email: "amabeya@court.go.ke",
    password: "Registrar@2026",
    pj: "56019",
    role: "judge",
    isVerified: true
  },
  {
    name: "Margaret Njoki Mwangi",
    email: "margaret.mwangi@court.go.ke",
    password: "Registrar@2026",
    pj: "65369",
    role: "judge",
    isVerified: true
  },
  {
    name: "Visram Alnashir Aleem",
    email: "aleem.visram@court.go.ke",
    password: "Registrar@2026",
    pj: "81744",
    role: "judge",
    isVerified: true
  },
  {
    name: "Moses Ado Otieno",
    email: "moses.ado@court.go.ke",
    password: "Registrar@2026",
    pj: "82773",
    role: "judge",
    isVerified: true
  },
  {
    name: "Peter Mulwa",
    email: "pmulwa@court.go.ke",
    password: "Registrar@2026",
    pj: "34059",
    role: "judge",
    isVerified: true
  },
  {
    name: "Josephine Wambua Mongare",
    email: "josephine.mongare@court.go.ke",
    password: "Registrar@2026",
    pj: "81733",
    role: "judge",
    isVerified: true
  },
  {
    name: "Bahati Mwamuye",
    email: "bahati.mwamuye@court.go.ke",
    password: "Registrar@2026",
    pj: "82768",
    role: "judge",
    isVerified: true
  },
  {
    name: "Lawrence Mugambi Nthiga",
    email: "lawrence.mugambi@court.go.ke",
    password: "Registrar@2026",
    pj: "34732",
    role: "judge",
    isVerified: true
  },
  
  {
    name: "Kanyi Kimondo",
    email: "kanyi.kimondo@court.go.ke",
    password: "Registrar@2026",
    pj: "55877",
    role: "judge",
    isVerified: true
  },
  {
    name: "Lilian Mutende",
    email: "lmutende@court.go.ke",
    password: "Registrar@2026",
    pj: "16394",
    role: "judge",
    isVerified: true
  },
  {
    name: "Alexander Muteti",
    email: "alexander.muteti@court.go.ke",
    password: "Registrar@2026",
    pj: "82772",
    role: "judge",
    isVerified: true
  },
  {
    name: "Stephen Riechi",
    email: "stephen.riechi@court.go.ke",
    password: "Registrar@2026",
    pj: "14156",
    role: "judge",
    isVerified: true
  },
  {
    name: "Patricia Mande Nyaundi",
    email: "patricia.nyaundi@court.go.ke",
    password: "Registrar@2026",
    pj: "81732",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hilary Chemitei",
    email: "hilary.chemitei@court.go.ke",
    password: "Registrar@2026",
    pj: "55966",
    role: "judge",
    isVerified: true
  },
  {
    name: "Helen Rafaela Namisi",
    email: "helene.namisi@court.go.ke",
    password: "Registrar@2026",
    pj: "82769",
    role: "judge",
    isVerified: true
  },
  {
    name: "Caroline Kendagor",
    email: "caroline.kendagor@court.go.ke",
    password: "Registrar@2026",
    pj: "52227",
    role: "judge",
    isVerified: true
  },
  {
    name: "Olga Sewe",
    email: "olga.sewe@court.go.ke",
    password: "Registrar@2026",
    pj: "13883",
    role: "judge",
    isVerified: true
  },
  {
    name: "Florence Wangari Kabiru",
    email: "florence.wangari@court.go.ke",
    password: "Registrar@2026",
    pj: "40725",
    role: "judge",
    isVerified: true
  },
  {
    name: "Gregory Mutai",
    email: "gregory.mutai@court.go.ke",
    password: "Registrar@2026",
    pj: "81742",
    role: "judge",
    isVerified: true
  },
  {
    name: "Francis Andayi",
    email: "fandayi@court.go.ke",
    password: "Registrar@2026",
    pj: "34253",
    role: "judge",
    isVerified: true
  },
  {
    name: "Julius Kipkosgei Ng'arng'ar",
    email: "julius.ngarngar@court.go.ke",
    password: "Registrar@2026",
    pj: "33147",
    role: "judge",
    isVerified: true
  },
  {
    name: "Wendy Kagendo Micheni",
    email: "wendy.micheni@court.go.ke",
    password: "Registrar@2026",
    pj: "33192",
    role: "judge",
    isVerified: true
  },
  {
    name: "Cecilia Githua",
    email: "cecilia.githua@court.go.ke",
    password: "Registrar@2026",
    pj: "16530",
    role: "judge",
    isVerified: true
  },
  
  {
    name: "James Wakiaga",
    email: "james.wakiaga@court.go.ke",
    password: "Registrar@2026",
    pj: "55924",
    role: "judge",
    isVerified: true
  },
  {
    name: "Grace Nzioka",
    email: "grace.nzioka@court.go.ke",
    password: "Registrar@2026",
    pj: "15071",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hedwig Imbosa Ongudi",
    email: "hedwig.imbosa@court.go.ke",
    password: "Registrar@2026",
    pj: "15869",
    role: "judge",
    isVerified: true
  },
  {
    name: "Patricia Gichohi",
    email: "patricia.gichohi@court.go.ke",
    password: "Registrar@2026",
    pj: "19855",
    role: "judge",
    isVerified: true
  },
  {
    name: "Samwel Muhochi",
    email: "samwel.mohochi@court.go.ke",
    password: "Registrar@2026",
    pj: "81736",
    role: "judge",
    isVerified: true
  },
  {
    name: "Heston Mbogo Nyaga",
    email: "heston.nyaga@court.go.ke",
    password: "Registrar@2026",
    pj: "39928",
    role: "judge",
    isVerified: true
  },
  {
    name: "Anthony Kimani Ndung'u",
    email: "anthony.ndungu@court.go.ke",
    password: "Registrar@2026",
    pj: "20644",
    role: "judge",
    isVerified: true
  },
  {
    name: "Francis Gikonyo Muthuku",
    email: "francis.gikonyo@court.go.ke",
    password: "Registrar@2026",
    pj: "59350",
    role: "judge",
    isVerified: true
  },
  {
    name: "Charles Kariuki Mutungi",
    email: "charles.kariuki@court.go.ke",
    password: "Registrar@2026",
    pj: "65262",
    role: "judge",
    isVerified: true
  },
  {
    name: "Wilfrida Osodo",
    email: "wilfrida.osodo@court.go.ke",
    password: "Registrar@2026",
    pj: "65408",
    role: "judge",
    isVerified: true
  },
  {
    name: "Dennis Magare",
    email: "kizito.magare@court.go.ke",
    password: "Registrar@2026",
    pj: "81741",
    role: "judge",
    isVerified: true
  },
  {
    name: "Maureen Odero",
    email: "moderoj@court.go.ke",
    password: "Registrar@2026",
    pj: "13998",
    cohort: 2009,
    role: "judge",
    isVerified: true
  },
  {
    name: "Martin Mati Muya",
    email: "martin.muya@court.go.ke",
    password: "Registrar@2026",
    pj: "10932",
    role: "judge",
    isVerified: true
  },
  {
    name: "Florence Muchemi",
    email: "florence.muchemi@court.go.ke",
    password: "Registrar@2026",
    pj: "11904",
    cohort: 2009,
    role: "judge",
    isVerified: true
  },
  {
    name: "Jacqueline Kamau",
    email: "nancy.kamau@court.go.ke",
    password: "Registrar@2026",
    pj: "59334",
    role: "judge",
    isVerified: true
  },
  {
    name: "Asenath Ongeri",
    email: "asenath.ongeri@court.go.ke",
    password: "Registrar@2026",
    pj: "16239",
    role: "judge",
    isVerified: true
  },
  {
    name: "Clara Otieno Omondi",
    email: "claraotieno23@gmail.com",
    password: "Registrar@2026",
    pj: "43244",
    role: "admin",
    isVerified: true
  },
  {
    name: "Terry Odera",
    email: "oderaterry@yahoo.com",
    password: "Registrar@2026",
    pj: "40149",
    role: "judge",
    isVerified: true
  },
  {
    name: "Office of the Registrar High Court",
    email: "registrarhighcourt2015@gmail.com",
    password: "Registrar@2026",
    pj: "12345",
    role: "judge",
    isVerified: true
  }

    ];

    for (const userData of seedData) {
  const existingUser = await User.findOne({ email: userData.email });

  if (!existingUser) {
    const newUser = await User.create(userData); // model handles hashing
    console.log(`✅ Added → ${newUser.email}`);
  } else {
    console.log(`⚠️ Skipped (already exists) → ${existingUser.email}`);
  }
}

    console.log("✅ Seeding complete.");
    process.exit(0);

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedUsers();