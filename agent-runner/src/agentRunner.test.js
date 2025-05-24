const { runAgent } = require('./agentRunner');

// Account Management Tests
async function testLoginTask() {
  const config = {
    url: 'https://example.com/login',
    taskType: 'login',
    inputs: {
      'input-username': 'testuser@example.com',
      'input-password': 'password123'
    },
    useRemoteLabeler: true,
    debugOverlay: true,
    logActions: true
  };

  try {
    const result = await runAgent(config);
    console.log('Login task result:', result);
  } catch (error) {
    console.error('Login task failed:', error);
  }
}

async function testSignupTask() {
  const config = {
    url: 'https://example.com/signup',
    taskType: 'signup',
    inputs: {
      'input-username': 'newuser',
      'input-email': 'newuser@example.com',
      'input-password': 'password123',
      'input-confirm-password': 'password123'
    }
  };

  try {
    const result = await runAgent(config);
    console.log('Signup task result:', result);
  } catch (error) {
    console.error('Signup task failed:', error);
  }
}

// Transaction Tests
async function testPaymentTask() {
  const config = {
    url: 'https://example.com/checkout',
    taskType: 'payment',
    inputs: {
      'input-card-number': '4111111111111111',
      'input-expiry': '12/25',
      'input-cvv': '123'
    },
    timeoutMs: 10000 // Longer timeout for payment processing
  };

  try {
    const result = await runAgent(config);
    console.log('Payment task result:', result);
  } catch (error) {
    console.error('Payment task failed:', error);
  }
}

async function testCartTask() {
  const config = {
    url: 'https://example.com/cart',
    taskType: 'cartManagement',
    inputs: {
      'input-quantity': '2'
    }
  };

  try {
    const result = await runAgent(config);
    console.log('Cart management task result:', result);
  } catch (error) {
    console.error('Cart management task failed:', error);
  }
}

// Content Interaction Tests
async function testSearchTask() {
  const config = {
    url: 'https://example.com/search',
    taskType: 'search',
    inputs: {
      'search-box': 'test query'
    },
    timeoutMs: 10000
  };

  try {
    const result = await runAgent(config);
    console.log('Search task result:', result);
  } catch (error) {
    console.error('Search task failed:', error);
  }
}

async function testFormSubmissionTask() {
  const config = {
    url: 'https://example.com/contact',
    taskType: 'formSubmission',
    inputs: {
      'input-text': 'John Doe',
      'input-email': 'john@example.com',
      'input-textarea': 'This is a test message'
    }
  };

  try {
    const result = await runAgent(config);
    console.log('Form submission task result:', result);
  } catch (error) {
    console.error('Form submission task failed:', error);
  }
}

async function testMessagingTask() {
  const config = {
    url: 'https://example.com/messages',
    taskType: 'messaging',
    inputs: {
      'input-textarea': 'Hello, this is a test message!'
    }
  };

  try {
    const result = await runAgent(config);
    console.log('Messaging task result:', result);
  } catch (error) {
    console.error('Messaging task failed:', error);
  }
}

// Dry Run Example
async function testDryRun() {
  const config = {
    url: 'https://example.com/checkout',
    taskType: 'payment',
    inputs: {
      'input-card-number': '4111111111111111',
      'input-expiry': '12/25',
      'input-cvv': '123'
    },
    dryRun: true,
    debugOverlay: true
  };

  try {
    const result = await runAgent(config);
    console.log('Dry run result:', result);
  } catch (error) {
    console.error('Dry run failed:', error);
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 Starting agent runner tests...\n');

  // Account Management Tests
  console.log('👤 Testing Account Management Tasks:');
  await testLoginTask();
  await testSignupTask();
  console.log('\n');

  // Transaction Tests
  console.log('💳 Testing Transaction Tasks:');
  await testPaymentTask();
  await testCartTask();
  console.log('\n');

  // Content Interaction Tests
  console.log('🔍 Testing Content Interaction Tasks:');
  await testSearchTask();
  await testFormSubmissionTask();
  await testMessagingTask();
  console.log('\n');

  // Dry Run Test
  console.log('🛠️ Testing Dry Run:');
  await testDryRun();
  console.log('\n');

  console.log('✅ All tests completed');
}

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testLoginTask,
  testSignupTask,
  testPaymentTask,
  testCartTask,
  testSearchTask,
  testFormSubmissionTask,
  testMessagingTask,
  testDryRun,
  runTests
}; 