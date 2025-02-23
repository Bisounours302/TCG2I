"use server";

import { db, storage } from "@/lib/firebaseConfig";
import { collection, doc, setDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, getMetadata } from "firebase/storage";
import fs from "fs";
import path from "path";

const localImagePath = "public/ressources/cartes"; // Remplace par ton dossier local si nécessaire

const cards = [
  { id: "card_001", name: "Madame Leriche", rarity: "commune", imageURL: "MadameLeriche.png" },
  { id: "card_002", name: "Madame Leriche", rarity: "brillante", imageURL: "MadameLericheBRILLANT.png" },
  { id: "card_003", name: "Monsieur Hecquet", rarity: "commune", imageURL: "MonsieurHecquet.png" },
  { id: "card_004", name: "Monsieur Hecquet", rarity: "brillante", imageURL: "MonsieurHecquetBRILLANT.png" },
  { id: "card_005", name: "Monsieur Oxoby", rarity: "commune", imageURL: "MonsieurOxoby.png" },
  { id: "card_006", name: "Monsieur Oxoby", rarity: "brillante", imageURL: "MonsieurOxobyBRILLANT.png" },
  { id: "card_007", name: "Natalie", rarity: "commune", imageURL: "Natalie.png" },
  { id: "card_008", name: "Natalie", rarity: "brillante", imageURL: "NatalieBRILLANT.png" },
  { id: "card_009", name: "Enigme", rarity: "commune", imageURL: "Enigme.png" },
  { id: "card_010", name: "Enigme", rarity: "brillante", imageURL: "EnigmeBRILLANT.png" },
  { id: "card_011", name: "Tour de Chaises", rarity: "commune", imageURL: "TourDeChaises.png" },
  { id: "card_012", name: "Tour de Chaises", rarity: "brillante", imageURL: "TourDeChaisesBRILLANT.png" },
  { id: "card_013", name: "Madame Leriche", rarity: "commune", imageURL: "MadameLeriche2.png" },
  { id: "card_014", name: "Madame Leriche", rarity: "brillante", imageURL: "MadameLericheBRILLANT2.png" },
  { id: "card_015", name: "Monsieur Hecquet", rarity: "commune", imageURL: "MonsieurHecquet2.png" },
  { id: "card_016", name: "Monsieur Hecquet", rarity: "brillante", imageURL: "MonsieurHecquetBRILLANT2.png" },
  { id: "card_017", name: "Monsieur Oxoby", rarity: "commune", imageURL: "MonsieurOxoby2.png" },
  { id: "card_018", name: "Monsieur Oxoby", rarity: "brillante", imageURL: "MonsieurOxobyBRILLANT2.png" },
  { id: "card_019", name: "Natalie", rarity: "commune", imageURL: "Natalie2.png" },
  { id: "card_020", name: "Natalie", rarity: "brillante", imageURL: "NatalieBRILLANT2.png" },
  { id: "card_021", name: "Enigme", rarity: "commune", imageURL: "Enigme2.png" },
  { id: "card_022", name: "Enigme", rarity: "brillante", imageURL: "EnigmeBRILLANT2.png" },
  { id: "card_023", name: "Tour de Chaises", rarity: "commune", imageURL: "TourDeChaises2.png" },
  { id: "card_024", name: "Tour de Chaises", rarity: "brillante", imageURL: "TourDeChaisesBRILLANT2.png" },
];

export async function addTestCards() {
  try {
    for (const card of cards) {
      const cardRef = doc(db, "cards", card.id);
      const cardDoc = await getDoc(cardRef);

      if (cardDoc.exists()) {
        console.log(`❌ Carte ${card.id} déjà existante, ignorée.`);
        continue;
      }

      const imagePath = path.join(localImagePath, card.imageURL);
      if (!fs.existsSync(imagePath)) {
        console.warn(`⚠️ Image non trouvée : ${imagePath}, carte ignorée.`);
        continue;
      }

      const storageRef = ref(storage, `ressources/cartes/${card.imageURL}`);
      let imageUrl: string;

      try {
        // Vérifie si l'image est déjà en ligne
        await getMetadata(storageRef);
        imageUrl = await getDownloadURL(storageRef); // Récupère l'URL existante
        console.log(`✅ Image déjà en ligne : ${card.imageURL}`);
      } catch (error: any) {
        if (error.code === "storage/object-not-found") {
          // L'image n'existe pas, on l'upload
          const fileBuffer = fs.readFileSync(imagePath);
          await uploadBytes(storageRef, fileBuffer);
          imageUrl = await getDownloadURL(storageRef); // Récupère l'URL après upload
          console.log(`📤 Image uploadée : ${card.imageURL}`);
        } else {
          console.error(`❌ Erreur lors de la vérification de l'image ${card.imageURL} :`, error);
          continue;
        }
      }

      // Ajouter la carte dans Firestore avec l'URL complète
      await setDoc(cardRef, {
        name: card.name,
        rarity: card.rarity,
        imageURL: imageUrl, // 🔥 Stocke l'URL complète ici
      });

      console.log(`✅ Carte ajoutée : ${card.id} - ${card.name}`);
    }

    console.log("🎉 Ajout des cartes terminé !");
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout des cartes :", error);
  }
}
