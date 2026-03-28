import { PrismaClient, MuscleGroup, Equipment } from "@prisma/client";

const prisma = new PrismaClient();

const exercises: Array<{
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  description?: string;
}> = [
  // ---- CHEST ----
  { name: "Barbell Bench Press", muscleGroup: MuscleGroup.CHEST, equipment: Equipment.BARBELL, description: "Horizontal push. Flat bench." },
  { name: "Incline Barbell Bench Press", muscleGroup: MuscleGroup.CHEST, equipment: Equipment.BARBELL },
  { name: "Dumbbell Bench Press", muscleGroup: MuscleGroup.CHEST, equipment: Equipment.DUMBBELL },
  { name: "Incline Dumbbell Bench Press", muscleGroup: MuscleGroup.CHEST, equipment: Equipment.DUMBBELL },
  { name: "Cable Fly", muscleGroup: MuscleGroup.CHEST, equipment: Equipment.CABLE },
  { name: "Push-Up", muscleGroup: MuscleGroup.CHEST, equipment: Equipment.BODYWEIGHT },
  { name: "Dumbbell Fly", muscleGroup: MuscleGroup.CHEST, equipment: Equipment.DUMBBELL },
  { name: "Chest Dip", muscleGroup: MuscleGroup.CHEST, equipment: Equipment.BODYWEIGHT },

  // ---- BACK ----
  { name: "Barbell Row", muscleGroup: MuscleGroup.BACK, equipment: Equipment.BARBELL, description: "Overhand grip. Hinge at hips." },
  { name: "Pull-Up", muscleGroup: MuscleGroup.BACK, equipment: Equipment.BODYWEIGHT },
  { name: "Lat Pulldown", muscleGroup: MuscleGroup.BACK, equipment: Equipment.CABLE },
  { name: "Seated Cable Row", muscleGroup: MuscleGroup.BACK, equipment: Equipment.CABLE },
  { name: "Single-Arm Dumbbell Row", muscleGroup: MuscleGroup.BACK, equipment: Equipment.DUMBBELL },
  { name: "Deadlift", muscleGroup: MuscleGroup.BACK, equipment: Equipment.BARBELL, description: "Conventional stance." },
  { name: "Romanian Deadlift", muscleGroup: MuscleGroup.BACK, equipment: Equipment.BARBELL },
  { name: "Face Pull", muscleGroup: MuscleGroup.BACK, equipment: Equipment.CABLE },

  // ---- SHOULDERS ----
  { name: "Overhead Press", muscleGroup: MuscleGroup.SHOULDERS, equipment: Equipment.BARBELL, description: "Standing barbell OHP." },
  { name: "Dumbbell Shoulder Press", muscleGroup: MuscleGroup.SHOULDERS, equipment: Equipment.DUMBBELL },
  { name: "Lateral Raise", muscleGroup: MuscleGroup.SHOULDERS, equipment: Equipment.DUMBBELL },
  { name: "Cable Lateral Raise", muscleGroup: MuscleGroup.SHOULDERS, equipment: Equipment.CABLE },
  { name: "Rear Delt Fly", muscleGroup: MuscleGroup.SHOULDERS, equipment: Equipment.DUMBBELL },
  { name: "Arnold Press", muscleGroup: MuscleGroup.SHOULDERS, equipment: Equipment.DUMBBELL },

  // ---- BICEPS ----
  { name: "Barbell Curl", muscleGroup: MuscleGroup.BICEPS, equipment: Equipment.BARBELL },
  { name: "Dumbbell Curl", muscleGroup: MuscleGroup.BICEPS, equipment: Equipment.DUMBBELL },
  { name: "Hammer Curl", muscleGroup: MuscleGroup.BICEPS, equipment: Equipment.DUMBBELL },
  { name: "Incline Dumbbell Curl", muscleGroup: MuscleGroup.BICEPS, equipment: Equipment.DUMBBELL },
  { name: "Cable Curl", muscleGroup: MuscleGroup.BICEPS, equipment: Equipment.CABLE },
  { name: "Preacher Curl", muscleGroup: MuscleGroup.BICEPS, equipment: Equipment.MACHINE },

  // ---- TRICEPS ----
  { name: "Tricep Pushdown", muscleGroup: MuscleGroup.TRICEPS, equipment: Equipment.CABLE },
  { name: "Overhead Tricep Extension", muscleGroup: MuscleGroup.TRICEPS, equipment: Equipment.CABLE },
  { name: "Skull Crusher", muscleGroup: MuscleGroup.TRICEPS, equipment: Equipment.BARBELL },
  { name: "Close-Grip Bench Press", muscleGroup: MuscleGroup.TRICEPS, equipment: Equipment.BARBELL },
  { name: "Dumbbell Tricep Kickback", muscleGroup: MuscleGroup.TRICEPS, equipment: Equipment.DUMBBELL },
  { name: "Tricep Dip", muscleGroup: MuscleGroup.TRICEPS, equipment: Equipment.BODYWEIGHT },

  // ---- CORE ----
  { name: "Plank", muscleGroup: MuscleGroup.CORE, equipment: Equipment.BODYWEIGHT },
  { name: "Cable Crunch", muscleGroup: MuscleGroup.CORE, equipment: Equipment.CABLE },
  { name: "Ab Wheel Rollout", muscleGroup: MuscleGroup.CORE, equipment: Equipment.OTHER },
  { name: "Hanging Leg Raise", muscleGroup: MuscleGroup.CORE, equipment: Equipment.BODYWEIGHT },
  { name: "Russian Twist", muscleGroup: MuscleGroup.CORE, equipment: Equipment.BODYWEIGHT },
  { name: "Dead Bug", muscleGroup: MuscleGroup.CORE, equipment: Equipment.BODYWEIGHT },

  // ---- GLUTES ----
  { name: "Barbell Hip Thrust", muscleGroup: MuscleGroup.GLUTES, equipment: Equipment.BARBELL },
  { name: "Cable Pull-Through", muscleGroup: MuscleGroup.GLUTES, equipment: Equipment.CABLE },
  { name: "Glute Bridge", muscleGroup: MuscleGroup.GLUTES, equipment: Equipment.BODYWEIGHT },

  // ---- QUADS ----
  { name: "Barbell Back Squat", muscleGroup: MuscleGroup.QUADS, equipment: Equipment.BARBELL, description: "High bar. Below parallel." },
  { name: "Front Squat", muscleGroup: MuscleGroup.QUADS, equipment: Equipment.BARBELL },
  { name: "Leg Press", muscleGroup: MuscleGroup.QUADS, equipment: Equipment.MACHINE },
  { name: "Leg Extension", muscleGroup: MuscleGroup.QUADS, equipment: Equipment.MACHINE },
  { name: "Bulgarian Split Squat", muscleGroup: MuscleGroup.QUADS, equipment: Equipment.DUMBBELL },
  { name: "Walking Lunge", muscleGroup: MuscleGroup.QUADS, equipment: Equipment.DUMBBELL },
  { name: "Hack Squat", muscleGroup: MuscleGroup.QUADS, equipment: Equipment.MACHINE },

  // ---- HAMSTRINGS ----
  { name: "Leg Curl", muscleGroup: MuscleGroup.HAMSTRINGS, equipment: Equipment.MACHINE },
  { name: "Nordic Hamstring Curl", muscleGroup: MuscleGroup.HAMSTRINGS, equipment: Equipment.BODYWEIGHT },
  { name: "Stiff-Leg Deadlift", muscleGroup: MuscleGroup.HAMSTRINGS, equipment: Equipment.BARBELL },

  // ---- CALVES ----
  { name: "Standing Calf Raise", muscleGroup: MuscleGroup.CALVES, equipment: Equipment.MACHINE },
  { name: "Seated Calf Raise", muscleGroup: MuscleGroup.CALVES, equipment: Equipment.MACHINE },
  { name: "Donkey Calf Raise", muscleGroup: MuscleGroup.CALVES, equipment: Equipment.MACHINE },

  // ---- CARDIO ----
  { name: "Treadmill Run", muscleGroup: MuscleGroup.CARDIO, equipment: Equipment.MACHINE },
  { name: "Rowing Machine", muscleGroup: MuscleGroup.CARDIO, equipment: Equipment.MACHINE },
  { name: "Assault Bike", muscleGroup: MuscleGroup.CARDIO, equipment: Equipment.MACHINE },
  { name: "Jump Rope", muscleGroup: MuscleGroup.CARDIO, equipment: Equipment.OTHER },
  { name: "Stair Climber", muscleGroup: MuscleGroup.CARDIO, equipment: Equipment.MACHINE },
];

