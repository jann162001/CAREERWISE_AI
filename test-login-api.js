const fetch = require('node-fetch');

async function testLoginAPI() {
    try {
        console.log('🧪 Testing Login API...\n');
        
        // Test with first user
        const testCredentials = {
            username: 'Jann Adolf',
            email: 'jannadolfquiton77@gmail.com',
            password: 'test123' // Update this with your actual password
        };
        
        console.log('Testing with credentials:');
        console.log('Username:', testCredentials.username);
        console.log('Email:', testCredentials.email);
        console.log('Password:', '***' + testCredentials.password.slice(-3));
        
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testCredentials)
        });
        
        console.log('\n📡 Response Status:', response.status);
        console.log('Response Status Text:', response.statusText);
        console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
        
        const data = await response.json();
        console.log('\n📦 Response Data:', JSON.stringify(data, null, 2));
        
        if (data.success) {
            console.log('\n✅ Login successful!');
        } else {
            console.log('\n❌ Login failed:', data.message);
        }
        
    } catch (error) {
        console.error('\n❌ Error testing login:', error.message);
        console.error('Full error:', error);
    }
}

testLoginAPI();
