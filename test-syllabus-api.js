import axios from 'axios';

const API_URL = 'http://localhost:3001/api';
let authToken = '';

// Login as admin to get token
async function login() {
    try {
        const res = await axios.post(`${API_URL}/auth/login`, {
            username: 'admin',
            password: 'admin'
        });
        authToken = res.data.token;
        console.log('Login successful. Token obtained.');
    } catch (error) {
        console.error('Login failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

async function testSyllabus() {
    await login();

    const headers = { Authorization: `Bearer ${authToken}` };

    // 1. Create
    console.log('Creating Syllabus Item...');
    const newItem = {
        tetCategory: '1',
        subjectId: 'test_subj_id', // Mock ID
        unitTitle: 'API Test Unit',
        description: 'Created via test script',
        order: 99
    };

    let createdId;
    try {
        const res = await axios.post(`${API_URL}/syllabus`, newItem, { headers });
        console.log('Create Response:', res.status, res.data);
        createdId = res.data._id;
    } catch (error) {
        console.error('Create Failed:', error.response?.data || error.message);
        return;
    }

    // 2. Read (Verify Persistence)
    console.log('Verifying Persistence (Get All)...');
    try {
        const res = await axios.get(`${API_URL}/syllabus`, { headers });
        const found = res.data.find(i => i._id === createdId);
        if (found) {
            console.log('SUCCESS: Item found in database list.');
        } else {
            console.error('FAILURE: Item NOT found in database list.');
        }
    } catch (error) {
        console.error('Get Failed:', error.response?.data || error.message);
    }

    // 3. Update
    console.log('Updating Item...');
    try {
        const updateData = { ...newItem, unitTitle: 'API Test Unit UPDATED' };
        const res = await axios.put(`${API_URL}/syllabus/${createdId}`, updateData, { headers });
        console.log('Update Response:', res.status, res.data.unitTitle);
    } catch (error) {
        console.error('Update Failed:', error.response?.data || error.message);
    }

    // 4. Delete
    console.log('Deleting Item...');
    try {
        const res = await axios.delete(`${API_URL}/syllabus/${createdId}`, { headers });
        console.log('Delete Response:', res.status, res.data);
    } catch (error) {
        console.error('Delete Failed:', error.response?.data || error.message);
    }
}

testSyllabus();
