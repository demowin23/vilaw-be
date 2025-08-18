const LegalDocument = require("../models/LegalDocument");
const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");

// Function tạo mục lục từ HTML content và thêm ID vào headings
const generateTableOfContents = (htmlContent) => {
  try {
    // Regex để tìm các thẻ heading (h1, h2, h3, h4, h5, h6)
    const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi;
    const headings = [];
    let match;
    let tocId = 1;
    let modifiedHtml = htmlContent;

    while ((match = headingRegex.exec(htmlContent)) !== null) {
      const level = parseInt(match[1]);
      const text = match[2].replace(/<[^>]*>/g, "").trim(); // Loại bỏ HTML tags

      if (text) {
        const id = `toc-${tocId++}`;
        headings.push({
          id: id,
          level: level,
          text: text,
        });

        // Thêm ID vào heading trong HTML content
        const originalHeading = match[0];
        const headingWithId = originalHeading.replace(
          /<h([1-6])/,
          `<h$1 id="${id}"`
        );
        modifiedHtml = modifiedHtml.replace(originalHeading, headingWithId);
      }
    }

    if (headings.length === 0) {
      return {
        headings: [],
        modifiedHtml: htmlContent,
        count: 0,
      };
    }

    return {
      headings: headings,
      modifiedHtml: modifiedHtml,
      count: headings.length,
    };
  } catch (error) {
    console.error("Error generating table of contents:", error);
    return {
      headings: [],
      modifiedHtml: htmlContent,
      count: 0,
    };
  }
};



// Lấy danh sách văn bản pháp luật
const getLegalDocuments = async (req, res) => {
  try {
    const {
      limit = 10,
      offset = 0,
      search,
      document_type,
      status,
      issuing_authority,
      is_important,
      tags,
    } = req.query;

    // Xử lý tags parameter
    let processedTags = undefined;
    if (tags) {
      if (typeof tags === "string") {
        // Nếu tags là string, split theo dấu phẩy
        processedTags = tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);
      } else if (Array.isArray(tags)) {
        // Nếu tags là array
        processedTags = tags;
      }
    }

    // Kiểm tra role của user để xác định quyền xem
    const isAdmin = req.user && req.user.role === "admin";
    const isLawyer = req.user && req.user.role === "lawyer";
    const isCollaborator = req.user && req.user.role === "collaborator";
    const isPending = req.query.isPending;

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      search,
      document_type,
      status,
      issuing_authority,
      is_important:
        is_important === "true"
          ? true
          : is_important === "false"
          ? false
          : undefined,
      tags: processedTags,
      isPending,
      isAdmin: isAdmin || isLawyer || isCollaborator, // Truyền thông tin quyền vào options
    };

    const result = await LegalDocument.getAll(options);

    res.json({
      success: true,
      data: result.data,
      count: result.count,
      total: result.total,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.total,
      },
    });
  } catch (error) {
    console.error("Error getting legal documents:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy danh sách văn bản pháp luật",
    });
  }
};

// Lấy chi tiết văn bản pháp luật
const getLegalDocumentById = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await LegalDocument.getById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy văn bản pháp luật",
      });
    }

    // Sử dụng html_content trực tiếp từ database
    if (document.html_content) {
      try {
        // Tạo mục lục từ HTML content có sẵn trong database
        const tocResult = generateTableOfContents(document.html_content);
        document.html_toc = tocResult.headings;
        document.html_source = 'database';
      } catch (error) {
        console.error("Error processing HTML content from database:", error);
        document.html_toc = null;
        document.html_source = 'database_error';
      }
    } else if (document.file_url) {
      // Fallback: Chuyển đổi file thành HTML nếu không có html_content trong database
      try {
        const filePath = path.join(
          __dirname,
          "..",
          "..",
          "uploads",
          path.basename(document.file_url)
        );

        if (fs.existsSync(filePath)) {
          const fileExtension = path.extname(filePath).toLowerCase();

          if (fileExtension === ".docx") {
            // Chuyển đổi DOCX thành HTML
            const result = await mammoth.convertToHtml({ path: filePath });

            // Tạo mục lục và thêm ID vào headings
            const tocResult = generateTableOfContents(result.value);

            // Lưu HTML content từ file conversion
            document.html_content = tocResult.modifiedHtml;
            document.html_toc = tocResult.headings;
            document.html_source = 'file_conversion';
          } else if (fileExtension === ".doc") {
            // File .doc không được hỗ trợ bởi mammoth
            document.html_content = null;
            document.html_toc = null;
            document.html_source = 'file_unsupported';
          } else {
            document.html_content = null;
            document.html_toc = null;
            document.html_source = 'file_unsupported';
          }
        } else {
          document.html_content = null;
          document.html_toc = null;
          document.html_source = 'file_not_found';
        }
      } catch (error) {
        console.error("Error converting to HTML:", error);
        document.html_content = null;
        document.html_toc = null;
        document.html_source = 'file_conversion_error';
      }
    } else {
      // Không có html_content và không có file
      document.html_content = null;
      document.html_toc = null;
      document.html_source = 'none';
    }

    res.json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error("Error getting legal document by id:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy chi tiết văn bản pháp luật",
    });
  }
};

