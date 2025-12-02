import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';
import Lesson from '../models/Lesson.model.js';
import Quiz from '../models/Quiz.model.js';
import GeoPoint from '../models/GeoPoint.model.js';

dotenv.config();

const seedUsers = async () => {
  const users = [
    {
      name: 'Admin User',
      email: 'admin@geolearnhub.com',
      password: 'Admin123!',
      role: 'admin',
      gradeLevel: 'Grade 12'
    },
    {
      name: 'Geography Teacher',
      email: 'teacher@geolearnhub.com',
      password: 'Teacher123!',
      role: 'teacher',
      gradeLevel: 'Grade 12'
    },
    {
      name: 'John Learner',
      email: 'john@geolearnhub.com',
      password: 'Learner123!',
      role: 'learner',
      gradeLevel: 'Grade 12'
    },
    {
      name: 'Sarah Student',
      email: 'sarah@geolearnhub.com',
      password: 'Student123!',
      role: 'learner',
      gradeLevel: 'Grade 12'
    }
  ];

  console.log('Seeding users...');
  for (const userData of users) {
    const existingUser = await User.findOne({ email: userData.email });
    if (!existingUser) {
      await User.create(userData);
      console.log(`Created user: ${userData.email}`);
    }
  }
};

const seedLessons = async () => {
  const adminUser = await User.findOne({ email: 'admin@geolearnhub.com' });
  
  const lessons = [
    {
      title: 'Introduction to Physical Geography',
      description: 'Learn about Earth\'s physical features, landforms, and natural processes.',
      content: `
        <h1>Introduction to Physical Geography</h1>
        <p>Physical geography is the study of Earth's physical features and processes...</p>
        <h2>Key Concepts:</h2>
        <ul>
          <li>Earth's structure and composition</li>
          <li>Plate tectonics and continental drift</li>
          <li>Weathering and erosion processes</li>
          <li>Climate patterns and zones</li>
        </ul>
      `,
      gradeLevel: 'Grade 12',
      subject: 'Geography',
      duration: 45,
      topics: ['physical-geography', 'earth-science', 'landforms', 'climate'],
      difficulty: 'beginner',
      isPublished: true,
      learningObjectives: [
        'Understand Earth\'s physical structure',
        'Identify major landforms and their formation',
        'Explain climate patterns and zones'
      ],
      resources: [
        {
          url: 'https://example.com/physical-geo-video',
          type: 'video',
          title: 'Physical Geography Overview'
        }
      ],
      createdBy: adminUser._id
    },
    {
      title: 'Human Geography: Population Distribution',
      description: 'Explore patterns of human population distribution and migration.',
      content: `
        <h1>Human Geography: Population Distribution</h1>
        <p>Human geography examines how human activities and populations are distributed across the Earth...</p>
        <h2>Key Topics:</h2>
        <ul>
          <li>Population density and distribution patterns</li>
          <li>Migration: push and pull factors</li>
          <li>Urbanization trends</li>
          <li>Demographic transition model</li>
        </ul>
      `,
      gradeLevel: 'Grade 12',
      subject: 'Geography',
      duration: 60,
      topics: ['human-geography', 'population', 'migration', 'demographics'],
      difficulty: 'intermediate',
      isPublished: true,
      learningObjectives: [
        'Analyze population distribution patterns',
        'Understand migration factors',
        'Explain urbanization processes'
      ],
      createdBy: adminUser._id
    },
    {
      title: 'Climate Change and Environmental Geography',
      description: 'Study the impacts of climate change on different ecosystems.',
      content: `
        <h1>Climate Change and Environmental Geography</h1>
        <p>This lesson explores the causes and consequences of climate change on global ecosystems...</p>
        <h2>Key Areas:</h2>
        <ul>
          <li>Greenhouse effect and global warming</li>
          <li>Impact on polar regions</li>
          <li>Sea level rise consequences</li>
          <li>Mitigation and adaptation strategies</li>
        </ul>
      `,
      gradeLevel: 'Grade 12',
      subject: 'Geography',
      duration: 75,
      topics: ['climate-change', 'environment', 'sustainability', 'ecosystems'],
      difficulty: 'advanced',
      isPublished: true,
      learningObjectives: [
        'Understand greenhouse effect mechanisms',
        'Analyze climate change impacts',
        'Evaluate mitigation strategies'
      ],
      createdBy: adminUser._id
    }
  ];

  console.log('Seeding lessons...');
  const createdLessons = [];
  for (const lessonData of lessons) {
    const lesson = await Lesson.create(lessonData);
    createdLessons.push(lesson);
    console.log(`Created lesson: ${lesson.title}`);
  }
  
  return createdLessons;
};

