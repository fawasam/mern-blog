import mongoose from "mongoose";
import Blog from "./Schema/Blog.js";
import "dotenv/config";
async function seedProducts(products) {
  try {
    // Connect to MongoDB
    await mongoose
      .connect(process.env.MONGO_URI, {
        autoIndex: true,
      })
      .then(() => {
        console.log("Connected to MongoDB");
      })
      .catch((err) => {
        console.error("Error connecting to MongoDB:", err.message);
      });

    // Clear existing product data (optional, adjust based on your needs)
    await Blog.deleteMany({});

    // Seed data
    await Blog.insertMany(products);

    console.log("Products successfully seeded!");
  } catch (error) {
    console.error("Error seeding products:", error);
  } finally {
    // Close connection
    mongoose.disconnect();
  }
}

const ObjectId = mongoose.Types.ObjectId;
const authorId = new ObjectId("65951202150f6a28b096d6cd");
// Define your product data as an array of objects
const products = [
  {
    blog_id: "Blog-4e931sZ6l8m90u2t7y5q",
    title: "Conquering Mount Everest",
    banner: "http://localhost:3000/uploads/image-1705945749635.JPG",
    desc: "A journey to the top of the world.",
    content: [
      {
        time: { $numberDouble: "1705945730676.0" },
        blocks: [
          {
            id: "X23q5W7t4N",
            type: "paragraph",
            data: {
              text: "Face the challenge of climbing Mount Everest, the highest mountain on Earth, and experience the breathtaking views and raw beauty of the Himalayas.",
            },
          },
        ],
        version: "2.27.2",
      },
    ],
    tags: ["adventure", "mountains", "nepal"],
    author: authorId,

    comments: [],
    draft: false,
  },
  {
    blog_id: "Blog-abc123",
    title: "Exploring Ancient Ruins",
    banner: "http://localhost:3000/uploads/image-1705945749635.JPG",
    desc: "Uncover the mysteries of ancient civilizations.",
    content: [
      {
        time: { $numberDouble: "1705945730676.0" },
        blocks: [
          {
            id: "123456",
            type: "paragraph",
            data: {
              text: "Embark on a journey to explore the fascinating ruins of ancient civilizations, and learn about the history and culture of bygone eras.",
            },
          },
        ],
        version: "2.27.2",
      },
    ],
    tags: ["history", "archaeology", "travel"],
    author: authorId,
    comments: [],
    draft: false,
  },
  {
    blog_id: "Blog-7x0v9w2y3z4t5u6m8n1d0p",
    title: "Decoding the Secrets of Ancient Egypt",
    banner: "http://localhost:3000/uploads/image-1705945749635.JPG",
    desc: "Unravel the mysteries of pyramids, pharaohs, and hieroglyphics",
    content: [
      {
        time: { $numberDouble: "1705945762647.0" },
        blocks: [
          {
            id: "Z89r0s1t2V",
            type: "paragraph",
            data: {
              text: "Travel back in time to the land of the pharaohs, explore the majestic pyramids, decipher the cryptic hieroglyphics, and uncover the fascinating history of ancient Egypt.",
            },
          },
        ],
        version: "2.27.2",
      },
    ],
    tags: ["history", "archaeology", "egypt"],
    author: authorId,
    comments: [],
    draft: false,
  },
  {
    blog_id: "Blog-456def",
    title: "Culinary Expedition",
    banner: "http://localhost:3000/uploads/image-1705945749635.JPG",
    desc: "Discover the world through its diverse cuisines.",
    content: [
      {
        time: { $numberDouble: "1705945730676.0" },
        blocks: [
          {
            id: "456789",
            type: "paragraph",
            data: {
              text: "Embark on a culinary journey around the globe, savoring the flavors of different cuisines and experiencing the rich tapestry of food culture.",
            },
          },
        ],
        version: "2.27.2",
      },
    ],
    tags: ["food", "travel", "culinary"],
    author: authorId,
    comments: [],
    draft: false,
  },
  {
    blog_id: "Blog-xyz789",
    title: "Sailing the Seven Seas",
    banner: "http://localhost:3000/uploads/image-1705945749635.JPG",
    desc: "Embark on a maritime adventure across the world's oceans.",
    content: [
      {
        time: { $numberDouble: "1705945730676.0" },
        blocks: [
          {
            id: "789012",
            type: "paragraph",
            data: {
              text: "Set sail on a grand voyage to explore the vastness of the seven seas, encountering diverse cultures, marine life, and incredible landscapes along the way.",
            },
          },
        ],
        version: "2.27.2",
      },
    ],
    tags: ["sailing", "adventure", "oceans"],
    author: authorId,
    comments: [],
    draft: false,
  },
  {
    blog_id: "Blog-4e931sZ6l8m90u2t7q",
    title: "Conquering Mount Everest",
    banner: "http://localhost:3000/uploads/image-1705945749635.JPG",
    desc: "A journey to the top of the world.",
    content: [
      {
        time: { $numberDouble: "1705945730676.0" },
        blocks: [
          {
            id: "X23q5W7t4N",
            type: "paragraph",
            data: {
              text: "Face the challenge of climbing Mount Everest, the highest mountain on Earth, and experience the breathtaking views and raw beauty of the Himalayas.",
            },
          },
        ],
        version: "2.27.2",
      },
    ],
    tags: ["adventure", "mountains", "nepal"],
    author: authorId,

    comments: [],
    draft: false,
  },
  {
    blog_id: "Blog-4564354def",
    title: "Culinary Expedition",
    banner: "http://localhost:3000/uploads/image-1705945749635.JPG",
    desc: "Discover the world through its diverse cuisines.",
    content: [
      {
        time: { $numberDouble: "1705945730676.0" },
        blocks: [
          {
            id: "456789",
            type: "paragraph",
            data: {
              text: "Embark on a culinary journey around the globe, savoring the flavors of different cuisines and experiencing the rich tapestry of food culture.",
            },
          },
        ],
        version: "2.27.2",
      },
    ],
    tags: ["food", "travel", "culinary"],
    author: authorId,
    comments: [],
    draft: false,
  },
];

// Run the seeding function
seedProducts(products);
