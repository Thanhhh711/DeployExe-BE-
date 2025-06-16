const Category = require("../models/category.model");
const Discount = require("../models/discount.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const { cloudinary } = require("../utils/cloudinary");
const { getDataUri } = require("../utils/datauri");
const { calculateFinalPrice } = require("../utils/utils");

const createProductService = async (productData, file) => {
  try {
    const { name, description, price, rating, location, stock, categories } = productData;
    const profilePicture = file;

    if (!profilePicture) {
      throw new Error("Không thể thêm ảnh sản phẩm.");
    }

    const fileUri = getDataUri(profilePicture);
    const cloudResponse = await cloudinary.uploader.upload(fileUri);
    const picture = cloudResponse.url;

    let discountId = null;

    // if (currentDiscount) {
    //   const discount = await Discount.findById(currentDiscount);
    //   if (!discount) {
    //     throw new Error("Mã giảm giá không tồn tại.");
    //   }

    //   const now = new Date();

    //   if (!discount.isActive || now < new Date(discount.startDate) || now > new Date(discount.endDate)) {
    //     throw new Error("Mã giảm giá không hợp lệ hoặc đã hết hạn.");
    //   }

    //   discount.applicableProducts = [...discount.applicableProducts, productData._id];

    //   await discount.save();

    //   discountId = discount._id;
    // }

    // const finalPriceObj  =  await calculateFinalPrice({ price, currentDiscount: discountId });
    // const finalPrice = Number(finalPriceObj.price);
    const dataSave = {
      name,
      description,
      price,
      rating,
      location,
      picture,
      stock,
      categories,
      // currentDiscount: discountId || null,
      // finalPrice,
    };

    let product = await Product.create(dataSave);

    if (categories && categories.length > 0) {
      await Category.updateMany({ _id: { $in: categories } }, { $addToSet: { products: product._id } });
    }

    return product;
  } catch (error) {
    if (error.code === 11000) {
      throw new Error(`Tên sản phẩm "${error.keyValue.name}" đã tồn tại.`);
    }

    throw error;
  }
};

const updateProductService = async (productId, productData, userId, file) => {
  try {
    let userEdit = await User.findById(userId).select("-password");

    console.log("userEdit", userEdit);

    if (!userEdit) {
      throw new Error("Không tìm thấy người dùng này");
    }

    let { name, description, price, rating, location, stock, categories, profilePicture } = productData;

    let discountId = null;

    // if (currentDiscount) {
    //   const discount = await Discount.findById(currentDiscount);
    //   if (!discount) {
    //     throw new Error("Mã giảm giá không tồn tại.");
    //   }

    //   const now = new Date();

    //   if (!discount.isActive || now < new Date(discount.startDate) || now > new Date(discount.endDate)) {
    //     throw new Error("Mã giảm giá không hợp lệ hoặc đã hết hạn.");
    //   }
    //   discount.applicableProducts = [...discount.applicableProducts, productData._id];

    //   await discount.save();
    //   discountId = discount._id;
    // }

    if (!profilePicture) {
      if (file && typeof file !== "string") {
        const fileUri = getDataUri(file);
        const cloudResponse = await cloudinary.uploader.upload(fileUri);
        profilePicture = cloudResponse.url;
      }

      // ✅ Nếu là string URL (ảnh cũ)
      else if (typeof file === "string" && file.startsWith("http")) {
        profilePicture = file;
      } else {
        throw new Error("Không thể thêm ảnh sản phẩm.");
      }
    }
    // const finalPrice = calculateFinalPrice({ price, currentDiscount: discountId });

    const dataSave = {
      name,
      description,
      price,
      rating,
      location,
      picture: profilePicture,
      stock,
      categories,
      // currentDiscount: discountId || null,
      editby: userEdit.username,
      // finalPrice,
    };

    let updatedProduct = await Product.findByIdAndUpdate(productId, { $set: dataSave }, { new: true });
    if (!updatedProduct) {
      throw new Error("Không thể cập nhật sản phẩm");
    }

    return updatedProduct;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createProductService,
  updateProductService,
};
