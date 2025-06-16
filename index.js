const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const http = require("http");
const socketIo = require("socket.io");
const productRouter = require("./router/product.router");
const CategoryRouter = require("./router/category.router");
const OrderRouter = require("./router/order.router");
const userRouter = require("./router/user.router");
const CartRouter = require("./router/cart.router");
const ServiceRouter = require("./router/service.router");
const RequestRouter = require("./router/request.router");
const WalletRouter = require("./router/wallet.router");
const DisCountRouter = require("./router/discount.router");
const DashBoard = require("./router/dashbroad.router");
const CustomRouter = require("./router/custom.router");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const startDiscountOrderCronJob = require("./utils/discountOrderCron");
dotenv.config();

const app = express();
const server = http.createServer(app);

// CORS configuration for Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // your frontend URL
    methods: ["GET", "POST"], // allowed methods
    credentials: true, // allows cookies or authorization headers
  },
});

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/product", productRouter);
app.use("/category", CategoryRouter);
app.use("/auth", userRouter);
app.use("/order", OrderRouter);
app.use("/cart", CartRouter);
app.use("/service", ServiceRouter);
app.use("/request", RequestRouter);
app.use("/wallet", WalletRouter);
app.use("/discount", DisCountRouter);
app.use("/admin", DashBoard);
app.use("/custome", CustomRouter);
mongoose
  .connect(`mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASSWORD}@exe2fashion.gclrrba.mongodb.net/`)
  .then(() => {
    console.log("Connected to DB");
    app.set("io", io);
    io.on("connection", (socket) => {
      console.log("A user connected");

      // Test emit after a connection is made
      io.emit("testEvent", { message: "Connection successful!" });

      socket.on("disconnect", () => {
        console.log("User disconnected");
      });
    });

    server.listen(process.env.PORT, () => {
      console.log(`App is running on port ${process.env.PORT}`);
    });

    startDiscountOrderCronJob();
  })
  .catch((error) => {
    console.error("Connection failed:", error.message);
  });

module.exports = io;
