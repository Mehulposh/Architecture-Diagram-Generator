const User = require('../models/user');
const express = require('express');
const requireAuth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const router = express.Router();


router.get('/me', requireAuth, async (req,res) => {
     try {
       const user = await User.findById(req.userId).select("-password");

        if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found",
        });
        }

        res.status(200).json({
        success: true,
        user,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
        success: false,
        message: "Server Error",
        });
    }
} )


router.put("/me", requireAuth , async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    user.name = name;
    user.email = email;

    await user.save();

    res.json({ user });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

router.put("/me/password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    await user.setPassword(newPassword);

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});


module.exports = router