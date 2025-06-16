const Order = require("../models/order.model");
const Request = require("../models/request.model");
const Service = require("../models/service.model");
const Wallet = require("../models/wallet.model");

const Status = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const createRefundRequest = async (req, res) => {
  try {
    const user = req.user.id;
    const status = Status.PENDING;
    const { type, message, order } = req.body;
    console.log(req.body, req.user.id);

    if (!type || !user || !message || !order) {
      return res.status(401).json({
        message: "Thiếu thông tin yêu cầu hoàn tiền",
        success: false,
      });
    }

    const request = await Request.create({
      type,
      status,
      user,
      message,
      order,
    });

    if (!request) {
      return res.status(404).json({
        message: "Không thể tạo yêu cầu hoàn tiền",
        success: false,
      });
    }

    const orders = await Order.findById(order);
    orders.statusOrder = "Refund Requested";
    await orders.save();

    return res.status(200).json({
      message: "Tạo yêu cầu hoàn tiền thành công",
      data: request,
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Lỗi máy chủ khi tạo yêu cầu hoàn tiền",
      success: false,
    });
  }
};

const createServiceRequest = async (req, res) => {
  try {
    const user = req.user.id;
    const { type, message, service } = req.body;
    const status = Status.PENDING;

    if (!type || !status || !user || !message || !service) {
      return res.status(401).json({
        message: "Thiếu thông tin yêu cầu",
        success: false,
      });
    }

    const request = await Request.create({
      type,
      status,
      user,
      message,
      service,
    });

    if (!request) {
      return res.status(404).json({
        message: "Không thể tạo yêu cầu",
        success: false,
      });
    }

    const services = await Service.findById(service);
    services.statusService = "Service Requested";
    await services.save();

    return res.status(200).json({
      message: "Tạo yêu cầu thành công",
      data: request,
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Lỗi máy chủ, không thể xử lý yêu cầu",
      success: false,
    });
  }
};

const getAllRequest = async (req, res) => {
  try {
    const requests = await Request.find({}).populate("order").populate("service").populate("user").select("-password");

    if (!requests) {
      return res.status(404).json({
        message: "Không thể lấy danh sách yêu cầu",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Danh sách tất cả yêu cầu đã được lấy thành công",
      data: requests,
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Lỗi máy chủ, không thể lấy danh sách yêu cầu",
      success: false,
    });
  }
};

// lấy cá nhân
const getRequest = async (req, res) => {
  try {
    const user = req.user.id;
    const request = await Request.find({ user: user });
    if (!request || request.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy yêu cầu nào",
        success: false,
      });
    }
    return res.status(200).json({
      message: "Thông tin các yêu cầu của bạn đã được tải thành công",
      data: request,
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Lỗi máy chủ, không thể lấy yêu cầu",
      success: false,
    });
  }
};

const deleteRequest = async (req, res) => {
  try {
    const id = req.params.id;
    const request = await Request.findByIdAndDelete(id);
    if (!request) {
      return res.status(404).json({
        message: "Không tìm thấy yêu cầu để xóa",
        success: false,
      });
    }
    return res.status(200).json({
      message: "Xóa yêu cầu thành công",
      data: request,
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Lỗi server, không thể xóa yêu cầu",
      success: false,
    });
  }
};

const updateRequest = async (req, res) => {
  try {
    const id = req.params.id;
    const user = req.user.id;
    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
        success: false,
      });
    }
    const { type, status, message } = req.body;
    const request = await Request.findByIdAndUpdate(id, { $set: { type, status, user, message } }, { new: true });
    if (!request) {
      return res.status(404).json({
        message: "Không tìm thấy yêu cầu cần cập nhật",
        success: false,
      });
    }
    return res.status(200).json({
      message: "Cập nhật yêu cầu thành công",
      data: request,
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Lỗi máy chủ, không thể cập nhật yêu cầu",
      success: false,
    });
  }
};

