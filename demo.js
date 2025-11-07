#!/usr/bin/env node

// Demo script to test the task monitor functionality
const http = require('http');
const WebSocket = require('ws');

// Test API endpoints
async function testAPI() {
  console.log('🧪 Testing API endpoints...\n');

  // Test GET /api/v1/tasks
  try {
    const response = await fetch('http://localhost:3000/api/v1/tasks');
    const data = await response.json();
    console.log('✅ GET /api/v1/tasks - Success');
    console.log(`   Found ${data.tasks.length} tasks`);
    data.tasks.forEach((task, i) => {
      console.log(`   ${i + 1}. ${task.title} - ${task.status}`);
    });
  } catch (error) {
    console.log('❌ GET /api/v1/tasks - Failed:', error.message);
  }

  console.log('\n');

  // Test POST /api/v1/tasks
  try {
    const newTask = {
      target: 'https://instagram.com/testuser',
      maxFollowers: 500,
      exportFormat: 'json'
    };
    
    const response = await fetch('http://localhost:3000/api/v1/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ POST /api/v1/tasks - Success');
      console.log(`   Created task: ${data.id} - ${data.title}`);
    } else {
      console.log('❌ POST /api/v1/tasks - Failed');
    }
  } catch (error) {
    console.log('❌ POST /api/v1/tasks - Failed:', error.message);
  }

  console.log('\n');
}

// Test WebSocket connection
function testWebSocket() {
  console.log('🔌 Testing WebSocket connection...\n');

  const ws = new WebSocket('ws://localhost:8080');
  
  ws.on('open', () => {
    console.log('✅ WebSocket connected successfully');
    
    // Listen for messages
    ws.on('message', (data) => {
      const message = JSON.parse(data);
      console.log(`📨 Received WebSocket message: ${message.type}`);
      
      switch (message.type) {
        case 'TASK_STATUS_UPDATE':
          console.log(`   Task ${message.payload.taskId} status: ${message.payload.status} (${message.payload.progress}%)`);
          break;
        case 'TASK_COMPLETED':
          console.log(`   Task ${message.payload.taskId} completed! Results: ${JSON.stringify(message.payload.results)}`);
          break;
        case 'TASK_FAILED':
          console.log(`   Task ${message.payload.taskId} failed: ${message.payload.error}`);
          break;
        case 'CHALLENGE_REQUIRED':
          console.log(`   Task ${message.payload.taskId} needs attention: ${message.payload.challenge}`);
          break;
      }
    });
    
    // Close after 10 seconds
    setTimeout(() => {
      ws.close();
      console.log('\n🔌 WebSocket connection closed');
    }, 10000);
  });
  
  ws.on('error', (error) => {
    console.log('❌ WebSocket connection failed:', error.message);
  });
}

// Check if servers are running
async function checkServers() {
  console.log('🔍 Checking if servers are running...\n');
  
  try {
    const response = await fetch('http://localhost:3000/healthz');
    if (response.ok) {
      console.log('✅ Backend server (HTTP) is running on port 3000');
    }
  } catch (error) {
    console.log('❌ Backend server (HTTP) is not running on port 3000');
    return false;
  }
  
  try {
    const ws = new WebSocket('ws://localhost:8080');
    ws.on('open', () => {
      console.log('✅ WebSocket server is running on port 8080');
      ws.close();
      return true;
    });
    ws.on('error', () => {
      console.log('❌ WebSocket server is not running on port 8080');
      return false;
    });
  } catch (error) {
    console.log('❌ WebSocket server is not running on port 8080');
    return false;
  }
  
  return true;
}

// Main demo function
async function runDemo() {
  console.log('🚀 Task Monitor Demo\n');
  console.log('================\n');
  
  const serversRunning = await checkServers();
  
  if (!serversRunning) {
    console.log('\n❌ Servers are not running. Please start them first:');
    console.log('   npm start    # Start backend server');
    console.log('   npm run dev  # Start frontend development server');
    console.log('\nThen run this demo again: node demo.js');
    return;
  }
  
  console.log('\n');
  await testAPI();
  testWebSocket();
}

// Run the demo
runDemo().catch(console.error);