// Tạo văn bản pháp luật mới
const createLegalDocument = async (req, res) => {
  try {
    const {
      title,
      document_number,
      document_type,
      issuing_authority,
      issued_date,
      effective_date,
      expiry_date,
      tags,
      is_important = false,
      html_content,
    } = req.body;

    // Validation
    if (
      !title ||
      !document_number ||
      !document_type ||
      !issuing_authority ||
      !issued_date
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Các trường bắt buộc: tên văn bản, số hiệu, loại văn bản, cơ quan ban hành, ngày ban hành",
      });
    }

    // Kiểm tra số hiệu văn bản đã tồn tại
    const existingDoc = await LegalDocument.getByDocumentNumber(
      document_number
    );
    if (existingDoc) {
      return res.status(400).json({
        success: false,
        error: "Số hiệu văn bản đã tồn tại",
      });
    }

    // Xử lý file upload
    let fileUrl = null;
    let fileSize = 0;
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      fileSize = req.file.size;
    }

    // Xử lý tags
    let processedTags = null;
    if (tags) {
      if (typeof tags === "string") {
        processedTags = tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);
      } else if (Array.isArray(tags)) {
        processedTags = tags.filter((tag) => tag.length > 0);
      }
    }

    // Xử lý effective_date - cho phép null, empty string hoặc giá trị hợp lệ
    let processedEffectiveDate = null;
    if (
      effective_date !== null &&
      effective_date !== undefined &&
      effective_date !== ""
    ) {
      processedEffectiveDate = effective_date;
    }

    // Xử lý expiry_date - cho phép null, empty string hoặc giá trị hợp lệ
    let processedExpiryDate = null;
    if (
      expiry_date !== null &&
      expiry_date !== undefined &&
      expiry_date !== ""
    ) {
      processedExpiryDate = expiry_date;
    }

    // Xác định trạng thái approval dựa trên role của user
    const isApproved = req.user.role === "admin" ? true : false;

    const documentData = {
      title,
      document_number,
      document_type,
      issuing_authority,
      issued_date,
      effective_date: processedEffectiveDate,
      expiry_date: processedExpiryDate,
      tags: processedTags,
      file_url: fileUrl,
      file_size: fileSize,
      uploaded_by: req.user.id,
      is_important,
      is_approved: isApproved,
      html_content: html_content || null,
    };

    const newDocument = await LegalDocument.create(documentData);

    res.status(201).json({
      success: true,
      message: "Tạo văn bản pháp luật thành công",
      data: newDocument,
    });
  } catch (error) {
    console.error("Error creating legal document:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi tạo văn bản pháp luật",
    });
  }
};

