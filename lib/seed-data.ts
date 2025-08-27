import { storage } from './storage.js';

export async function seedData() {
  const exercises = [
      {
        title: "Marche rapide",
        description: "Une marche énergique pour améliorer l'humeur et réduire le stress",
        category: "cardio",
        difficulty: "beginner",
        duration: 20,
        instructions: "Marchez d'un pas soutenu pendant 20 minutes. Concentrez-vous sur votre respiration et l'environnement qui vous entoure. Maintenez un rythme qui vous permet de parler mais qui vous fait légèrement transpirer.",
        benefits: "Améliore l'humeur, réduit l'anxiété, augmente l'énergie, favorise la production d'endorphines naturelles",
        imageUrl: "/images/walking.jpg",
      },
      // ... more exercises
  ];

  const psychoEducationContent = [
      {
        title: "Comprendre l'addiction",
        content: `L'addiction est une maladie chronique du cerveau...`,
        category: "addiction",
        type: "article",
        difficulty: "beginner",
        estimatedReadTime: 8,
        imageUrl: "/images/brain-addiction.jpg",
      },
      // ... more content
  ];

  console.log("Seeding exercises...");
  for (const exercise of exercises) {
    try {
      await storage.createExercise(exercise);
      console.log(`Exercice créé: ${exercise.title}`);
    } catch (error) {
      console.error(`Erreur lors de la création de l'exercice ${exercise.title}:`, error);
    }
  }

  console.log("Seeding psycho-educational content...");
  for (const content of psychoEducationContent) {
    try {
      await storage.createPsychoEducationContent(content);
      console.log(`Contenu psychoéducatif créé: ${content.title}`);
    } catch (error) {
      console.error(`Erreur lors de la création du contenu ${content.title}:`, error);
    }
  }

  console.log("Données d'exemple créées avec succès!");
}
