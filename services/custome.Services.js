const Custom = require("../models/custom.model");
const { cloudinary } = require("../utils/cloudinary");
const { getDataUri } = require("../utils/datauri");

const customeService = async (customeData, file) => {
  try {
    const { user, product, title = "Thiết kế của tôi", elements } = customeData;
    const customePicture = file;

    if (!customePicture) {
      throw new Error("Không thể thêm ảnh sản phẩm: thiếu file ảnh.");
    }

    // Chuyển file thành data URI để upload lên Cloudinary
    const fileUri = getDataUri(customePicture);
    const cloudResponse = await cloudinary.uploader.upload(fileUri, {
      folder: "custom-designs",
    });

    const image = cloudResponse.secure_url;

    const dataSave = {
      user,
      image,
      product, // nếu bạn lưu thiết kế theo sản phẩm
      title, // nếu bạn muốn đặt tên cho thiết kế
      isActive: true,
      createdAt: new Date(),
      elements,
    };

    const custom = await Custom.create(dataSave);
    return custom;
  } catch (error) {
    console.error("Lỗi khi tạo custom design:", error);
    throw new Error("Không thể tạo sản phẩm tuỳ chỉnh.");
  }
};

module.exports = { customeService };
