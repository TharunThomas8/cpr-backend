const express = require('express');
const router = express.Router();
const { Trainer, Data, CPRDetail } = require('../models/data');
const axios = require('axios');

const api_base = "https://cpr-backend.vercel.app/";

// GET request to retrieve all data
router.get('/get-all', (req, res) => {
  Data.find() // Add projection to include only the specified fields
    .then((data) => {
      res.json({ success: true, data });
    })
    .catch((error) => {
      console.error('Error retrieving messages:', error);
      res.status(500).json({ success: false, message: 'An error occurred' });
    });
});

// POST request to save a session
router.post('/save', (req, res) => {
  const { userId, cprRate, cprFraction, compression, totalTime, breaths, feedback, compOnly, reps } = req.body;
  if (cprRate === null){
    cprRate = 0;
  }
  // console.log('req.body', compOnly);
  // Check if the user exists
  Data.findOne({ userId })
    .then((existingUser) => {
      if (existingUser) {
        // User exists, append the CPR detail

        existingUser.cprDetails.push({ cprRate, cprFraction, compression, totalTime, breaths, feedback, compOnly, reps });
        existingUser
          .save()
          .then(() => {
            res.json({ success: true, message: 'Data saved successfully' });
          })
          .catch((error) => {
            console.error('Error saving data:', error);
            res.status(500).json({ success: false, message: 'An error occurred' });
          });
      } else {
        // User does not exist, create a new row
        const newData = new Data({
          userId,
          cprDetails: [{ cprRate, cprFraction, compression, totalTime, breaths, feedback, compOnly, reps }],
        });
        newData
          .save()
          .then(() => {
            res.json({ success: true, message: 'Data saved successfully' });
          })
          .catch((error) => {
            console.error('Error saving data:', error);
            res.status(500).json({ success: false, message: 'An error occurred' });
          });
      }
    })
    .catch((error) => {
      console.error('Error checking user existence:', error);
      res.status(500).json({ success: false, message: 'An error occurred' });
    });
});

// POST request to save a game
router.post('/save-game-details', (req, res) => {
  const { userId, gameName, gameScore } = req.body;

  // Check if the user exists
  Data.findOne({ userId })
    .then((existingUser) => {
      if (existingUser) {
        // User exists, append the game detail
        existingUser.gameDetails.push({ gameName, gameScore });
        existingUser
          .save()
          .then(() => {
            res.json({ success: true, message: 'Game details saved successfully' });
          })
          .catch((error) => {
            console.error('Error saving game details:', error);
            res.status(500).json({ success: false, message: 'An error occurred' });
          });
      } else {
        // User does not exist
        res.status(404).json({ success: false, message: 'User not found' });
      }
    })
    .catch((error) => {
      console.error('Error checking user existence:', error);
      res.status(500).json({ success: false, message: 'An error occurred' });
    });
});

router.get('/get-top-score/:userId', (req, res) => {
  console.log('get-top-score');
  const { userId } = req.params;

  Data.findOne({ userId })
    .select('gameDetails.gameScore') // Select only the gameScore field
    .then((user) => {
      if (user && user.gameDetails.length > 0) {
        // Sort the gameDetails array in descending order by gameScore
        const sortedGameDetails = user.gameDetails.sort((a, b) => b.gameScore - a.gameScore);
        console.log(sortedGameDetails);
        const topScore = sortedGameDetails[0].gameScore;
        res.json({ success: true, topScore });
      } else {
        res.status(404).json({ success: false, message: 'User or game details not found' });
      }
    })
    .catch((error) => {
      console.error('Error retrieving top score:', error);
      res.status(500).json({ success: false, message: 'An error occurred' });
    });
});


router.get('/get-recent-score/:userId', (req, res) => {
  const { userId } = req.params;

  Data.findOne({ userId })
    .select({ gameDetails: { $slice: -1 } }) // Select the last element from the gameDetails array
    .then((user) => {
      if (user && user.gameDetails.length > 0) {
        const recentScore = user.gameDetails[0];
        res.json({ success: true, recentScore });
      } else {
        res.status(404).json({ success: false, message: 'User or game details not found' });
      }
    })
    .catch((error) => {
      console.error('Error retrieving recent score:', error);
      res.status(500).json({ success: false, message: 'An error occurred' });
    });
});

router.get('/get-top-scores', (req, res) => {
  Data.aggregate([
    { $unwind: '$gameDetails' }, // Unwind the gameDetails array
    { $sort: { 'gameDetails.gameScore': -1 } }, // Sort in descending order based on gameScore
    { $limit: 10 }, // Limit the result to 10 documents
    { $group: { _id: '$userId', topScore: { $first: '$gameDetails' } } }, // Group by userId and select the first gameDetails as topScore
    { $project: { _id: 0, userId: '$_id', topScore: 1 } }, // Project the fields to remove _id and rename _id to userId
  ])
    .then((topScores) => {
      res.json({ success: true, topScores });
    })
    .catch((error) => {
      console.error('Error retrieving top scores:', error);
      res.status(500).json({ success: false, message: 'An error occurred' });
    });
});

// GET request to retrieve data for a specific user
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
      console.error('Error retrieving data:', error);
      res.status(500).json({ success: false, message: 'An error occurred' });
    });
});

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
            console.error('Error creating user:', error);
            res.status(500).json({ success: false, message: 'An error occurred' });
          });
      }
    })
    .catch((error) => {
      console.error('Error finding user:', error);
      res.status(500).json({ success: false, message: 'An error occurred' });
    });
});

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
      console.error('Error retrieving CPR details:', error);
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
      console.error('Error creating trainer:', error);
      res.status(500).json({ success: false, message: 'An error occurred' });
    });
});

// // Add a user to a trainer
// router.post('/add-user', (req, res) => {
//   const { trainerId, userId } = req.body;

//   Trainer.findOneAndUpdate(
//     { trainerId },
//     { $addToSet: { userIds: userId } }, // Add userId to the trainer's userIds array
//     { new: true }
//   )
//     .then((trainer) => {
//       if (trainer) {
//         res.json({ success: true, message: 'User added to trainer successfully' });
//       } else {
//         res.status(404).json({ success: false, message: 'Trainer not found' });
//       }
//     })
//     .catch((error) => {
//       console.error('Error adding user to trainer:', error);
//       res.status(500).json({ success: false, message: 'An error occurred' });
//     });
// });

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
                  console.error('Error creating user:', error);
                  res.status(500).json({ success: false, message: 'An error occurred' });
                });
            } else {
              res.status(404).json({ success: false, message: 'Trainer not found' });
            }
          })
          .catch((error) => {
            console.error('Error adding user to trainer:', error);
            res.status(500).json({ success: false, message: 'An error occurred' });
          });
      }
    })
    .catch((error) => {
      console.error('Error finding user:', error);
      res.status(500).json({ success: false, message: 'An error occurred' });
    });
});

// Get users for a trainer
router.get('/get-users/:trainerId', (req, res) => {
  const { trainerId } = req.params;

  Trainer.findOne({ trainerId })
    .populate('userIds', 'userId') // Populate the userIds field and include only the userId field in the response
    .then((trainer) => {
      if (trainer) {
        res.json({ success: true, users: trainer.userIds });
      } else {
        res.status(404).json({ success: false, message: 'Trainer not found' });
      }
    })
    .catch((error) => {
      console.error('Error retrieving users for trainer:', error);
      res.status(500).json({ success: false, message: 'An error occurred' });
    });
});


module.exports = router;
