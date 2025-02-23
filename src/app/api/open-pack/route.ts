import { db } from "@/lib/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const querySnapshot = await getDocs(collection(db, "cards"));
    const allCards = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return { id: doc.id, ...data };  // Ajoute l'ID Firestore
    });

    console.log("📂 Cartes disponibles:", allCards.length);

    if (allCards.length === 0) {
      return NextResponse.json({ error: "Aucune carte disponible." }, { status: 400 });
    }

    // Sélection unique de 6 cartes aléatoires
    const pack: any[] = [];
    while (pack.length < 6) {
      const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
      if (!pack.some((card) => card.id === randomCard.id)) {
        pack.push(randomCard);
      }
    }

    console.log("🎁 Pack généré:", pack);
    return NextResponse.json({ pack });
  } catch (error) {
    console.error("❌ Erreur lors de l'ouverture du pack:", error);
    return NextResponse.json({ error: "Erreur lors de l'ouverture du pack" }, { status: 500 });
  }
}
