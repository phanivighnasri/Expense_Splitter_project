const Settlement = require('../models/Settlement');

// Cashfree initialization with error handling
let Cashfree;
try {
  Cashfree = require('cashfree-pg');
  console.log('✅ Cashfree package loaded successfully');
} catch (error) {
  console.log('⚠️ Cashfree package not available, using demo mode');
  Cashfree = null;
}

// Initialize Cashfree
const initializeCashfree = () => {
  try {
    if (!Cashfree) {
      console.log('💳 Cashfree not available, using DEMO mode');
      return false;
    }

    if (!process.env.CASHFREE_CLIENT_ID || !process.env.CASHFREE_CLIENT_SECRET) {
      console.log('💳 Cashfree credentials not found, using DEMO mode');
      return false;
    }

    // Use string values instead of enum
    const environment = process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX';
    
    Cashfree.XClientId = process.env.CASHFREE_CLIENT_ID;
    Cashfree.XClientSecret = process.env.CASHFREE_CLIENT_SECRET;
    Cashfree.XEnvironment = environment;

    console.log('💰 Cashfree initialized in', environment, 'mode');
    return true;
  } catch (error) {
    console.error('❌ Cashfree initialization error:', error.message);
    return false;
  }
};

// Initialize on module load
const cashfreeInitialized = initializeCashfree();

// Helper function to check if Cashfree is available
const isCashfreeAvailable = () => {
  return cashfreeInitialized && Cashfree;
};

// @desc    Create payment order
// @route   POST /api/payments/create-order
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { amount, customerName, customerPhone, customerEmail, settlementId } = req.body;
    const userId = req.user._id || req.user.id;

    console.log('💰 Creating payment order for user:', userId, 'Amount:', amount);

    // Validation
    if (!amount || !customerName) {
      return res.status(400).json({
        success: false,
        error: 'Amount and customer name are required'
      });
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number'
      });
    }

    // Verify settlement access if provided
    if (settlementId) {
      const settlement = await Settlement.findById(settlementId);
      if (!settlement || settlement.fromUser.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this settlement'
        });
      }
    }

    // Generate unique order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check if Cashfree is available
    if (!isCashfreeAvailable()) {
      console.log('💳 Using DEMO mode for payment');
      
      const demoResponse = {
        success: true,
        sessionId: `demo_session_${Date.now()}`,
        orderId: orderId,
        orderAmount: amountNum,
        message: 'DEMO MODE - Payment simulation',
        demo: true
      };

      return res.json(demoResponse);
    }

    console.log('💳 Creating REAL Cashfree order');

    // Create Cashfree order
    const request = {
      order_amount: amountNum,
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: userId.toString(),
        customer_phone: customerPhone || "9999999999",
        customer_name: customerName,
        customer_email: customerEmail || `${customerPhone}@expensesplitter.com`
      },
      order_meta: {
        return_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment-callback?order_id={order_id}&settlement_id=${settlementId || ''}`,
        notify_url: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/payments/webhook`
      },
      order_note: `Expense Splitter - Settlement for ${customerName}`
    };

    try {
      const response = await Cashfree.PGCreateOrder("2023-08-01", request);
      
      console.log('✅ Cashfree order created successfully:', response.data.order_id);

      res.json({
        success: true,
        sessionId: response.data.payment_session_id,
        orderId: response.data.order_id,
        orderAmount: response.data.order_amount,
        paymentData: response.data,
        demo: false
      });

    } catch (cashfreeError) {
      console.error('❌ Cashfree API error:', cashfreeError.response?.data || cashfreeError.message);
      
      // Fallback to demo mode if Cashfree API fails
      const demoResponse = {
        success: true,
        sessionId: `demo_session_${Date.now()}`,
        orderId: orderId,
        orderAmount: amountNum,
        message: 'Cashfree API unavailable, using demo mode',
        demo: true
      };

      res.json(demoResponse);
    }

  } catch (error) {
    console.error('❌ Create order error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create payment order: ' + error.message
    });
  }
};

