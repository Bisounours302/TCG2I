import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    // Récupérer toutes les cartes de la collection 'cards'
    const cardsSnapshot = await adminDb.collection('cards').get();
    const allCards = cardsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Mélanger les cartes et en prendre 8 aléatoirement
    const shuffledCards = allCards.sort(() => Math.random() - 0.5);
    const selectedCards = shuffledCards.slice(0, 8);

    // Dupliquer les cartes pour créer les paires
    const memoryCards = [...selectedCards, ...selectedCards].sort(() => Math.random() - 0.5);

    // Ajouter un identifiant unique pour chaque carte (même les paires)
    const cardsWithUniqueIds = memoryCards.map((card, index) => ({
      ...card,
      uniqueId: `${card.id}-${index}`
    }));

    return NextResponse.json({
      cards: cardsWithUniqueIds
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des cartes :", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des cartes" },
      { status: 500 }
    );
  }
}
