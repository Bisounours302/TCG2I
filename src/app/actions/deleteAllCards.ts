"use server";

import { db, storage } from "@/lib/firebaseConfig";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";

export async function deleteAllCards() {
  try {
    const querySnapshot = await getDocs(collection(db, "cards"));

    const deletePromises = querySnapshot.docs.map(async (docSnap) => {
      const cardData = docSnap.data();
      if (cardData.imageURL) {
        const storageRef = ref(storage, cardData.imageURL);
        try {
          await deleteObject(storageRef);
          console.log(`Image supprimée : ${cardData.imageURL}`);
        } catch (error) {
          console.warn(`Erreur lors de la suppression de l'image : ${cardData.imageURL}`, error);
        }
      }
      return deleteDoc(doc(db, "cards", docSnap.id));
    });

    await Promise.all(deletePromises);
    console.log("Toutes les cartes et images ont été supprimées !");
    
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression des cartes :", error);
    return { success: false, error };
  }
}