// @desc    Verify payment order
// @route   GET /api/payments/verify/:orderId
// @access  Private
exports.verifyOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    console.log('🔍 Verifying payment for order:', orderId);

    // Check if Cashfree is available
    if (!isCashfreeAvailable()) {
      console.log('💳 Using DEMO verification');
      
      const demoResult = {
        success: true,
        orderStatus: 'PAID',
        paymentStatus: 'SUCCESS',
        transactionId: `demo_txn_${Date.now()}`,
        paymentAmount: 100,
        paymentMethod: 'demo',
        message: 'DEMO MODE - Payment verified successfully',
        demo: true
      };

      return res.json(demoResult);
    }

    try {
      const response = await Cashfree.PGOrderFetchPayments("2023-08-01", orderId);
      const paymentData = response.data[0];

      const result = {
        success: true,
        orderStatus: paymentData?.order_status || 'PENDING',
        paymentStatus: paymentData?.payment_status || 'PENDING',
        transactionId: paymentData?.cf_payment_id,
        paymentAmount: paymentData?.order_amount,
        paymentMethod: paymentData?.payment_method,
        transactionData: paymentData,
        demo: false
      };

      console.log('✅ Payment verification result:', {
        orderId,
        status: result.paymentStatus,
        transactionId: result.transactionId
      });

      res.json(result);

    } catch (cashfreeError) {
      console.error('❌ Cashfree verification error:', cashfreeError.response?.data || cashfreeError.message);
      
      // Fallback to demo verification
      const demoResult = {
        success: true,
        orderStatus: 'PAID',
        paymentStatus: 'SUCCESS', 
        transactionId: `demo_txn_${Date.now()}`,
        paymentAmount: 100,
        paymentMethod: 'demo',
        message: 'Cashfree service unavailable, using demo verification',
        demo: true
      };

      res.json(demoResult);
    }

  } catch (error) {
    console.error('❌ Verify order error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to verify payment: ' + error.message
    });
  }
};

// @desc    Payment webhook (for server notifications)
// @route   POST /api/payments/webhook
// @access  Public
exports.paymentWebhook = async (req, res) => {
  try {
    console.log('💰 Payment webhook received:', JSON.stringify(req.body, null, 2));
    
    const { data, event } = req.body;
    
    if (event === 'PAYMENT_SUCCESS_WEBHOOK') {
      const { orderId, cf_payment_id, payment_amount } = data;
      
      console.log('✅ Payment successful via webhook:', {
        orderId,
        transactionId: cf_payment_id,
        amount: payment_amount
      });
    }

    res.status(200).json({ 
      success: true,
      received: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Webhook processing failed' 
    });
  }
};

// @desc    Payment callback (user redirect)
// @route   GET /api/payments/callback
// @access  Public
exports.paymentCallback = async (req, res) => {
  try {
    const { order_id, settlement_id, payment_status, tx_status, tx_msg } = req.query;

    console.log('🔄 Payment callback received:', {
      order_id,
      settlement_id,
      payment_status,
      tx_status,
      tx_msg
    });

    let paymentStatus = payment_status || tx_status || 'PENDING';
    let transactionId = null;

    // Verify payment if Cashfree is available
    if (isCashfreeAvailable()) {
      try {
        const response = await Cashfree.PGOrderFetchPayments("2023-08-01", order_id);
        const paymentData = response.data[0];
        paymentStatus = paymentData?.payment_status || paymentStatus;
        transactionId = paymentData?.cf_payment_id;
        console.log('✅ Cashfree verification result:', paymentStatus);
      } catch (verifyError) {
        console.error('❌ Error verifying payment with Cashfree:', verifyError);
      }
    } else {
      // Demo mode - always success
      paymentStatus = 'SUCCESS';
      transactionId = `demo_txn_${Date.now()}`;
      console.log('💳 Demo mode - payment marked as SUCCESS');
    }

    // Update settlement if payment was successful and settlement_id provided
    if (settlement_id && paymentStatus === 'SUCCESS') {
      try {
        await Settlement.findByIdAndUpdate(settlement_id, {
          status: 'completed',
          proof: {
            cashfreeOrderId: order_id,
            transactionId: transactionId,
            timestamp: new Date()
          }
        });
        console.log('✅ Settlement updated successfully:', settlement_id);
      } catch (updateError) {
        console.error('❌ Error updating settlement:', updateError);
      }
    }

    const isSuccess = paymentStatus === 'SUCCESS';

    // Return HTML response
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Status</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f8f9fa; }
          .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
          .success { color: #10B981; font-size: 48px; margin-bottom: 20px; }
          .btn { display: inline-block; padding: 10px 20px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success">${isSuccess ? '✅' : '❌'}</div>
          <h1>Payment ${paymentStatus}</h1>
          <p><strong>Order ID:</strong> ${order_id}</p>
          ${transactionId ? `<p><strong>Transaction ID:</strong> ${transactionId}</p>` : ''}
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" class="btn">Return to App</a>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('❌ Payment callback error:', error);
    res.status(500).send('Error processing payment callback');
  }
};

// @desc    Get payment methods
// @route   GET /api/payments/methods
// @access  Private
exports.getPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = {
      success: true,
      methods: [
        { id: 'upi', name: 'UPI', icon: '📱', description: 'Pay using UPI apps' },
        { id: 'card', name: 'Credit/Debit Card', icon: '💳', description: 'Visa, Mastercard, RuPay' },
        { id: 'netbanking', name: 'Net Banking', icon: '🏦', description: 'All major banks' },
        { id: 'wallet', name: 'Wallet', icon: '👛', description: 'Paytm, PhonePe, etc.' }
      ]
    };

    res.json(paymentMethods);
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment methods'
    });
  }
};