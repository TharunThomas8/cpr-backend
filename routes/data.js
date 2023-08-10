const express = require('express');
const router = express.Router();
const { Trainer, Data, CPRDetail } = require('../models/data');
const axios = require('axios');
const api_base = "https://cpr-backend.vercel.app/";

// Get all data
router.get('/get-all', (req, res) => {
  Data.find()
    .then((data) => {
      res.json({ success: true, data });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ success: false, message: 'An error occurred' });
    });
});

// Save CPR session data
router.post('/save', (req, res) => {
  const { userId, cprRate, cprFraction, compression, totalTime, breaths, feedback, compOnly, reps } = req.body;
  if (cprRate === null) {
    cprRate = 0;
  }

  Data.findOne({ userId })
    .then((existingUser) => {
      if (existingUser) {
        existingUser.cprDetails.push({ cprRate, cprFraction, compression, totalTime, breaths, feedback, compOnly, reps });
        existingUser.save()
          .then(() => {
            res.json({ success: true, message: 'Data saved successfully' });
          })
          .catch((error) => {
            console.error(error);
            res.status(500).json({ success: false, message: 'An error occurred' });
          });
      } else {
        const newData = new Data({
          userId,
          cprDetails: [{ cprRate, cprFraction, compression, totalTime, breaths, feedback, compOnly, reps }],
        });
        newData.save()
          .then(() => {
            res.json({ success: true, message: 'Data saved successfully' });
          })
          .catch((error) => {
            console.error(error);
            res.status(500).json({ success: false, message: 'An error occurred' });
          });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ success: false, message: 'An error occurred' });
    });
});

// Save game details

router.post('/save-game-details', (req, res) => {
  const { userId, gameName, gameScore } = req.body;

  Data.findOne({ userId })
    .then((existingUser) => {
      if (existingUser) {
        existingUser.gameDetails.push({ gameName, gameScore });
        existingUser.save()
          .then(() => {
            res.json({ success: true, message: 'Game details saved successfully' });
          })
          .catch((error) => {
            console.error(error);
            res.status(500).json({ success: false, message: 'An error occurred' });
          });
      } else {
        res.status(404).json({ success: false, message: 'User not found' });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ success: false, message: 'An error occurred' });
    });
});

// Get the top game score for a user

router.get('/get-top-score/:userId', (req, res) => {
  const { userId } = req.params;

  Data.findOne({ userId })
    .select('gameDetails.gameScore')
    .then((user) => {
      if (user && user.gameDetails.length > 0) {
        const sortedGameDetails = user.gameDetails.sort((a, b) => b.gameScore - a.gameScore);
        const topScore = sortedGameDetails[0].gameScore;
        res.json({ success: true, topScore });
      } else {
        res.status(404).json({ success: false, message: 'User or game details not found' });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ success: false, message: 'An error occurred' });
    });
});

// Get the most recent game score for a user

router.get('/get-recent-score/:userId', (req, res) => {
  const { userId } = req.params;

  Data.findOne({ userId })
    .select({ gameDetails: { $slice: -1 } })
    .then((user) => {
      if (user && user.gameDetails.length > 0) {
        const recentScore = user.gameDetails[0];
        res.json({ success: true, recentScore });
      } else {
        res.status(404).json({ success: false, message: 'User or game details not found' });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ success: false, message: 'An error occurred' });
    });
});

// Get the top game scores across all users

router.get('/get-top-scores', (req, res) => {
  Data.aggregate([
    { $unwind: '$gameDetails' },
    { $sort: { 'gameDetails.gameScore': -1 } },
    { $limit: 10 },
    { $group: { _id: '$userId', topScore: { $first: '$gameDetails' } } },
    { $project: { _id: 0, userId: '$_id', topScore: 1 } },
  ])
    .then((topScores) => {
      res.json({ success: true, topScores });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ success: false, message: 'An error occurred' });
    });
});

// Get data for a specific user

router.get('/get-user-data/:userId', (req, res) => {
  const { userId } = req.params;

  Data.findOne({ userId })
    .then((userData) => {
      if (userData) {
        res.json({ success: true, data: userData });
      } else {
        res.status(404).json({ success: false, message: 'User not found' });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ success: false, message: 'An error occurred' });
    });
});

// Create a new user

router.post('/create-user', (req, res) => {
  const { userId } = req.body;

  Data.findOne({ userId })
    .then((existingUser) => {
      if (existingUser) {
        res.json({ success: false, message: 'User already exists' });
      } else {
        const newUser = new Data({ userId });

        newUser.save()
          .then(() => {
            res.json({ success: true, message: 'User created successfully' });
          })
          .catch((error) => {
            console.error(error);
            res.status(500).json({ success: false, message: 'An error occurred' });
          });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ success: false, message: 'An error occurred' });
    });
});

// Get the last few CPR details for a user

router.get('/get-last/:userId', (req, res) => {
  const { userId } = req.params;

  Data.findOne({ userId })
    .then((user) => {
      if (user) {
        const last3CPRDetails = user.cprDetails.slice(-3);
        res.json({ success: true, data: last3CPRDetails });
      } else {
        res.status(404).json({ success: false, message: 'User not found' });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ success: false, message: 'An error occurred' });
    });
});

// Create a new trainer

router.post('/create-trainer', (req, res) => {
  const { trainerId, name } = req.body;
  const newTrainer = new Trainer({ trainerId, name });

  newTrainer.save()
    .then(() => {
      res.json({ success: true, message: 'Trainer created successfully' });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ success: false, message: 'An error occurred' });
    });
});

// Add a user to a trainer's list

router.post('/add-user', (req, res) => {
  const { trainerId, userId } = req.body;

  Data.findOne({ userId })
    .then((existingUser) => {
      if (existingUser) {
        res.json({ success: false, message: 'User already exists' });
      } else {
        Trainer.findOneAndUpdate(
          { trainerId },
          { $addToSet: { userIds: userId } },
          { new: true }
        )
          .then((trainer) => {
            if (trainer) {
              axios.post(api_base + '/create-user', { userId })
                .then((response) => {
                  if (response.data.success) {
                    res.json({ success: true, message: 'User added to trainer successfully' });
                  } else {
                    res.status(500).json({ success: false, message: 'Error creating user' });
                  }
                })
                .catch((error) => {
                  console.error(error);
                  res.status(500).json({ success: false, message: 'An error occurred' });
                });
            } else {
              res.status(404).json({ success: false, message: 'Trainer not found' });
            }
          })
          .catch((error) => {
            console.error(error);
            res.status(500).json({ success: false, message: 'An error occurred' });
          });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ success: false, message: 'An error occurred' });
    });
});

// Get all users associated with a trainer

router.get('/get-users/:trainerId', (req, res) => {
  const { trainerId } = req.params;

  Trainer.findOne({ trainerId })
    .populate('userIds', 'userId')
    .then((trainer) => {
      if (trainer) {
        res.json({ success: true, users: trainer.userIds });
      } else {
        res.status(404).json({ success: false, message: 'Trainer not found' });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ success: false, message: 'An error occurred' });
    });
});

module.exports = router;
