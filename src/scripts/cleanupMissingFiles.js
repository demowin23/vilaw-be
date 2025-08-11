const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

const cleanupMissingFiles = async () => {
  try {
    const client = await pool.connect();
    
    console.log('🔍 Bắt đầu dọn dẹp database...');
    
    // 1. Dọn dẹp legal_documents
    console.log('\n📄 Dọn dẹp legal_documents...');
    const legalDocsQuery = `
      SELECT id, title, file_url, file_size 
      FROM legal_documents 
      WHERE file_url IS NOT NULL AND file_url != ''
    `;
    const legalDocsResult = await client.query(legalDocsQuery);
    
    let legalDocsCleaned = 0;
    for (const doc of legalDocsResult.rows) {
      if (doc.file_url) {
        const fileName = doc.file_url.split('/').pop();
        const filePath = path.join(__dirname, '..', '..', 'uploads', 'legal-documents', fileName);
        
        if (!fs.existsSync(filePath)) {
          console.log(`❌ File không tồn tại: ${fileName} (ID: ${doc.id})`);
          
          // Cập nhật database
          await client.query(
            'UPDATE legal_documents SET file_url = NULL, file_size = NULL WHERE id = $1',
            [doc.id]
          );
          legalDocsCleaned++;
        }
      }
    }
    console.log(`✅ Đã dọn dẹp ${legalDocsCleaned} legal documents`);
    
    // 2. Dọn dẹp chat_messages
    console.log('\n💬 Dọn dẹp chat_messages...');
    const chatMessagesQuery = `
      SELECT id, content, message_type, file_url 
      FROM chat_messages 
      WHERE message_type = 'file' AND file_url IS NOT NULL AND file_url != ''
    `;
    const chatMessagesResult = await client.query(chatMessagesQuery);
    
    let chatMessagesCleaned = 0;
    for (const msg of chatMessagesResult.rows) {
      if (msg.file_url) {
        const fileName = msg.file_url.split('/').pop();
        const filePath = path.join(__dirname, '..', '..', 'uploads', 'chat', fileName);
        
        if (!fs.existsSync(filePath)) {
          console.log(`❌ File không tồn tại: ${fileName} (ID: ${msg.id})`);
          
          // Cập nhật database
          await client.query(
            'UPDATE chat_messages SET file_url = NULL, content = content || \' [File đã bị xóa]\' WHERE id = $1',
            [msg.id]
          );
          chatMessagesCleaned++;
        }
      }
    }
    console.log(`✅ Đã dọn dẹp ${chatMessagesCleaned} chat messages`);
    
    // 3. Dọn dẹp legal_news
    console.log('\n📰 Dọn dẹp legal_news...');
    const legalNewsQuery = `
      SELECT id, title, image_url 
      FROM legal_news 
      WHERE image_url IS NOT NULL AND image_url != ''
    `;
    const legalNewsResult = await client.query(legalNewsQuery);
    
    let legalNewsCleaned = 0;
    for (const news of legalNewsResult.rows) {
      if (news.image_url) {
        const fileName = news.image_url.split('/').pop();
        const filePath = path.join(__dirname, '..', '..', 'uploads', 'legal-news', fileName);
        
        if (!fs.existsSync(filePath)) {
          console.log(`❌ File không tồn tại: ${fileName} (ID: ${news.id})`);
          
          // Cập nhật database
          await client.query(
            'UPDATE legal_news SET image_url = NULL WHERE id = $1',
            [news.id]
          );
          legalNewsCleaned++;
        }
      }
    }
    console.log(`✅ Đã dọn dẹp ${legalNewsCleaned} legal news`);
    
    // 4. Dọn dẹp video_life_law
    console.log('\n🎥 Dọn dẹp video_life_law...');
    const videoQuery = `
      SELECT id, title, video_url, thumbnail_url 
      FROM video_life_law 
      WHERE (video_url IS NOT NULL AND video_url != '') OR (thumbnail_url IS NOT NULL AND thumbnail_url != '')
    `;
    const videoResult = await client.query(videoQuery);
    
    let videoCleaned = 0;
    for (const video of videoResult.rows) {
      let needsUpdate = false;
      const updateData = {};
      
      if (video.video_url) {
        const fileName = video.video_url.split('/').pop();
        const filePath = path.join(__dirname, '..', '..', 'uploads', 'videos', fileName);
        
        if (!fs.existsSync(filePath)) {
          console.log(`❌ Video file không tồn tại: ${fileName} (ID: ${video.id})`);
          updateData.video_url = null;
          needsUpdate = true;
        }
      }
      
      if (video.thumbnail_url) {
        const fileName = video.thumbnail_url.split('/').pop();
        const filePath = path.join(__dirname, '..', '..', 'uploads', 'videos', fileName);
        
        if (!fs.existsSync(filePath)) {
          console.log(`❌ Thumbnail file không tồn tại: ${fileName} (ID: ${video.id})`);
          updateData.thumbnail_url = null;
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        const updateFields = Object.keys(updateData).map((key, index) => `${key} = $${index + 1}`).join(', ');
        const updateValues = Object.values(updateData);
        
        await client.query(
          `UPDATE video_life_law SET ${updateFields} WHERE id = $${updateValues.length + 1}`,
          [...updateValues, video.id]
        );
        videoCleaned++;
      }
    }
    console.log(`✅ Đã dọn dẹp ${videoCleaned} videos`);
    
    client.release();
    
    console.log('\n🎉 Hoàn thành dọn dẹp database!');
    console.log(`📊 Tổng kết:`);
    console.log(`   - Legal Documents: ${legalDocsCleaned}`);
    console.log(`   - Chat Messages: ${chatMessagesCleaned}`);
    console.log(`   - Legal News: ${legalNewsCleaned}`);
    console.log(`   - Videos: ${videoCleaned}`);
    
  } catch (error) {
    console.error('❌ Lỗi khi dọn dẹp database:', error);
    throw error;
  }
};

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  cleanupMissingFiles()
    .then(() => {
      console.log('✅ Script dọn dẹp hoàn thành');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script dọn dẹp thất bại:', error);
      process.exit(1);
    });
}

module.exports = { cleanupMissingFiles };
