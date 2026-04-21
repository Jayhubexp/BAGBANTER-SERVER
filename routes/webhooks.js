const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Order = require('../models/Order');
const User = require('../models/User');

router.post('/paystack', async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;

  const hash = crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(400).send('Invalid Signature');
  }

  const event = req.body;

  if (event.event === 'charge.success') {
    const { orderId, userId } = event.data.metadata;

    await Order.findByIdAndUpdate(orderId, { paymentStatus: 'paid' });

    // Link order to user
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { orders: orderId },
      });
    }

    console.log(`✅ Order ${orderId} paid via webhook`);
  }

  res.sendStatus(200);
});

module.exports = router;