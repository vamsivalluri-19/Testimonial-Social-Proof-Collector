require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Space = require('../models/Space');
const Testimonial = require('../models/Testimonial');
const RefreshToken = require('../models/RefreshToken');

const seedData = async () => {
  try {
    await connectDB();
    console.log('[Seed] Clearing existing collections...');

    await User.deleteMany({});
    await Space.deleteMany({});
    await Testimonial.deleteMany({});
    await RefreshToken.deleteMany({});

    console.log('[Seed] Creating demo user...');
    const passwordHash = await User.hashPassword('Password123!');
    const user = await User.create({
      name: 'Sarah Connor',
      email: 'owner@proofly.io',
      username: 'sarah_proofly',
      passwordHash,
      isEmailVerified: true,
    });

    console.log(`[Seed] Created User: ${user.email} (Password: Password123!)`);

    console.log('[Seed] Creating sample spaces...');
    const space1 = await Space.create({
      owner: user._id,
      name: 'Acme Corp Testimonials',
      slug: 'acme-corp',
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
      prompt: 'How has Acme Corp helped your business scale?',
      avatarSetting: 'optional',
      ratingSetting: 'required',
      customQuestions: [
        { label: 'What feature did you love most?', required: false },
        { label: 'Would you recommend us to a colleague?', required: true },
      ],
      theme: {
        primaryColor: '#6366f1',
        backgroundColor: '#f8fafc',
        textColor: '#0f172a',
        darkMode: false,
      },
    });

    const space2 = await Space.create({
      owner: user._id,
      name: 'Saasify Product Reviews',
      slug: 'saasify',
      logo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=200&q=80',
      prompt: 'Share your feedback on our new analytics workflow!',
      avatarSetting: 'required',
      ratingSetting: 'required',
      customQuestions: [{ label: 'Your team size?', required: false }],
      theme: {
        primaryColor: '#10b981',
        backgroundColor: '#111827',
        textColor: '#f9fafb',
        darkMode: true,
      },
    });

    console.log('[Seed] Sample spaces created.');

    console.log('[Seed] Creating sample testimonials...');
    const sampleTestimonials = [
      {
        space: space1._id,
        clientName: 'Alex Johnson',
        email: 'alex.j@techcorp.com',
        companyRole: 'CTO at TechCorp',
        rating: 5,
        reviewText: 'Proofly transformed how we collect customer social proof! Within 48 hours of embedding the Wall of Love, our landing page conversion rate spiked by 24%. Highly recommended!',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        status: 'approved',
        featured: true,
        liked: true,
        customAnswers: [
          { question: 'What feature did you love most?', answer: 'One-click widget embed generator!' },
          { question: 'Would you recommend us to a colleague?', answer: 'Absolutely 100%' },
        ],
      },
      {
        space: space1._id,
        clientName: 'Elena Rostova',
        email: 'elena@designhub.io',
        companyRole: 'Head of Product at DesignHub',
        rating: 5,
        reviewText: 'Sleek interface, zero friction for our customers submitting reviews, and automatic spam filtering. The embed widgets look like custom handcrafted components on our site.',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
        status: 'approved',
        featured: true,
        liked: true,
      },
      {
        space: space1._id,
        clientName: 'Marcus Vance',
        email: 'marcus@growthkit.com',
        companyRole: 'Growth Lead at GrowthKit',
        rating: 4,
        reviewText: 'Great product and stellar customer support. The analytics dashboard gives us exact insights into review velocity and star distributions.',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        status: 'approved',
        featured: false,
        liked: false,
      },
      {
        space: space1._id,
        clientName: 'David Kim',
        email: 'david@venturelabs.com',
        companyRole: 'Founder at VentureLabs',
        rating: 5,
        reviewText: 'The video and text testimonial submission flow is so clean. We received 15 glowing reviews in our first week alone!',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        status: 'pending',
        featured: false,
        liked: false,
      },
      {
        space: space1._id,
        clientName: 'Sophia Martinez',
        email: 'sophia@cloudscale.net',
        companyRole: 'Marketing Director',
        rating: 3,
        reviewText: 'Good software overall. Would love to see more widget layout customization options in future updates.',
        avatarUrl: '',
        status: 'pending',
        featured: false,
        liked: false,
      },
      {
        space: space2._id,
        clientName: 'Brian O’Connor',
        email: 'brian@saasflow.io',
        companyRole: 'VP of Engineering',
        rating: 5,
        reviewText: 'Saasify analytics helped us trace funnel drop-offs with pin-point accuracy. The team loves it!',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
        status: 'approved',
        featured: true,
        liked: true,
      },
      {
        space: space2._id,
        clientName: 'Clara Oswald',
        email: 'clara@timelabs.org',
        companyRole: 'Data Scientist',
        rating: 4,
        reviewText: 'Very intuitive timeseries reporting! Highly reliable API response speeds.',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
        status: 'approved',
        featured: false,
        liked: true,
      },
    ];

    await Testimonial.insertMany(sampleTestimonials);
    console.log(`[Seed] Created ${sampleTestimonials.length} sample testimonials.`);

    console.log('[Seed] Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedData();