// Cập nhật văn bản pháp luật
const updateLegalDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      document_number,
      document_type,
      issuing_authority,
      issued_date,
      effective_date,
      expiry_date,
      status,
      tags,
      is_important,
      html_content,
    } = req.body;

    // Kiểm tra văn bản tồn tại
    const existingDoc = await LegalDocument.getById(id);
    if (!existingDoc) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy văn bản pháp luật",
      });
    }

    // Kiểm tra quyền cập nhật
    if (
      req.user.role !== "admin" &&
      req.user.role !== "lawyer" &&
      existingDoc.uploaded_by !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: "Không có quyền cập nhật văn bản pháp luật này",
      });
    }

    // Kiểm tra số hiệu văn bản đã tồn tại (nếu thay đổi)
    if (document_number && document_number !== existingDoc.document_number) {
      const duplicateDoc = await LegalDocument.getByDocumentNumber(
        document_number
      );
      if (duplicateDoc) {
        return res.status(400).json({
          success: false,
          error: "Số hiệu văn bản đã tồn tại",
        });
      }
    }

    // Xử lý file upload mới
    let fileUrl = existingDoc.file_url;
    let fileSize = existingDoc.file_size;
    if (req.file) {
      // Xóa file cũ nếu có
      if (existingDoc.file_url) {
        try {
          const oldFileName = existingDoc.file_url.split("/").pop();
          const oldFilePath = path.join(__dirname, '..', '..', 'uploads', oldFileName);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        } catch (fileError) {
        }
      }
      
      fileUrl = `/uploads/${req.file.filename}`;
      fileSize = req.file.size;
    }

    // Xử lý tags
    let processedTags = existingDoc.tags;
    if (tags !== undefined) {
      if (typeof tags === "string") {
        processedTags = tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);
      } else if (Array.isArray(tags)) {
        processedTags = tags.filter((tag) => tag.length > 0);
      } else if (tags === null || tags === "") {
        processedTags = null;
      }
    }

    // Xử lý effective_date - cho phép null hoặc empty string
    let processedEffectiveDate = existingDoc.effective_date;
    if (effective_date !== undefined) {
      if (effective_date !== null && effective_date !== "") {
        processedEffectiveDate = effective_date;
      } else {
        processedEffectiveDate = null;
      }
    }

    // Xử lý expiry_date - cho phép null hoặc empty string
    let processedExpiryDate = existingDoc.expiry_date;
    if (expiry_date !== undefined) {
      if (expiry_date !== null && expiry_date !== "") {
        processedExpiryDate = expiry_date;
      } else {
        processedExpiryDate = null;
      }
    }

    const updateData = {
      title,
      document_number,
      document_type,
      issuing_authority,
      issued_date,
      effective_date: processedEffectiveDate,
      expiry_date: processedExpiryDate,
      tags: processedTags,
      file_url: fileUrl,
      file_size: fileSize,
      is_important,
      html_content,
    };

    // Loại bỏ các trường undefined
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedDocument = await LegalDocument.update(id, updateData);

    res.json({
      success: true,
      message: "Cập nhật văn bản pháp luật thành công",
      data: updatedDocument,
    });
  } catch (error) {
    console.error("Error updating legal document:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi cập nhật văn bản pháp luật",
    });
  }
};

// Xóa văn bản pháp luật
const deleteLegalDocument = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra văn bản tồn tại
    const existingDoc = await LegalDocument.getById(id);
    if (!existingDoc) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy văn bản pháp luật",
      });
    }

    // Kiểm tra quyền xóa
    if (
      req.user.role !== "admin" &&
      req.user.role !== "lawyer" &&
      existingDoc.uploaded_by !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: "Không có quyền xóa văn bản pháp luật này",
      });
    }

    // Xóa file vật lý nếu có
    if (existingDoc.file_url) {
      try {
        const fileName = existingDoc.file_url.split("/").pop();
        const filePath = path.join(__dirname, '..', '..', 'uploads', fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileError) {
      }
    }

    await LegalDocument.delete(id);

    res.json({
      success: true,
      message: "Xóa văn bản pháp luật thành công",
    });
  } catch (error) {
    console.error("Error deleting legal document:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi xóa văn bản pháp luật",
    });
  }
};

// Download văn bản pháp luật
const downloadLegalDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await LegalDocument.getById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy văn bản pháp luật",
      });
    }

    if (!document.file_url) {
      return res.status(404).json({
        success: false,
        error: "Văn bản không có file đính kèm",
      });
    }

    // Kiểm tra file có tồn tại không
    const fs = require('fs');
    const path = require('path');
    
    // Lấy tên file từ file_url
    const fileName = document.file_url.split("/").pop();
    const filePath = path.join(__dirname, '..', '..', 'uploads', fileName);
    
    // Kiểm tra file có tồn tại không
    if (!fs.existsSync(filePath)) {
      console.error(`File không tồn tại: ${filePath}`);
      
      // Cập nhật database để đánh dấu file không tồn tại
      try {
        await LegalDocument.update(id, { 
          file_url: null, 
          file_size: null
        });
      } catch (updateError) {
        console.error('Lỗi khi cập nhật trạng thái file:', updateError);
      }
      
      return res.status(404).json({
        success: false,
        error: "File không tồn tại hoặc đã bị xóa",
        message: "Vui lòng liên hệ admin để khôi phục file"
      });
    }

    // Tăng số lượt download
    await LegalDocument.incrementDownloadCount(id);

    // Trả về file để download
    res.download(filePath, document.title + ".docx", (err) => {
      if (err) {
        console.error("Error downloading file:", err);
        // Không gửi response ở đây vì res.download đã gửi file
      }
    });
  } catch (error) {
    console.error("Error downloading legal document:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi tải văn bản pháp luật",
    });
  }
};

