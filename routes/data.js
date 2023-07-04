const express = require('express');
const router = express.Router();
const { Trainer, Data } = require('../models/data');
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

// POST request to save a new message
router.post('/save', (req, res) => {
  const { userId, cprRate, cprFraction, compression, totalTime, breaths, feedback } = req.body;

  // Check if the user exists
  Data.findOne({ userId })
    .then((existingUser) => {
      if (existingUser) {
        // User exists, append the CPR detail
        existingUser.cprDetails.push({ cprRate, cprFraction, compression, totalTime, breaths, feedback });
        existingUser
          .save()
          .then(() => {
            res.json({ success: true, message: 'Data saved successfully' });
            // console.log(cprRate);
          })
          .catch((error) => {
            console.error('Error saving data:', error);
            res.status(500).json({ success: false, message: 'An error occurred' });
          });
      } else {
        // User does not exist, create a new row
        const newData = new Data({
          userId,
          cprDetails: [{ cprRate, cprFraction, compression, totalTime, breaths, feedback }],
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
