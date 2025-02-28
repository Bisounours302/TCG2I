import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export async function GET() {
  try {
    const cardsRef = collection(db, "cards");
    const snapshot = await getDocs(cardsRef);

    const allCards = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (allCards.length < 8) {
      return NextResponse.json({ error: "Pas assez de cartes disponibles." }, { status: 500 });
    }

    // Mélange et sélectionne 8 cartes aléatoires (2 exemplaires de chaque)
    const selectedCards = [...allCards.sort(() => Math.random() - 0.5).slice(0, 8)];

    // Créer deux exemplaires de chaque carte avec des IDs uniques
    const memoryCards = selectedCards.flatMap((card) => [
      { ...card, uniqueId: `${card.id}-1` },
      { ...card, uniqueId: `${card.id}-2` },
    ]);

    // Mélanger les cartes
    const shuffledCards = memoryCards.sort(() => Math.random() - 0.5);

    return NextResponse.json({ cards: shuffledCards });

  } catch (error) {
    console.error("Erreur lors de la récupération des cartes :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
