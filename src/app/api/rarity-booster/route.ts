import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rarity = searchParams.get('rarity');

    if (!rarity) {
      return NextResponse.json({ error: "Rarity parameter is required" }, { status: 400 });
    }

    const cardsRef = adminDb.collection('cards');
    const cardsSnapshot = await cardsRef.where('rarity', '==', rarity).get();

    const cards = cardsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      imageURL: doc.data().imageURL,
      rarity: doc.data().rarity,
    }));

    return NextResponse.json({ cards });

  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
