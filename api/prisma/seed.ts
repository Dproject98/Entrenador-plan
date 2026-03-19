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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
