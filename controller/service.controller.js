const Service = require("../models/service.model");

const getService = async (req, res) => {
  try {
    const services = await Service.find({});

    if (services.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy dịch vụ nào",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Lấy danh sách dịch vụ thành công",
      data: services,
      success: true,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách dịch vụ:", error);
    return res.status(500).json({
      message: "Đã xảy ra lỗi trong quá trình lấy danh sách dịch vụ",
      success: false,
    });
  }
};

const updateService = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, price, description } = req.body;
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        message: "Không thể tìm thấy dịch vụ",
        success: false,
      });
    }
    const updateService = await Service.findByIdAndUpdate(
      req.params.id,
      { $set: { name, price, description } },
      { new: true }
    );
    return res.status(200).json({
      message: "Cập nhật dịch vụ thành công",
      data: updateService,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

const deleteService = async (req, res) => {
  try {
    const id = req.params.id;
    const service = await Service.findByIdAndDelete(id);
    if (!service) {
      return res.status(404).json({
        message: "Không tìm thâý dịch vụ",
        success: false,
      });
    }
    return res.status(200).json({
      message: "Xóa dịch vụ thành công ",
      data: service,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

const createService = async (req, res) => {
  try {
    const { name, price, description } = req.body;
    const service = await Service.create({ name, price, description });
    if (!service) {
      return res.status(404).json({
        message: "Không tìm thấy dịch vụ",
        success: false,
      });
    }
    return res.status(200).json({
      message: "Tạo thành công dịch vụ",
      data: service,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};
module.exports = { getService, updateService, deleteService, createService };