const foods: Array<{
  name: string;
  brandName?: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}> = [
  // ---- PROTEÍNAS ----
  { name: "Pechuga de pollo (cocida)", caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
  { name: "Pechuga de pavo (cocida)", caloriesPer100g: 135, proteinPer100g: 29, carbsPer100g: 0, fatPer100g: 1.8 },
  { name: "Carne picada 90% (cocida)", caloriesPer100g: 215, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 12 },
  { name: "Salmón (cocinado)", caloriesPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 13 },
  { name: "Atún en agua (lata)", caloriesPer100g: 116, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 1 },
  { name: "Huevo entero", caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11 },
  { name: "Clara de huevo", caloriesPer100g: 52, proteinPer100g: 11, carbsPer100g: 0.7, fatPer100g: 0.2 },
  { name: "Queso cottage 0%", caloriesPer100g: 72, proteinPer100g: 12, carbsPer100g: 3.4, fatPer100g: 0.3 },
  { name: "Yogur griego 0%", caloriesPer100g: 59, proteinPer100g: 10, carbsPer100g: 3.6, fatPer100g: 0.4 },
  { name: "Proteína whey (polvo)", caloriesPer100g: 380, proteinPer100g: 80, carbsPer100g: 6, fatPer100g: 4 },

  // ---- CARBOHIDRATOS ----
  { name: "Arroz blanco (cocido)", caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3 },
  { name: "Arroz integral (cocido)", caloriesPer100g: 111, proteinPer100g: 2.6, carbsPer100g: 23, fatPer100g: 0.9 },
  { name: "Avena (cruda)", caloriesPer100g: 389, proteinPer100g: 17, carbsPer100g: 66, fatPer100g: 7 },
  { name: "Patata (cocida)", caloriesPer100g: 87, proteinPer100g: 1.9, carbsPer100g: 20, fatPer100g: 0.1 },
  { name: "Boniato (cocido)", caloriesPer100g: 90, proteinPer100g: 2, carbsPer100g: 21, fatPer100g: 0.1 },
  { name: "Pan de centeno", caloriesPer100g: 259, proteinPer100g: 9, carbsPer100g: 48, fatPer100g: 3.3 },
  { name: "Pasta integral (cocida)", caloriesPer100g: 124, proteinPer100g: 5.3, carbsPer100g: 23, fatPer100g: 1.1 },
  { name: "Quinoa (cocida)", caloriesPer100g: 120, proteinPer100g: 4.4, carbsPer100g: 21, fatPer100g: 1.9 },

  // ---- GRASAS ----
  { name: "Aguacate", caloriesPer100g: 160, proteinPer100g: 2, carbsPer100g: 9, fatPer100g: 15 },
  { name: "Aceite de oliva", caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100 },
  { name: "Almendras", caloriesPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatPer100g: 50 },
  { name: "Mantequilla de cacahuete natural", caloriesPer100g: 598, proteinPer100g: 25, carbsPer100g: 20, fatPer100g: 50 },

  // ---- LÁCTEOS ----
  { name: "Leche semidesnatada", caloriesPer100g: 46, proteinPer100g: 3.4, carbsPer100g: 4.8, fatPer100g: 1.6 },
  { name: "Queso mozzarella", caloriesPer100g: 280, proteinPer100g: 28, carbsPer100g: 2.2, fatPer100g: 17 },

  // ---- FRUTAS Y VERDURAS ----
  { name: "Plátano", caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3 },
  { name: "Manzana", caloriesPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2 },
  { name: "Brócoli (cocido)", caloriesPer100g: 35, proteinPer100g: 2.4, carbsPer100g: 7.2, fatPer100g: 0.4 },
  { name: "Espinacas (crudas)", caloriesPer100g: 23, proteinPer100g: 2.9, carbsPer100g: 3.6, fatPer100g: 0.4 },
  { name: "Lentejas (cocidas)", caloriesPer100g: 116, proteinPer100g: 9, carbsPer100g: 20, fatPer100g: 0.4 },
];

async function main(): Promise<void> {
  console.log("Seeding exercise library...");

  for (const exercise of exercises) {
    await prisma.exercise.upsert({
      where: { name: exercise.name },
      update: {
        muscleGroup: exercise.muscleGroup,
        equipment: exercise.equipment,
        description: exercise.description ?? null,
      },
      create: exercise,
    });
  }

  console.log(`Seeded ${exercises.length} exercises.`);

  console.log("Seeding food library...");

  for (const food of foods) {
    await prisma.food.upsert({
      where: { id: `seed_${food.name.replace(/\s+/g, "_").toLowerCase()}` },
      update: {
        caloriesPer100g: food.caloriesPer100g,
        proteinPer100g: food.proteinPer100g,
        carbsPer100g: food.carbsPer100g,
        fatPer100g: food.fatPer100g,
      },
      create: {
        id: `seed_${food.name.replace(/\s+/g, "_").toLowerCase()}`,
        name: food.name,
        brandName: food.brandName ?? null,
        caloriesPer100g: food.caloriesPer100g,
        proteinPer100g: food.proteinPer100g,
        carbsPer100g: food.carbsPer100g,
        fatPer100g: food.fatPer100g,
        isPrivate: false,
      },
    });
  }

  console.log(`Seeded ${foods.length} foods.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