const seedQuizzes = async (lessons) => {
  const quizzes = [
    {
      title: 'Physical Geography Quiz',
      description: 'Test your knowledge of physical geography concepts',
      lesson: lessons[0]._id,
      questions: [
        {
          question: 'What is the outermost layer of the Earth called?',
          options: ['Crust', 'Mantle', 'Core', 'Lithosphere'],
          correctAnswer: 0,
          explanation: 'The crust is the outermost layer of the Earth.'
        },
        {
          question: 'Which process is responsible for mountain formation?',
          options: ['Erosion', 'Plate tectonics', 'Weathering', 'Sedimentation'],
          correctAnswer: 1,
          explanation: 'Plate tectonics causes the movement of Earth\'s plates, leading to mountain formation.'
        }
      ],
      timeLimit: 20,
      passingScore: 70,
      maxAttempts: 3,
      isActive: true
    },
    {
      title: 'Population Geography Quiz',
      description: 'Assess your understanding of population distribution',
      lesson: lessons[1]._id,
      questions: [
        {
          question: 'What does population density measure?',
          options: [
            'Number of people per square kilometer',
            'Total population of a country',
            'Birth rate minus death rate',
            'Migration patterns'
          ],
          correctAnswer: 0,
          explanation: 'Population density measures number of people per unit area.'
        },
        {
          question: 'Which factor is NOT a push factor for migration?',
          options: ['War', 'Economic opportunity', 'Natural disaster', 'Political instability'],
          correctAnswer: 1,
          explanation: 'Economic opportunity is a pull factor, not a push factor.'
        }
      ],
      timeLimit: 15,
      passingScore: 75,
      maxAttempts: 2,
      isActive: true
    }
  ];

  console.log('Seeding quizzes...');
  for (const quizData of quizzes) {
    await Quiz.create(quizData);
    console.log(`Created quiz: ${quizData.title}`);
  }
};

const seedGeoPoints = async () => {
  const adminUser = await User.findOne({ email: 'admin@geolearnhub.com' });
  
  const geoPoints = [
    {
      title: 'Mount Everest',
      description: 'The highest mountain on Earth, located in the Himalayas.',
      coordinates: { lat: 27.9881, lng: 86.9250 },
      type: 'terrain',
      elevation: 8848,
      facts: [
        'Highest point on Earth',
        'First successfully climbed in 1953',
        'Located on border of Nepal and Tibet'
      ],
      tags: ['mountain', 'himalayas', 'asia'],
      createdBy: adminUser._id
    },
    {
      title: 'Amazon Rainforest',
      description: 'The largest tropical rainforest in the world.',
      coordinates: { lat: -3.4653, lng: -62.2159 },
      type: 'terrain',
      area: 5500000, // in sq km
      climate: 'Tropical',
      facts: [
        'Produces 20% of world\'s oxygen',
        'Home to 10% of known species',
        'Often called "lungs of the Earth"'
      ],
      tags: ['rainforest', 'ecosystem', 'south-america'],
      createdBy: adminUser._id
    },
    {
      title: 'Great Barrier Reef',
      description: 'World\'s largest coral reef system.',
      coordinates: { lat: -18.2871, lng: 147.6992 },
      type: 'terrain',
      facts: [
        'Visible from space',
        'Composed of over 2,900 individual reefs',
        'World Heritage Site since 1981'
      ],
      tags: ['coral-reef', 'marine', 'australia'],
      createdBy: adminUser._id
    },
    {
      title: 'Sahara Desert',
      description: 'The largest hot desert in the world.',
      coordinates: { lat: 23.4162, lng: 25.6628 },
      type: 'terrain',
      area: 9200000, // in sq km
      climate: 'Arid',
      facts: [
        'Largest hot desert',
        'Covers about 31% of Africa',
        'Temperatures can exceed 50°C'
      ],
      tags: ['desert', 'africa', 'arid'],
      createdBy: adminUser._id
    }
  ];

  console.log('Seeding geo points...');
  for (const geoPointData of geoPoints) {
    await GeoPoint.create(geoPointData);
    console.log(`Created geo point: ${geoPointData.title}`);
  }
};

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Lesson.deleteMany({});
    await Quiz.deleteMany({});
    await GeoPoint.deleteMany({});
    console.log('Cleared existing data');

    // Seed data
    await seedUsers();
    const lessons = await seedLessons();
    await seedQuizzes(lessons);
    await seedGeoPoints();

    console.log('✅ Seed data created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

// Run seed if called directly
if (process.argv[2] === '--seed') {
  seedData();
}

export default seedData;