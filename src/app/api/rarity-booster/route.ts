import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rarity = searchParams.get("rarity");

  if (!rarity) {
    return NextResponse.json({ error: "Rarity is required" }, { status: 400 });
  }

  try {
    const cardsRef = collection(db, "cards");
    const q = query(cardsRef, where("rarity", "==", rarity));
    const querySnapshot = await getDocs(q);

    const cards = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`Cartes récupérées pour la rareté ${rarity}:`, cards);

    return NextResponse.json({ cards });
  } catch (error) {
    console.error("Erreur lors de la récupération des cartes :", error);
    return NextResponse.json({ error: "Erreur lors de la récupération des cartes" }, { status: 500 });
  }
}