const updateStatusRequest = async (req, res) => {
  try {
    const io = req.app.get("io");
    const { id } = req.params;
    const { status } = req.body;

    const request = await Request.findByIdAndUpdate(id, { status }, { new: true })
      .populate("order")
      .populate("service")
      .populate("user");

    if (!request) {
      return res.status(404).json({
        message: "Request not found",
        success: false,
      });
    }
    console.log(request);

    const updateRefundStatus = (doc, fieldName) => {
      if (status === "Approved") {
        doc[fieldName] = "Refund Approved";
      } else if (status === "Rejected") {
        doc[fieldName] = "Refund Rejected";
      }
    };

    if (request.type === "service") {
      const service = await Service.findById(request.service);
      if (service) {
        updateRefundStatus(service, "statusService");
        await service.save();
      }
    } else if (request.type === "refund" && request.order) {
      updateRefundStatus(request.order, "statusOrder");
      await request.order.save();
      if (request.order.statusOrder === "Refund Approved" && request.order.paymentMethod === "Stripe") {
        const refundAmount = Number(request.order.totalPrice) || 0;

        const wallet = await Wallet.findOneAndUpdate(
          { userId: request.user._id },
          { $inc: { amount: refundAmount } },
          { new: true }
        );
        io.emit("refundToWallet", {
          message: "The order has been refunded",
          refundAmount: refundAmount,
        });
      } else {
        console.log("khong phai stripe");
      }

      // Emit an event via WebSocket after updating the order status
      io.emit("orderStatusUpdated", {
        message: "Order status updated",
        orderId: request.order._id,
        status: request.order.statusOrder,
      });
    }

    return res.status(200).json({
      message: "Request updated successfully",
      data: request,
      success: true,
    });
  } catch (error) {
    console.error("Update Request Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
      success: false,
    });
  }
};

module.exports = {
  createServiceRequest,
  createRefundRequest,
  getAllRequest,
  deleteRequest,
  updateRequest,
  getRequest,
  updateStatusRequest,
};

// const updateStatusRequest = async (req, res) => {
//   try {
//     const io = req.app.get("io");
//     const { id } = req.params;
//     const { status } = req.body;

//     const request = await Request.findByIdAndUpdate(id, { status }, { new: true })
//       .populate("order")
//       .populate("service")
//       .populate("user");

//     if (!request) {
//       return res.status(404).json({
//         message: "Không tìm thấy yêu cầu",
//         success: false,
//       });
//     }
//     console.log(request);

//     const updateRefundStatus = (doc, fieldName) => {
//       if (status === "Approved") {
//         doc[fieldName] = "Hoàn tiền đã được duyệt";
//       } else if (status === "Rejected") {
//         doc[fieldName] = "Hoàn tiền bị từ chối";
//       }
//     };

//     if (request.type === Type.SERVICE) {
//       const service = await Service.findById(request.service);
//       if (service) {
//         updateRefundStatus(service, "statusService");
//         await service.save();
//       }
//     } else if (request.type === Type.REFUND && request.order) {
//       updateRefundStatus(request.order, "statusOrder");
//       await request.order.save();
//       if (request.order.statusOrder === "Hoàn tiền đã được duyệt" && request.order.paymentMethod === "Stripe") {
//         const refundAmount = Number(request.order.totalPrice) || 0;

//         const wallet = await Wallet.findOneAndUpdate(
//           { userId: request.user._id },
//           { $inc: { amount: refundAmount } },
//           { new: true }
//         );
//         io.emit("refundToWallet", {
//           message: "Đơn hàng đã được hoàn tiền",
//           refundAmount: refundAmount,
//         });
//       } else {
//         console.log("Không phải thanh toán qua Stripe");
//       }

//       // Phát sự kiện WebSocket sau khi cập nhật trạng thái đơn hàng
//       io.emit("orderStatusUpdated", {
//         message: "Trạng thái đơn hàng đã được cập nhật",
//         orderId: request.order._id,
//         status: request.order.statusOrder,
//       });
//     }

//     return res.status(200).json({
//       message: "Cập nhật yêu cầu thành công",
//       data: request,
//       success: true,
//     });
//   } catch (error) {
//     console.error("Lỗi cập nhật yêu cầu:", error);
//     return res.status(500).json({
//       message: "Lỗi máy chủ",
//       error: error.message,
//       success: false,
//     });
//   }
// };
