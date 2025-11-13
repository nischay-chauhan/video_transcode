const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';

async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'password'
    });
    return response.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

async function uploadVideo(token, videoPath) {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(videoPath), {
      filename: path.basename(videoPath),
      contentType: 'video/mp4'
    });

    const response = await axios.post(`${BASE_URL}/videos/upload`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders(),
      },
      params: {
        quality: 'high',
        format: 'mp4',
        resolution: '720p'
      }
    });

    console.log('Upload response:', response.data);
    return response.data.jobId;
  } catch (error) {
    console.error('Upload failed:', error.response?.data || error.message);
    throw error;
  }
}

async function checkJobStatus(token, jobId) {
  try {
    const response = await axios.get(`${BASE_URL}/videos/status/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Job status:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error checking job status:', error.response?.data || error.message);
    throw error;
  }
}

async function pollJobStatus(token, jobId, interval = 2000) {
  return new Promise((resolve) => {
    const check = async () => {
      const status = await checkJobStatus(token, jobId);
      if (status.status === 'completed' || status.status === 'failed') {
        resolve(status);
      } else {
        setTimeout(check, interval);
      }
    };
    check();
  });
}

async function downloadVideo(token, url, outputPath) {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('Download failed:', error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  if (process.argv.length < 3) {
    console.log('Usage: node test-video-upload.js <path-to-video-file>');
    process.exit(1);
  }

  const videoPath = process.argv[2];
  if (!fs.existsSync(videoPath)) {
    console.error(`File not found: ${videoPath}`);
    process.exit(1);
  }

  try {
    console.log('Logging in...');
    const token = await login();
    
    console.log('Uploading video...');
    const jobId = await uploadVideo(token, videoPath);
    
    console.log('Processing video...');
    const result = await pollJobStatus(token, jobId);
    
    if (result.status === 'completed' && result.outputUrl) {
      console.log('Downloading processed video...');
      const outputPath = `processed_${path.basename(videoPath)}`;
      await downloadVideo(token, result.outputUrl, outputPath);
      console.log(`Video downloaded to: ${outputPath}`);
    } else {
      console.log('Video processing failed or no output URL available');
    }
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

main();
