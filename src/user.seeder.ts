import mongoose from "mongoose";
import { env } from "./config/env";
import { User } from "./models/user.model";

const seedUsers = async () => {
  try {
    await mongoose.connect(env.MONGO_URI as string);
    console.log("✅ Connected to DB...")

    const seedData = [
      
  {
    name: "Hon. Eric Kennedy Okumu Ogola",
    email: "eric.ogola@court.go.ke",
    password: "Registrar@2026",
    pj: "55940",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Roseline C. Langat Korir",
    email: "roseline.korir@court.go.ke",
    password: "Registrar@2026",
    pj: "56001",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Rose Edwina Ougo",
    email: "rougo@court.go.ke",
    password: "Registrar@2026",
    pj: "14009",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. David Kipyegomen Kemei",
    email: "dkemei@court.go.ke",
    password: "Registrar@2026",
    pj: "33095",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. William Musya Musyoka",
    email: "william.musyoka@court.go.ke",
    password: "Registrar@2026",
    pj: "59326",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Lucy Waruguru Gitari",
    email: "lucy.gitari@court.go.ke",
    password: "Registrar@2026",
    pj: "12926",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Reuben Nyambati Nyakundi",
    email: "rnyakundi@court.go.ke",
    password: "Registrar@2026",
    pj: "14978",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. John.R Wananda Anundo",
    email: "wananda.john@court.go.ke",
    password: "Registrar@2026",
    pj: "81735",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Emily Onyando Ominde",
    email: "emily.ominde@court.go.ke",
    password: "Registrar@2026",
    pj: "19871",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Lucy Mwihaki Njuguna",
    email: "lucy.njuguna@court.go.ke",
    password: "Registrar@2026",
    pj: "65416",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. John Nyabuto Onyiego",
    email: "john.onyiego@court.go.ke",
    password: "Registrar@2026",
    pj: "20424",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Waweru Kiarie Kiarie",
    email: "wkiarie@court.go.ke",
    password: "Registrar@2026",
    pj: "14960",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Thripsisa Wanjiku Wamae Cherere",
    email: "thripsisa.wamae@court.go.ke",
    password: "Registrar@2026",
    pj: "20369",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Rachel Chepkoech Ngetich",
    email: "rachael.ngetich@court.go.ke",
    password: "Registrar@2026",
    pj: "20880",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Stella Ngali Mutuku",
    email: "stella.mutuku@court.go.ke",
    password: "Registrar@2026",
    pj: "16425",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. John Lolwalan Tamar",
    email: "john.tamar@court.go.ke",
    password: "Registrar@2026",
    pj: "20775",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Sophie Chebet Chirchir",
    email: "sophie.chirchir@court.go.ke",
    password: "Registrar@2026",
    pj: "81734",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Alice Chepngetich Bett",
    email: "alice.soi@court.go.ke",
    password: "Registrar@2026",
    pj: "82774",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Stephen Nzisi Mbungi",
    email: "smbungi@court.go.ke",
    password: "Registrar@2026",
    pj: "21755",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Roseline P.V Wendoh",
    email: "rwendoh@court.go.ke",
    password: "Registrar@2026",
    pj: "10885",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Joseph Raphael Karanja",
    email: "joseph.karanja@court.go.ke",
    password: "Registrar@2026",
    pj: "10916",
    role: "judge",
    isVerified: true
  },
  
  {
    name: "Hon. Joseph Kiplagat Sergon",
    email: "joseph.sergon@court.go.ke",
    password: "Registrar@2026",
    pj: "38841",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Richard Mururu Mwongo",
    email: "rmwongo@court.go.ke",
    password: "Registrar@2026",
    pj: "55990",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Abigal Shiganga Mshila",
    email: "amshila@court.go.ke",
    password: "Registrar@2026",
    pj: "56027",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Dorah Odityo Chepkwony",
    email: "dorah.chepkwony@court.go.ke",
    password: "Registrar@2026",
    pj: "19732",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Diana Rachel Kavedza",
    email: "diana.kavedza@court.go.ke",
    password: "Registrar@2026",
    pj: "20660",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Teresia Ochieng Odera",
    email: "teresa.odera@court.go.ke",
    password: "Registrar@2026",
    pj: "40140",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Roselyne Makokha Ekirapa Aburili",
    email: "roselyne.aburili@court.go.ke",
    password: "Registrar@2026",
    pj: "65238",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Mwanaisha Saida SharifF",
    email: "mwanaisha.saida@court.go.ke",
    password: "Registrar@2026",
    pj: "81740",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Antony Charo Mrima",
    email: "antony.murima@court.go.ke",
    password: "Registrar@2026",
    pj: "65270",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Robert Kipkoech Limo",
    email: "robert.limo@court.go.ke",
    password: "Registrar@2026",
    pj: "65254",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Patrick Okwarro Otieno",
    email: "patrick.otieno@court.go.ke",
    password: "Registrar@2026",
    pj: "65377",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Margaret Waringa Muigai",
    email: "margaret.muigai@court.go.ke",
    password: "Registrar@2026",
    pj: "16522",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Francis Odhiambo Olel",
    email: "francis.rayola@court.go.ke",
    password: "Registrar@2026",
    pj: "81738",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Noel Onditi Adagi Inziani",
    email: "noel.adagi@court.go.ke",
    password: "Registrar@2026",
    pj: "82767",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Teresia Mumbua Matheka",
    email: "mumbua.matheka@court.go.ke",
    password: "Registrar@2026",
    pj: "20694",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Mugure Thande",
    email: "mugure.thande@court.go.ke",
    password: "Registrar@2026",
    pj: "65385",
    role: "judge",
    isVerified: true
  },
  
  {
    name: "Hon. Stephen Murugu Githinji",
    email: "stephen.githinji@court.go.ke",
    password: "Registrar@2026",
    pj: "20432",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Jesse Njagi Nyaga",
    email: "jesse.nyagah@court.go.ke",
    password: "Registrar@2026",
    pj: "15013",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Edward Muthoga Muriithi",
    email: "edward.muriithi@court.go.ke",
    password: "Registrar@2026",
    pj: "39512",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Linus Poghon Kassan",
    email: "linus.kassan@court.go.ke",
    password: "Registrar@2026",
    pj: "40181",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Anne C. A. Adwera Ong'injo",
    email: "aonginjo@court.go.ke",
    password: "Registrar@2026",
    pj: "20555",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Benjamin Mwikya Musyoki",
    email: "benjamin.musyoki@court.go.ke",
    password: "Registrar@2026",
    pj: "82775",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Jairus Ngaah",
    email: "jairus.ngaah@court.go.ke",
    password: "Registrar@2026",
    pj: "59342",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. John Mwigumi Chigiti",
    email: "john.chigiti@court.go.ke",
    password: "Registrar@2026",
    pj: "81739",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Esther Nyambura Maina",
    email: "esther.maina@court.go.ke",
    password: "Registrar@2026",
    pj: "15021",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Julius Mukut Nangea",
    email: "jmukuti@court.go.ke",
    password: "Registrar@2026",
    pj: "33710",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Tabitha Ouya Wanyama",
    email: "tabitha.wanyama@court.go.ke",
    password: "Registrar@2026",
    pj: "82766",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Joe Omido Mkutu",
    email: "jmkutu@court.go.ke",
    password: "Registrar@2026",
    pj: "43294",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Christine Wanjiku Meoli",
    email: "christine.meoli@court.go.ke",
    password: "Registrar@2026",
    pj: "12950",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Janet Nzilani Mulwa",
    email: "janet.mulwa@court.go.ke",
    password: "Registrar@2026",
    pj: "65288",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Benjamin Kimani Njoroge",
    email: "benjamin.njoroge@court.go.ke",
    password: "Registrar@2026",
    pj: "82770",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Rhoda Cherotich Rutto",
    email: "rhoda.cherotich@court.go.ke",
    password: "Registrar@2026",
    pj: "61315",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Freda Mugambi Githiru",
    email: "freda.mugambi@court.go.ke",
    password: "Registrar@2026",
    pj: "81743",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Nixon Sifuna Wanyama",
    email: "nixon.sifuna@court.go.ke",
    password: "Registrar@2026",
    pj: "81737",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Alfred Mabeya",
    email: "amabeya@court.go.ke",
    password: "Registrar@2026",
    pj: "56019",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Margaret Njoki Mwangi",
    email: "margaret.mwangi@court.go.ke",
    password: "Registrar@2026",
    pj: "65369",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Visram Alnashir Aleem",
    email: "aleem.visram@court.go.ke",
    password: "Registrar@2026",
    pj: "81744",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Moses Ado Otieno",
    email: "moses.ado@court.go.ke",
    password: "Registrar@2026",
    pj: "82773",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Peter Mutua Mulwa",
    email: "pmulwa@court.go.ke",
    password: "Registrar@2026",
    pj: "34059",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Josephine Wambua Mongare",
    email: "josephine.mongare@court.go.ke",
    password: "Registrar@2026",
    pj: "81733",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Enock Chacha Mwita",
    email: "enock.mwita@court.go.ke",
    password: "Registrar@2026",
    pj: "65246",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Andrew Bahati Mwamuye",
    email: "bahati.mwamuye@court.go.ke",
    password: "Registrar@2026",
    pj: "82768",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Lawrence Mugambi Nthiga",
    email: "lawrence.mugambi@court.go.ke",
    password: "Registrar@2026",
    pj: "34732",
    role: "judge",
    isVerified: true
  },
  
  {
    name: "Hon. George Kanyi Kimondo",
    email: "kanyi.kimondo@court.go.ke",
    password: "Registrar@2026",
    pj: "55877",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Lilian Nabwire Mutende",
    email: "lmutende@court.go.ke",
    password: "Registrar@2026",
    pj: "16394",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Alexander Muasya Muteti",
    email: "alexander.muteti@court.go.ke",
    password: "Registrar@2026",
    pj: "82772",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Stephen Nyangau Riechi",
    email: "stephen.riechi@court.go.ke",
    password: "Registrar@2026",
    pj: "14156",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Patricia Mande Nyaundi",
    email: "patricia.nyaundi@court.go.ke",
    password: "Registrar@2026",
    pj: "81732",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Hilary Kiplagat Chemitei",
    email: "hilary.chemitei@court.go.ke",
    password: "Registrar@2026",
    pj: "55966",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Helen Rafaela Namisi",
    email: "helene.namisi@court.go.ke",
    password: "Registrar@2026",
    pj: "82769",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Caroline Jepyegen Kendagor",
    email: "caroline.kendagor@court.go.ke",
    password: "Registrar@2026",
    pj: "52227",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Olga Akech Sewe",
    email: "olga.sewe@court.go.ke",
    password: "Registrar@2026",
    pj: "13883",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Florence Wangari Macharia",
    email: "florence.wangari@court.go.ke",
    password: "Registrar@2026",
    pj: "40725",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Gregory Mutai",
    email: "gregory.mutai@court.go.ke",
    password: "Registrar@2026",
    pj: "81742",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Francis Weche Andayi",
    email: "fandayi@court.go.ke",
    password: "Registrar@2026",
    pj: "32253",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Julius Kipkosgei Ng'arng'ar",
    email: "julius.ngarngar@court.go.ke",
    password: "Registrar@2026",
    pj: "33147",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Wendy Kagendo Micheni",
    email: "wendy.micheni@court.go.ke",
    password: "Registrar@2026",
    pj: "33192",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Cecilia Wathaiya Githua",
    email: "cecilia.githua@court.go.ke",
    password: "Registrar@2026",
    pj: "16530",
    role: "judge",
    isVerified: true
  },
  
  {
    name: "Hon. James Auodo Wakiaga",
    email: "james.wakiaga@court.go.ke",
    password: "Registrar@2026",
    pj: "55924",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Grace Lidembu Nzioka",
    email: "grace.nzioka@court.go.ke",
    password: "Registrar@2026",
    pj: "15071",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Hedwig Imbosa Ongudi",
    email: "hedwig.imbosa@court.go.ke",
    password: "Registrar@2026",
    pj: "15869",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Patricia Njeri Gichohi",
    email: "patricia.gichohi@court.go.ke",
    password: "Registrar@2026",
    pj: "20369",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Samwel Mukira Muhochi",
    email: "samwel.mohochi@court.go.ke",
    password: "Registrar@2026",
    pj: "81736",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Heston Mbogo Nyaga",
    email: "heston.nyaga@court.go.ke",
    password: "Registrar@2026",
    pj: "39928",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Anthony Kimani Ndung'u",
    email: "anthony.ndungu@court.go.ke",
    password: "Registrar@2026",
    pj: "20644",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Francis Gikonyo Muthuku",
    email: "francis.gikonyo@court.go.ke",
    password: "Registrar@2026",
    pj: "59350",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Charles Kariuki Mutungi",
    email: "charles.kariuki@court.go.ke",
    password: "Registrar@2026",
    pj: "65262",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Wilfrida Adhiambo Osodo",
    email: "wilfrida.osodo@court.go.ke",
    password: "Registrar@2026",
    pj: "65408",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Dennis Ng'ono Magare",
    email: "kizito.magare@court.go.ke",
    password: "Registrar@2026",
    pj: "81741",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Maureen Akinyi Odero",
    email: "moderoj@court.go.ke",
    password: "Registrar@2026",
    pj: "13998",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Martin Mati Muya",
    email: "martin.muya@court.go.ke",
    password: "Registrar@2026",
    pj: "10932",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Florence Nyaguthii Muchemi",
    email: "florence.muchemi@court.go.ke",
    password: "Registrar@2026",
    pj: "11904",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Nancy Jaquline Njuhi Kamau",
    email: "nancy.kamau@court.go.ke",
    password: "Registrar@2026",
    pj: "59334",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Asenath Nyaboke Ongeri",
    email: "asenath.ongeri@court.go.ke",
    password: "Registrar@2026",
    pj: "16239",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Clara Otieno Omondi",
    email: "claraotieno23@gmail.com",
    password: "Registrar@2026",
    pj: "43244",
    role: "admin",
    isVerified: true
  },
  
  {
    name: "Hon. Keith Otieno Omondi",
    email: "denniskeith62@gmail.com",
    password: "Registrar@2026",
    pj: "43211",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Terry Odera",
    email: "oderaterry@yahoo.com",
    password: "Registrar@2026",
    pj: "40149",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Francis Andanyi",
    email: "francis.andanyi@court.go.ke",
    password: "Registrar@2026",
    pj: "34253",
    role: "judge",
    isVerified: true
  },
  {
    name: "Hon. Office of the Registrar High Court",
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