// Lấy danh sách document types
const getDocumentTypes = async (req, res) => {
  try {
    const documentTypes = await LegalDocument.getDocumentTypes();
    res.json({
      success: true,
      data: documentTypes,
    });
  } catch (error) {
    console.error("Error getting document types:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy danh sách loại văn bản",
    });
  }
};

// Lấy danh sách status
const getStatuses = async (req, res) => {
  try {
    const statuses = await LegalDocument.getStatuses();
    res.json({
      success: true,
      data: statuses,
    });
  } catch (error) {
    console.error("Error getting statuses:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy danh sách trạng thái",
    });
  }
};

// Lấy danh sách văn bản theo lượt tải từ cao đến thấp
const getLegalDocumentsByDownloadCount = async (req, res) => {
  try {
    const {
      limit = 10,
      offset = 0,
      search,
      document_type,
      status,
      issuing_authority,
      is_important,
      tags,
    } = req.query;

    // Xử lý tags parameter
    let processedTags = undefined;
    if (tags) {
      if (typeof tags === "string") {
        processedTags = tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);
      } else if (Array.isArray(tags)) {
        processedTags = tags;
      }
    }

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      search,
      document_type,
      status,
      issuing_authority,
      is_important:
        is_important === "true"
          ? true
          : is_important === "false"
          ? false
          : undefined,
      tags: processedTags,
    };

    const result = await LegalDocument.getByDownloadCount(options);

    res.json({
      success: true,
      data: result.data,
      count: result.count,
      total: result.total,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.total,
      },
    });
  } catch (error) {
    console.error("Error getting legal documents by download count:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy danh sách văn bản theo lượt tải",
    });
  }
};

// Duyệt/từ chối văn bản pháp luật (Admin only)
const approveLegalDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_approved } = req.body;

    // Kiểm tra quyền admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Chỉ admin mới có quyền duyệt văn bản pháp luật",
      });
    }

    // Kiểm tra văn bản tồn tại
    const existingDoc = await LegalDocument.getById(id);
    if (!existingDoc) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy văn bản pháp luật",
      });
    }

    // Cập nhật trạng thái approval
    const updatedDocument = await LegalDocument.update(id, { is_approved });

    res.json({
      success: true,
      message: is_approved
        ? "Duyệt văn bản pháp luật thành công"
        : "Từ chối văn bản pháp luật thành công",
      data: updatedDocument,
    });
  } catch (error) {
    console.error("Error approving legal document:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi duyệt văn bản pháp luật",
    });
  }
};

// Lấy danh sách văn bản chờ duyệt (Admin only)
const getPendingLegalDocuments = async (req, res) => {
  try {
    const {
      limit = 10,
      offset = 0,
      search,
      document_type,
      status,
      issuing_authority,
      is_important,
      tags,
    } = req.query;

    // Kiểm tra quyền admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Chỉ admin mới có quyền xem danh sách văn bản chờ duyệt",
      });
    }

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      search,
      document_type,
      status,
      issuing_authority,
      is_important: is_important === "true",
      tags: tags ? tags.split(",") : undefined,
      is_approved: false, // Chỉ lấy văn bản chưa được duyệt
      include_pending: false,
    };

    const result = await LegalDocument.getAll(options);

    res.json({
      success: true,
      data: result.data,
      count: result.count,
      total: result.total,
    });
  } catch (error) {
    console.error("Error getting pending legal documents:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy danh sách văn bản chờ duyệt",
    });
  }
};

module.exports = {
  getLegalDocuments,
  getLegalDocumentById,
  createLegalDocument,
  updateLegalDocument,
  deleteLegalDocument,
  downloadLegalDocument,
  getDocumentTypes,
  getStatuses,
  getLegalDocumentsByDownloadCount,
  approveLegalDocument,
  getPendingLegalDocuments,
};
